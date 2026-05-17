import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "../../logger";
import type { Art } from "../../../types";
import { context, ART_DIR, CONTENT_DIR } from "../utils/context";
import { validateImage, copyImage, generateThumbnail } from "../utils/image";
import { generateSlug, generateArtYAML, buildArtGallery } from "../utils/art";
import { ask, exit } from "../utils/cli";
import { pushToRemote } from "../utils/git";

export async function add(args: string[]) {
    if (args.length === 0) {
        Logger.error("Please provide the path to the image you want to add.");
        exit(1);
    }
    Logger.info(
        `Adding new art with ${args.length} image${args.length > 1 ? "s" : ""}...`,
    );
    Logger.nl();

    for (const imagePath of args) {
        if (!(await validateImage(imagePath))) {
            exit(1);
        }
    }

    Logger.log("▌ What's the title?");
    const title = await ask({ required: true });
    const slug = generateSlug(title);

    Logger.log("▌ What's the description? (optional)");
    const description = await ask();

    Logger.log("▌ What are the tags? (comma-separated, optional)");
    const tagsInput = await ask();
    const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

    Logger.log(
        "▌ Is this general or character-specific art? Enter character name or leave blank for general.",
    );
    const character = await ask({ default: "General Art" });

    let related_characters: string[] = [];
    if (character) {
        Logger.log(
            "▌ Any other characters that appear? (comma-separated, optional)",
        );
        const relatedInput = await ask();
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
    const defaultDate = modifiedTimes[0]
        ? modifiedTimes[0].toISOString()
        : new Date().toISOString();
    Logger.log(
        `▌ When was the image created? ${modifiedTimes[0] ? `(Detected: ${modifiedTimes[0].toLocaleString()}. Leave blank to use this date.)` : "(Couldn't detect a modification time. Leave blank to use current time.)"}`,
    );
    const created_at_input = await ask({
        default: defaultDate,
        validate: (value) => {
            const date = new Date(value);
            return isNaN(date.getTime())
                ? `"${value}" is not a valid date. Try a format like YYYY-MM-DD or leave blank to use the detected date.`
                : true;
        },
    });
    const created_at = new Date(created_at_input).toISOString();

    Logger.log("▌ Is this a sketch? (y/N)");
    const sketchInput = await ask({ default: "N" });
    const sketch = sketchInput.charAt(0).toLowerCase() === "y";

    Logger.log("▌ Should this be pinned? (y/N)");
    const pinnedInput = await ask({ default: "N" });
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

    if (!context.dryRun) {
        fs.mkdirSync(basePublicDir, { recursive: true });
        fs.mkdirSync(thumbsDir, { recursive: true });
    }

    // Map original basenames to full source paths for lookup
    const sourceMap = new Map<string, string>();
    for (const arg of args) {
        sourceMap.set(path.basename(arg), arg);
    }

    // Copy images, generate thumbnails, and replace placeholder URLs
    const stagedFiles: string[] = [];
    for (const img of images) {
        const srcBasename = path.basename(img.image_url);
        const sourcePath = sourceMap.get(srcBasename);
        if (!sourcePath) {
            Logger.error(
                `Could not find source file for ${Logger.inlineBold(srcBasename)}`,
            );
            exit(1);
        }
        const ext = path.extname(sourcePath);
        const dest = path.join(basePublicDir, `${img.id}${ext}`);
        await copyImage(sourcePath, dest);

        const thumbDest = path.join(thumbsDir, `${img.id}.webp`);
        if (!context.dryRun) await generateThumbnail(dest, thumbDest);
        stagedFiles.push(dest, thumbDest);

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
                if (!context.dryRun)
                    await generateThumbnail(varDest, varThumbDest);
                stagedFiles.push(varDest, varThumbDest);

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
    if (context.shouldPush) {
        stagedFiles.push(yamlPath);
        await pushToRemote(stagedFiles, `ARTCLI: upload ${title}`);
    }
    exit(0);
}
