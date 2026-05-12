// ECHOLOTL ARTCLI
// The command-line tool used to manage art assets and metadata for echolotl.lol

import sharp from "sharp";
import { Logger } from "./logger";
import { generateThumbnail } from "./thumbnails";
import type { Art, ArtImageVariant, ArtImage } from "../types";
import * as yaml from "js-yaml";
import * as fs from "node:fs";
import * as path from "node:path";
import { createInterface } from "node:readline/promises";

const ART_DIR = "public/art"; // Where the art images will be stored
const CONTENT_DIR = "content/art"; // Where the art metadata will be stored

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

// --------------------
// IMAGE UTILITIES
// --------------------

async function validateImage(path: string): Promise<boolean> {
    // First, check if the file exists
    if (!fs.existsSync(path)) {
        Logger.error(`Couldn't find "${path}"`);
        return false;
    }

    // then check if the file is a valid image
    try {
        await sharp(path).metadata();
    } catch (error) {
        Logger.error(`Invalid image file at "${path}"`);
        return false;
    }

    return true;
}

async function copyImage(source: string, destination: string): Promise<void> {
    if (!await validateImage(source)) return;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
    Logger.info(`Copied image from ${Logger.inlineBold(source)} to ${Logger.inlineBold(destination)}`);
}

// --------------------
// ART UTILITIES
// --------------------

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function generateArtYAML(art: Art, savePath: string): void {
    const yamlDir = path.dirname(savePath);
    fs.mkdirSync(yamlDir, { recursive: true });
    const yamlContent = yaml.dump(art, {
        lineWidth: 80,
        indent: 4,
        noRefs: true,
    });
    fs.writeFileSync(savePath, yamlContent);
    Logger.success(`Saved art metadata to ${Logger.inlineBold(savePath)}`);
}

async function buildArtGallery(
    paths: string[],
    slug: string,
): Promise<ArtImage[] | null> {
    const artImages: ArtImage[] = [];
    let baseIndex = 0;

    for (let i = 0; i < paths.length; i++) {
        const imagePath = paths[i]!;
        Logger.info(
            `Processing image ${i + 1} of ${paths.length}: ${Logger.inlineBold(imagePath)}`,
        );

        let attachAsVariant = false;
        if (artImages.length > 0) {
            const answer = await rl.question(
                "Attach as variant of previous image? (y/N): ",
            );
            attachAsVariant = answer.charAt(0).toLowerCase() === "y";
        }

        if (attachAsVariant) {
            const base = artImages[baseIndex]!;
            if (!base.variants) {
                base.variants = [];
            }

            Logger.dim("Enter a name for this variant:");
            const label = await rl.question("▌ ");

            Logger.dim("Enter alt text for this variant (optional):");
            const alt = await rl.question("▌ ");

            base.variants.push({
                image_url: path.join(
                    "/art",
                    slug,
                    path.basename(imagePath),
                ), // Placeholder path, will be replaced with actual URL after copying
                label: label || undefined,
                alt: alt || undefined,
            });
        } else {
            Logger.dim("Image title (optional):");
            const title = await rl.question("▌ ");
            
            Logger.dim("Enter alt text for this image (optional):");
            const alt = await rl.question("▌ ");
            const titleSlug = title ? generateSlug(title) : slug;
            let idCandidate = titleSlug;
            let idSuffix = 1;
            while (artImages.some((img) => img.id === idCandidate)) {
                idSuffix++;
                idCandidate = `${titleSlug}-${idSuffix}`;
            }
            const id = idCandidate;

            artImages.push({
                id,
                title: title || undefined,
                image_url: path.join(
                    "/art",
                    slug,
                    path.basename(imagePath),
                ),
                alt: alt || undefined,
            });
            baseIndex = artImages.length - 1;
        }
    }

    return artImages.length > 0 ? artImages : null;
}

// --------------------
// CLI UTILITIES
// --------------------

function printUsage() {
    Logger.log(Logger.inlineUnderline(Logger.inlineBold(Logger.inlineColor("#da39a4", "\necholotl's ARTCLI usage:\n"))));
    Logger.statement("tsx scripts/artcli.ts add <image-paths...>");
    Logger.dim("- Adds a new piece of art with the specified image through an interactive questionnaire.");
    Logger.log("");
}

function exit(code: number = 0): never {
    rl.close();
    process.exit(code);
}

// --------------------
// MODES
// --------------------

async function addArt(args: string[]) {
    if (args.length === 0) {
        Logger.error("Please provide the path to the image you want to add.");
        exit(1);
    }
    Logger.info(
        `Adding new art with ${args.length} image${args.length > 1 ? "s" : ""}...`,
    );

    for (const imagePath of args) {
        if (!(await validateImage(imagePath))) {
            exit(1);
        }
    }

    let title = "";
    while (!title) {
        Logger.dim("What's the title?");
        title = await rl.question("▌ ");
        if (!title) {
            Logger.error("Title is required!");
        }
    }
    const slug = generateSlug(title);

    Logger.dim("What's the description? (optional)");
    const description = await rl.question("▌ ");

    Logger.dim("What are the tags? (comma-separated, optional)");
    const tagsInput = await rl.question("▌ ");
    const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

    Logger.dim(
        "Is this general or character-specific art? Enter character name or leave blank for general.",
    );
    const character = await rl.question("▌ ");

    let related_characters: string[] = [];
    if (character) {
        Logger.dim(
            "Any other characters that appear? (comma-separated, optional)",
        );
        const relatedInput = await rl.question("▌ ");
        related_characters = relatedInput
            .split(",")
            .map((name) => name.trim())
            .filter((name) => name.length > 0);
    }

    

    const modifiedTimes = args
        .map((imagePath) => {
            return fs.statSync(imagePath).mtime;
        })
        .sort((a, b) => b.getTime() - a.getTime());
    Logger.dim(
        `When was the image created? ${modifiedTimes[0] ? `(Detected: ${modifiedTimes[0].toLocaleString()}. Leave blank to use this date.)` : "(Couldn't detect a modification time. Leave blank to use current time.)"}`,
    );
    const created_at_input = await rl.question("▌ ");
    const created_at = created_at_input
        ? new Date(created_at_input).toISOString()
        : modifiedTimes[0]
          ? modifiedTimes[0].toISOString()
          : new Date().toISOString();

    Logger.dim("Is this a sketch? (y/N)");
    const sketchInput = await rl.question("▌ ");
    const sketch = sketchInput.charAt(0).toLowerCase() === "y";

    Logger.dim("Should this be pinned? (y/N)");
    const pinnedInput = await rl.question("▌ ");
    const pinned = pinnedInput.charAt(0).toLowerCase() === "y";

    // Build the gallery (collects metadata for each image)
    const images = await buildArtGallery(args, slug);
    if (!images) {
        Logger.error("Failed to build gallery.");
        exit(1);
    }

    // Determine destination paths
    const isCharacter = !!character;

    const basePublicDir = isCharacter
        ? path.join(ART_DIR, "characters", character)
        : path.join(ART_DIR, "general");

    const thumbsDir = path.join(basePublicDir, "thumbnails");
    
    const yamlPath = isCharacter
        ? path.join(CONTENT_DIR, "characters", character, `${slug}.yml`)
        : path.join(CONTENT_DIR, "general", `${slug}.yml`);

    if (fs.existsSync(yamlPath)) {
        Logger.error(`Art with slug "${slug}" already exists at ${yamlPath}`);
        exit(1);
    }

    fs.mkdirSync(basePublicDir, { recursive: true });
    fs.mkdirSync(thumbsDir, { recursive: true });

    // Map original basenames to full source paths for lookup
    const sourceMap = new Map<string, string>();
    for (const arg of args) {
        sourceMap.set(path.basename(arg), arg);
    }

    // Copy images, generate thumbnails, and replace placeholder URLs
    for (const img of images) {
        const srcBasename = path.basename(img.image_url);
        const sourcePath = sourceMap.get(srcBasename);
        if (!sourcePath) {
            Logger.error(`Could not find source file for ${Logger.inlineBold(srcBasename)}`);
            exit(1);
        }
        const ext = path.extname(sourcePath);
        const dest = path.join(basePublicDir, `${img.id}${ext}`);
        await copyImage(sourcePath, dest);

        const thumbDest = path.join(thumbsDir, `${img.id}.webp`);
        await generateThumbnail(dest, thumbDest);

        img.image_url =
            "/" +
            dest
                .replace(/\\/g, "/")
                .replace(/^public\//, "")
                .split("/")
                .map(encodeURIComponent)
                .join("/");
        img.thumbnail_url =
            "/" +
            thumbDest
                .replace(/\\/g, "/")
                .replace(/^public\//, "")
                .split("/")
                .map(encodeURIComponent)
                .join("/");

        if (img.variants) {
            for (let v = 0; v < img.variants.length; v++) {
                const variant = img.variants[v]!;
                const varSrcBasename = path.basename(variant.image_url);
                const varSourcePath = sourceMap.get(varSrcBasename);
                if (!varSourcePath) {
                    Logger.error(
                        `Could not find source file for variant ${Logger.inlineBold(varSrcBasename)}`,
                    );
                    exit(1);
                }
                const varExt = path.extname(varSourcePath);
                const varSlug = generateSlug(
                    variant.label || `variant-${v + 1}`,
                );
                const varDest = path.join(
                    basePublicDir,
                    `${img.id}__${varSlug}${varExt}`,
                );
                await copyImage(varSourcePath, varDest);

                const varThumbDest = path.join(
                    thumbsDir,
                    `${img.id}__${varSlug}.webp`,
                );
                await generateThumbnail(varDest, varThumbDest);

                variant.image_url =
                    "/" +
                    varDest
                        .replace(/\\/g, "/")
                        .replace(/^public\//, "")
                        .split("/")
                        .map(encodeURIComponent)
                        .join("/");
                variant.thumbnail_url =
                    "/" +
                    varThumbDest
                        .replace(/\\/g, "/")
                        .replace(/^public\//, "")
                        .split("/")
                        .map(encodeURIComponent)
                        .join("/");
            }
        }
    }

    const art: Art = {
        slug,
        created_at,
        modified_at: new Date().toISOString(),
        title,
        pinned,
        sketch,
        images,
    };
    if (description) art.description = description;
    if (tags.length) art.tags = tags;
    if (character) art.character = character;
    if (related_characters.length) art.related_characters = related_characters;

    generateArtYAML(art, yamlPath);
    exit(0);
}

// --------------------

async function main() {
    const [command, ...args] = process.argv.slice(2);
    switch (command) {
        case "add":
            await addArt(args);
            break;
        default:
            printUsage();
            exit(0);
    }
}

main();
