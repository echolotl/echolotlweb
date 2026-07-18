import { Logger } from "../../logger";
import { exit } from "../utils/cli";
import { generateThumbnail } from "../utils/image";
import { context } from "../utils/context";
import * as fs from "fs";
import * as path from "path";
import { dump, load } from "js-yaml";
import { pushToRemote } from "../utils/git";
import type { Point } from "../../../types";

const extensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

type ThumbnailMetadata = {
  thumbnail_focus?: Point;
  thumbnail_scale?: number;
};

function buildThumbnailMetadataIndex(): Map<string, ThumbnailMetadata> {
  const metadataByImagePath = new Map<string, ThumbnailMetadata>();
  const contentArtDir = path.join("content", "art");
  const directoriesToScan = [
    path.join(contentArtDir, "general"),
    path.join(contentArtDir, "characters"),
  ];

  const yamlFiles: string[] = [];
  for (const scanDir of directoriesToScan) {
    if (!fs.existsSync(scanDir)) continue;

    for (const entry of fs.readdirSync(scanDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".yml")) {
        yamlFiles.push(path.join(scanDir, entry.name));
      }
      if (entry.isDirectory()) {
        const nestedDir = path.join(scanDir, entry.name);
        for (const nestedEntry of fs.readdirSync(nestedDir, {
          withFileTypes: true,
        })) {
          if (nestedEntry.isFile() && nestedEntry.name.endsWith(".yml")) {
            yamlFiles.push(path.join(nestedDir, nestedEntry.name));
          }
        }
      }
    }
  }

  function toPublicRelativePathFromUrl(url: string): string {
    const withoutQuery = url.split(/[?#]/)[0] ?? "";
    const trimmed = withoutQuery.replace(/^\/+/, "");
    return trimmed
      .split("/")
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      })
      .join("/");
  }

  for (const yamlPath of yamlFiles) {
    try {
      const yamlContent = fs.readFileSync(yamlPath, "utf8");
      const data = load(yamlContent) as { images?: unknown[] };
      const images = Array.isArray(data?.images) ? data.images : [];

      for (const image of images) {
        if (!image || typeof image !== "object") continue;
        const base = image as {
          image_url?: unknown;
          thumbnail_focus?: unknown;
          thumbnail_scale?: unknown;
          variants?: unknown;
        };

        if (typeof base.image_url === "string") {
          const key = toPublicRelativePathFromUrl(base.image_url);
          metadataByImagePath.set(key, {
            thumbnail_focus:
              typeof base.thumbnail_focus === "object" &&
              base.thumbnail_focus !== null
                ? (base.thumbnail_focus as Point)
                : undefined,
            thumbnail_scale:
              typeof base.thumbnail_scale === "number"
                ? base.thumbnail_scale
                : undefined,
          });
        }

        if (!Array.isArray(base.variants)) continue;
        for (const variant of base.variants) {
          if (!variant || typeof variant !== "object") continue;
          const variantImage = variant as {
            image_url?: unknown;
            thumbnail_focus?: unknown;
            thumbnail_scale?: unknown;
          };

          if (typeof variantImage.image_url !== "string") continue;
          const key = toPublicRelativePathFromUrl(variantImage.image_url);
          metadataByImagePath.set(key, {
            thumbnail_focus:
              typeof variantImage.thumbnail_focus === "object" &&
              variantImage.thumbnail_focus !== null
                ? (variantImage.thumbnail_focus as Point)
                : undefined,
            thumbnail_scale:
              typeof variantImage.thumbnail_scale === "number"
                ? variantImage.thumbnail_scale
                : undefined,
          });
        }
      }
    } catch {
      Logger.warning(`Failed to parse YAML file ${yamlPath}, skipping...`);
    }
  }

  return metadataByImagePath;
}

async function updateContentFile(
  imagePath: string,
  thumbnailPath: string,
): Promise<void> {
  if (context.dryRun) {
    Logger.warning(
      `[DRYRUN] Would update content file for ${Logger.fmtBold(imagePath)} with thumbnail ${Logger.fmtBold(thumbnailPath)}`,
    );
    return;
  }
  try {
    // Convert public art path to content art path
    const relativePath = path.relative("public/art", imagePath);
    const [category, ...pathParts] = relativePath.split(/[/\\]/);

    let searchDir: string;
    if (category === "characters" && pathParts.length >= 2) {
      // CHARACTERS: search in content/art/characters/:slug/
      const characterName = pathParts[0];
      searchDir = path.join("content", "art", "characters", characterName!);
    } else if (category === "general") {
      // GENERAL: search in content/art/general/
      searchDir = path.join("content", "art", "general");
    } else {
      // If the image is not in a recognized category, skip it
      Logger.warning(
        `Image ${imagePath} is not in a recognized category, skipping...`,
      );
      return;
    }

    if (!fs.existsSync(searchDir)) {
      Logger.warning(
        `Search directory ${searchDir} does not exist, skipping...`,
      );
      return;
    }

    // Generate the expected image URL that should be in the YAML file
    const expectedImageUrl =
      "/" + path.relative("public", imagePath).replace(/\\/g, "/");

    // Search through all YAML files in the directory
    const files = fs.readdirSync(searchDir);
    for (const file of files) {
      if (!file.endsWith(".yml")) continue;

      const yamlPath = path.join(searchDir, file);
      try {
        const yamlContent = fs.readFileSync(yamlPath, "utf8");
        const data = load(yamlContent) as Record<string, unknown>;
        const expectedThumbnailUrl =
          "/" + path.relative("public", thumbnailPath).replace(/\\/g, "/");

        if (
          data &&
          data.image_url === expectedImageUrl &&
          data.thumbnail_url !== expectedThumbnailUrl
        ) {
          // Update the thumbnail URL in the YAML file
          data.thumbnail_url = expectedThumbnailUrl;
          data.modified_at = new Date().toISOString();
          const newYamlContent = dump(data, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
          });
          fs.writeFileSync(yamlPath, newYamlContent, "utf8");
          Logger.info(
            `Updated thumbnail URL in ${yamlPath} to ${expectedThumbnailUrl}`,
          );
          return;
        }
      } catch {
        // Skip invalid YAML files
        Logger.warning(`Failed to parse YAML file ${yamlPath}, skipping...`);
        continue;
      }
    }

    return;
  } catch {
    return;
  }
}

export async function regenthumb(args: string[]) {
  var thumbnailsToRegenerate: string[] = [];
  const startTime = Date.now();
  const thumbnailMetadataByImagePath = buildThumbnailMetadataIndex();
  // Get all art pieces in public/art/characters and public/art/general (or the slug specified in args) and add them to thumbnailsToRegenerate
  // Then regenerate the thumbnail for each piece of art that doesn't exist (or if --force is specified)
  const artDirs = ["characters", "general"];
  for (const artDir of artDirs) {
    const dirPath = path.join("public", "art", artDir);
    if (!fs.existsSync(dirPath)) {
      Logger.warning(`Directory ${dirPath} does not exist, skipping...`);
      continue;
    }
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip thumbnails directory; recurse into character subdirectories
        if (file === "thumbnails") {
          continue;
        }
        const subFiles = fs.readdirSync(fullPath);
        for (const subFile of subFiles) {
          const subFullPath = path.join(fullPath, subFile);
          const subStat = fs.statSync(subFullPath);
          if (
            !subStat.isDirectory() &&
            extensions.includes(path.extname(subFile).toLowerCase())
          ) {
            const slug = path.parse(subFile).name;
            if (args.length === 0 || args.includes(slug)) {
              thumbnailsToRegenerate.push(subFullPath);
            }
          }
        }
      } else if (extensions.includes(path.extname(file).toLowerCase())) {
        const slug = path.parse(file).name;
        if (args.length === 0 || args.includes(slug)) {
          thumbnailsToRegenerate.push(fullPath);
        }
      }
    }
  }

  let regenerated = [];
  let skipped = 0;
  let failed = 0;
  for (const imagePath of thumbnailsToRegenerate) {
    const thumbnailPath = path.join(
      path.dirname(imagePath),
      "thumbnails",
      path.parse(imagePath).name + ".webp",
    );
    if (!fs.existsSync(thumbnailPath) || context.force) {
      if (context.dryRun) {
        Logger.info(
          `Would regenerate thumbnail for ${Logger.fmtBold(imagePath)} to ${Logger.fmtBold(thumbnailPath)}`,
        );
        regenerated.push(imagePath);
        continue;
      }
      try {
        const imageKey = path.relative("public", imagePath).replace(/\\/g, "/");
        const thumbnailMetadata = thumbnailMetadataByImagePath.get(imageKey);
        await generateThumbnail(
          imagePath,
          thumbnailPath,
          thumbnailMetadata?.thumbnail_focus,
          thumbnailMetadata?.thumbnail_scale,
        );
        await updateContentFile(imagePath, thumbnailPath);
        Logger.success(
          `Generated thumbnail for ${Logger.fmtBold(imagePath)} to ${Logger.fmtBold(path.basename(thumbnailPath))}`,
        );
        regenerated.push(imagePath);
      } catch (error) {
        Logger.error(
          `Failed to generate thumbnail for ${Logger.fmtBold(imagePath)}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        failed++;
      }
    } else {
      Logger.dim(
        `Thumbnail already exists for ${Logger.fmtBold(imagePath)}, skipping...`,
      );
      skipped++;
    }
  }
  const endTime = Date.now();
  const duration = endTime - startTime;
  if (context.noLog && !context.shouldExit) {
    Logger.noLogBypass(() =>
      Logger.statement(
        `${Logger.fmtReverse(Logger.fmtBold(" ARTCLI ")) + Logger.fmtHexBg("#744780", `${Logger.fmtHex("#000000", " regenthumb ")}`)} Regenerated ${regenerated.length} thumbnail${regenerated.length !== 1 ? "s" : ""} in ${Math.round(duration)}ms. ${Logger.fmtDim(`(skipped ${skipped}, failed ${failed})`)}`,
      ),
    );
  } else {
    Logger.statement(
      `Regenerated ${regenerated.length} thumbnail${regenerated.length !== 1 ? "s" : ""} in ${Math.round(duration)}ms. ${Logger.fmtDim(`(skipped ${skipped}, failed ${failed})`)}`,
    );
  }

  if (context.shouldPush) {
    const pushMessage =
      regenerated.length > 1
        ? `Regenerate ${regenerated.length} thumbnails`
        : `Regenerate thumbnail for "${path.basename(thumbnailsToRegenerate[0] ?? "an art piece")}"`;
    await pushToRemote(regenerated, pushMessage);
  }

  exit(0);
}
