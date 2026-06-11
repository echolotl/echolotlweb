import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "../../logger";
import type { Art, ArtImage } from "../../../types";
import { context, ART_DIR, CONTENT_DIR } from "../utils/context";
import { validateImage, copyImage, generateThumbnail } from "../utils/image";
import { generateSlug, generateArtYAML } from "../utils/art";
import { ask, exit } from "../utils/cli";
import { pushToRemote } from "../utils/git";
import { parseCommaSeparated } from "../utils/parse";

type PlacementChoice = "variant" | "gallery" | "new";

type ArtDraft = Omit<Art, "modified_at">;

/**
 * Gets a unique ID based on the slug provided or generated from the title.
 * @param images Existing images in the art piece to ensure uniqueness against.
 * @param slug The base slug to use for generating the ID.
 * @param title Optional, will generate a slug from the title instead.
 * @returns The unique ID.
 */
function getImageId(images: ArtImage[], slug: string, title?: string): string {
  const titleSlug = title ? generateSlug(title) : slug;
  let idCandidate = titleSlug;
  let suffix = 1;
  while (images.some((image) => image.id === idCandidate)) {
    suffix++;
    idCandidate = `${titleSlug}-${suffix}`;
  }
  return idCandidate;
}

/**
 * Handles the variant/gallery/new choice.
 * @returns "variant", "gallery", or "new" based on input
 */
async function askPlacementChoice(): Promise<PlacementChoice> {
  Logger.log(
    "▌ Do you want to add this as a variant, gallery image, or create a new art piece? (variant/gallery/new)",
  );
  var choice: string = "";
  await ask({
    default: "gallery",
    validate: (value) => {
      choice = value.trim().toLowerCase().charAt(0);

      return choice === "v" || choice === "g" || choice === "n"
        ? true
        : 'Please enter "variant", "gallery", or "new".';
    },
  });

  switch (choice) {
    case "v":
      return "variant";
    case "g":
      return "gallery";
    case "n":
      return "new";
    default:
      // This should never happen
      throw new Error("Invalid placement choice");
  }
}

/**
 * Collects metadata for an art piece by prompting the user with a series of questions.
 * @param defaultDate The default creation date to use if the user doesn't provide one.
 * @param detectedModifiedTime The modification time detected from the image file, if available.
 * @returns A draft of the art piece metadata.
 */
async function collectArtMetadata(
  defaultDate: string,
  detectedModifiedTime?: Date,
): Promise<ArtDraft> {
  Logger.log("▌ What's the title?");
  const title = await ask({ required: true });
  const slug = generateSlug(title);

  Logger.log("▌ What's the description? (optional)");
  const description = await ask();

  Logger.log("▌ What are the tags? (comma-separated, optional)");
  const tagsInput = await ask();
  const tags = parseCommaSeparated(tagsInput);

  Logger.log(
    "▌ Is this general or character-specific art? Enter character name or leave blank for general.",
  );
  const character = await ask({ default: "General Art" });

  let related_characters: string[] = [];
  if (character) {
    Logger.log("▌ Any other characters that appear? (comma-separated, optional)");
    const relatedInput = await ask();
    related_characters = parseCommaSeparated(relatedInput);
  }

  Logger.log(
    `▌ When was the image created? ${detectedModifiedTime ? `(Detected: ${detectedModifiedTime.toLocaleString()}. Leave blank to use this date.)` : "(Couldn't detect a modification time. Leave blank to use current time.)"}`,
  );
  const created_at_input = await ask({
    default: defaultDate,
    validate: (value) => {
      const date = new Date(value);
      return isNaN(date.getTime())
        ? `"${value}" is not a valid date. Try YYYY-MM-DD or leave blank to use the detected date.`
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

  const draft: ArtDraft = {
    slug,
    created_at,
    title,
    pinned,
    sketch,
    images: [],
  };
  if (description) draft.description = description;
  if (tags.length) draft.tags = tags;
  if (character) draft.character = character;
  if (related_characters.length) draft.related_characters = related_characters;

  return draft;
}

/**
 * Adds a new art piece with one or more images.
 * The first image will be added as the main art piece, and subsequent images
 * can be added as variants or gallery images, or used to create new art pieces.
 * @param args[] Paths to the image files to add
 */
export async function add(args: string[]) {
  if (args.length === 0) {
    Logger.error("Please provide the path to the image you want to add.");
    exit(1);
  }
  Logger.info(`Processing ${args.length} image${args.length > 1 ? "s" : ""}...`);
  Logger.nl();

  for (const imagePath of args) {
    if (!(await validateImage(imagePath))) {
      exit(1);
    }
  }

  const modifiedTimes = args
    .map((imagePath) => {
      return fs.statSync(imagePath).mtime;
    })
    .sort((a, b) => b.getTime() - a.getTime());
  const defaultDate = modifiedTimes[0] ? modifiedTimes[0].toISOString() : new Date().toISOString();
  const artDrafts: ArtDraft[] = [];

  let currentDraft: ArtDraft | null = null;
  let lastBaseImageIndex = -1;

  for (let i = 0; i < args.length; i++) {
    const imagePath = args[i]!;
    Logger.info(`Image #${i + 1} (${Logger.fmtBold(path.basename(imagePath))})`);

    if (!currentDraft) {
      currentDraft = await collectArtMetadata(defaultDate, modifiedTimes[0]);
      artDrafts.push(currentDraft);
      lastBaseImageIndex = -1;
    }

    let placement: PlacementChoice = "gallery";
    if (i > 0) {
      placement = await askPlacementChoice();
      if (placement === "new") {
        currentDraft = await collectArtMetadata(defaultDate, modifiedTimes[0]);
        artDrafts.push(currentDraft);
        lastBaseImageIndex = -1;
        placement = "gallery";
      }
    }

    const draft = currentDraft;
    if (!draft) {
      Logger.error("Failed to initialize art metadata.");
      exit(1);
    }

    if (placement === "variant") {
      const baseImage = draft.images[lastBaseImageIndex];
      if (!baseImage) {
        Logger.warning(
          "No gallery image exists in this art piece yet. Adding as a gallery image instead.",
        );
      } else {
        if (!baseImage.variants) baseImage.variants = [];

        Logger.log("▌ Enter a name for this variant:");
        const label = await ask();

        Logger.log("▌ Enter alt text for this variant (optional):");
        const alt = await ask();

        baseImage.variants.push({
          image_url: path.join("/art", draft.slug, path.basename(imagePath)),
          label: label || undefined,
          alt: alt || undefined,
        });
        continue;
      }
    }

    Logger.log("▌ Image title (optional):");
    const imageTitle = await ask();

    Logger.log("▌ Enter alt text for this image (optional):");
    const imageAlt = await ask();

    const id = getImageId(draft.images, draft.slug, imageTitle || undefined);
    draft.images.push({
      id,
      title: imageTitle || undefined,
      image_url: path.join("/art", draft.slug, path.basename(imagePath)),
      alt: imageAlt || undefined,
    });
    lastBaseImageIndex = draft.images.length - 1;
  }

  if (artDrafts.some((draft) => draft.images.length === 0)) {
    Logger.error("One of the art pieces has no images.");
    exit(1);
  }

  // Map original basenames to full source paths for lookup
  const sourceMap = new Map<string, string[]>();
  for (const arg of args) {
    const basename = path.basename(arg);
    const existing = sourceMap.get(basename);
    if (existing) {
      existing.push(arg);
    } else {
      sourceMap.set(basename, [arg]);
    }
  }

  const yamlPaths = new Set<string>();
  for (const draft of artDrafts) {
    const isCharacter = !!draft.character;
    const yamlPath = isCharacter
      ? path.join(CONTENT_DIR, "characters", draft.character!, `${draft.slug}.yml`)
      : path.join(CONTENT_DIR, "general", `${draft.slug}.yml`);

    if (yamlPaths.has(yamlPath) || fs.existsSync(yamlPath)) {
      Logger.error(`Art with slug "${draft.slug}" already exists at ${yamlPath}`);
      exit(1);
    }
    yamlPaths.add(yamlPath);
  }

  // Copy images, generate thumbnails, and replace placeholder URLs
  const stagedFiles: string[] = [];

  for (const draft of artDrafts) {
    const isCharacter = !!draft.character;
    const basePublicDir = isCharacter
      ? path.join(ART_DIR, "characters", draft.character!)
      : path.join(ART_DIR, "general");
    const thumbsDir = path.join(basePublicDir, "thumbnails");
    const yamlPath = isCharacter
      ? path.join(CONTENT_DIR, "characters", draft.character!, `${draft.slug}.yml`)
      : path.join(CONTENT_DIR, "general", `${draft.slug}.yml`);

    if (!context.dryRun) {
      fs.mkdirSync(basePublicDir, { recursive: true });
      fs.mkdirSync(thumbsDir, { recursive: true });
    }

    for (const img of draft.images) {
      const srcBasename = path.basename(img.image_url);
      const sourceCandidates = sourceMap.get(srcBasename);
      if (!sourceCandidates || sourceCandidates.length === 0) {
        Logger.error(`Could not find source file for ${Logger.fmtBold(srcBasename)}`);
        exit(1);
      }
      if (sourceCandidates.length > 1) {
        Logger.error(
          `Multiple source files share the same filename ${Logger.fmtBold(srcBasename)}. Please use unique filenames.`,
        );
        exit(1);
      }
      const sourcePath = sourceCandidates[0]!;
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
          const varSourceCandidates = sourceMap.get(varSrcBasename);
          if (!varSourceCandidates || varSourceCandidates.length === 0) {
            Logger.error(
              `Could not find source file for variant ${Logger.fmtBold(varSrcBasename)}`,
            );
            exit(1);
          }
          if (varSourceCandidates.length > 1) {
            Logger.error(
              `Multiple source files share the same filename ${Logger.fmtBold(varSrcBasename)}. Please use unique filenames.`,
            );
            exit(1);
          }
          const varSourcePath = varSourceCandidates[0]!;
          const varExt = path.extname(varSourcePath);
          const varSlug = generateSlug(variant.label || `variant-${v + 1}`);
          const varDest = path.join(basePublicDir, `${img.id}__${varSlug}${varExt}`);
          await copyImage(varSourcePath, varDest);

          const varThumbDest = path.join(thumbsDir, `${img.id}__${varSlug}.webp`);
          if (!context.dryRun) await generateThumbnail(varDest, varThumbDest);
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
      slug: draft.slug,
      created_at: draft.created_at,
      modified_at: new Date().toISOString(),
      title: draft.title,
      pinned: draft.pinned,
      sketch: draft.sketch,
      images: draft.images,
    };
    if (draft.description) art.description = draft.description;
    if (draft.tags?.length) art.tags = draft.tags;
    if (draft.character) art.character = draft.character;
    if (draft.related_characters?.length) art.related_characters = draft.related_characters;

    generateArtYAML(art, yamlPath);
    stagedFiles.push(yamlPath);
  }

  if (context.shouldPush) {
    const pushMessage =
      artDrafts.length === 1
        ? `Upload "${artDrafts[0]!.title}"`
        : `Upload ${artDrafts.length} art pieces`;
    await pushToRemote(stagedFiles, pushMessage);
  }
  exit(0);
}
