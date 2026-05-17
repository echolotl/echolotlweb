import * as yaml from "js-yaml";
import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "../../logger";
import type { Art, ArtImage } from "../../../types";
import { context } from "./context";
import { ask } from "./cli";

export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export function generateArtYAML(art: Art, savePath: string): void {
    const yamlContent = yaml.dump(art, {
        lineWidth: 80,
        indent: 4,
        noRefs: true,
    });
    if (context.dryRun) {
        Logger.warning(
            `[DRYRUN] Would save art metadata to ${Logger.inlineBold(savePath)}`,
        );
        return;
    }
    const yamlDir = path.dirname(savePath);
    fs.mkdirSync(yamlDir, { recursive: true });
    fs.writeFileSync(savePath, yamlContent);
    Logger.success(`Saved art metadata to ${Logger.inlineBold(savePath)}`);
}

export async function buildArtGallery(
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
            const answer = await ask({
                prompt: "▌ Attach as variant of previous image? (y/N): ",
                default: "N",
            });
            attachAsVariant = answer.charAt(0).toLowerCase() === "y";
        }

        if (attachAsVariant) {
            const base = artImages[baseIndex]!;
            if (!base.variants) {
                base.variants = [];
            }

            Logger.log("▌ Enter a name for this variant:");
            const label = await ask();

            Logger.log("▌ Enter alt text for this variant (optional):");
            const alt = await ask();

            base.variants.push({
                image_url: path.join("/art", slug, path.basename(imagePath)),
                label: label || undefined,
                alt: alt || undefined,
            });
        } else {
            Logger.log("▌ Image title (optional):");
            const title = await ask();

            Logger.log("▌ Enter alt text for this image (optional):");
            const alt = await ask();
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
                image_url: path.join("/art", slug, path.basename(imagePath)),
                alt: alt || undefined,
            });
            baseIndex = artImages.length - 1;
        }
    }

    return artImages.length > 0 ? artImages : null;
}
