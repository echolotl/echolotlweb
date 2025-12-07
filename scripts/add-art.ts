import sharp from "sharp";
import { Logger } from "./logger.ts";
import type { Art, ArtImageVariant, ArtImage } from "../types/index.ts";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import * as yaml from "js-yaml";
import { createInterface } from "node:readline/promises";

const PUBLIC_ART_DIR = "public/art";
const CONTENT_ART_DIR = "content/art";

const logger = new Logger("add-art", "magenta");

function createReadlineInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function validateImageFile(imagePath: string): Promise<boolean> {
  const file = Bun.file(imagePath);
  if (!(await file.exists())) {
    logger.error(`Image file not found: ${imagePath}`);
    return false;
  }

  return true;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateThumbnail(
  imagePath: string,
  thumbnailPath: string,
): Promise<void> {
  const thumbnailDir = dirname(thumbnailPath);
  await mkdir(thumbnailDir, { recursive: true });

  await sharp(imagePath)
    .resize(300, 300, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 80 })
    .toFile(thumbnailPath);

  logger.log(`Generated thumbnail: ${thumbnailPath}`);
}

async function copyImageToDestination(
  sourcePath: string,
  destPath: string,
): Promise<void> {
  const destDir = dirname(destPath);
  await mkdir(destDir, { recursive: true });

  const sourceFile = Bun.file(sourcePath);
  await Bun.write(destPath, sourceFile);
  logger.log(`Copied image: ${destPath}`);
}

async function createYamlFile(artData: Art, yamlPath: string): Promise<void> {
  const yamlDir = dirname(yamlPath);
  await mkdir(yamlDir, { recursive: true });

  const yamlContent = yaml.dump(artData, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });

  await Bun.write(yamlPath, yamlContent);
  logger.log(`Created YAML file: ${yamlPath}`);
}

async function buildGallery(
  rl: ReturnType<typeof createReadlineInterface>,
  imagePaths: string[],
  fallbackSlug?: string,
  existingIds?: Set<string>,
): Promise<{ images: ArtImage[] } | null> {
  const images: ArtImage[] = [];
  let baseIndex = 0;
  const usedIds = new Set<string>(existingIds || []);

  function allocateDefaultId(): string {
    if (!fallbackSlug) {
      let n = images.length + 1;
      let candidate = `image-${n}`;
      while (usedIds.has(candidate)) {
        n++;
        candidate = `image-${n}`;
      }
      usedIds.add(candidate);
      return candidate;
    }
    let i = 1;
    let candidate = fallbackSlug;
    while (usedIds.has(candidate)) {
      i++;
      candidate = `${fallbackSlug}-${i}`;
    }
    usedIds.add(candidate);
    return candidate;
  }

  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i];
    if (!(await validateImageFile(src))) {
      logger.error(`Invalid image: ${src}`);
      return null;
    }
    logger.log(`Source ${i + 1}/${imagePaths.length}: ${src}`);

    let attachAsVariant = false;
    if (images.length > 0) {
      const asVar = await rl.question(
        "Make this a variant of the previous base image? (y/N): ",
      );
      attachAsVariant = asVar.toLowerCase().startsWith("y");
    }

    if (attachAsVariant) {
      const base = images[baseIndex];
      if (!base.variants) base.variants = [];
      const label = await rl.question("Variant label (short, optional): ");
      const alt = await rl.question("Variant alt text (recommended): ");
      base.variants.push({
        image_url: `__TEMP_SRC__${src}`,
        label: label || undefined,
        alt: alt || undefined,
      });
      logger.log(
        "Queued variant (will be copied after base images are placed).",
      );
    } else {
      const title = await rl.question("Image title (optional): ");
      const alt = await rl.question("Image alt text (recommended): ");
      const id = title ? generateSlug(title) : allocateDefaultId();

      images.push({
        id,
        title: title || undefined,
        alt: alt || undefined,
        image_url: `__TEMP_SRC__${src}`,
      });
      baseIndex = images.length - 1;
    }
  }
  return { images };
}

async function walkArtYamlFiles(): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string): Promise<void> {
    const dirFile = Bun.file(dir);
    if (!(await dirFile.exists())) return;

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".yml")) {
        out.push(full);
      }
    }
  }

  await walk(CONTENT_ART_DIR);
  return out;
}

async function loadArtBySlug(
  slug: string,
): Promise<{ path: string; data: Art } | null> {
  const files = await walkArtYamlFiles();
  for (const file of files) {
    try {
      const raw = await Bun.file(file).text();
      const data = yaml.load(raw) as Art;
      if (data?.slug === slug) return { path: file, data };
    } catch {
      continue;
    }
  }
  return null;
}

async function ensureImageIds(entry: {
  path: string;
  data: Art;
}): Promise<boolean> {
  let changed = false;
  entry.data.images = entry.data.images || [];
  entry.data.images.forEach((img, idx) => {
    if (!img.id) {
      const segments = img.image_url.split("/");
      const filename = segments[segments.length - 1] || "";
      const base = filename.replace(/\.[a-zA-Z0-9]+$/, "");
      img.id = base || `image-${idx + 1}`;
      changed = true;
    }
  });
  if (changed) await saveArt(entry.path, entry.data);
  return changed;
}

async function saveArt(path: string, data: Art): Promise<void> {
  data.modified_at = new Date().toISOString();
  const content = yaml.dump(data, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
  await Bun.write(path, content);
}

async function listArt(): Promise<void> {
  const files = await walkArtYamlFiles();
  const rows = (
    await Promise.all(
      files.map(async (f) => {
        try {
          const raw = await Bun.file(f).text();
          const d = yaml.load(raw) as Art;
          return {
            slug: d.slug,
            title: d.title,
            count: d.images?.length || 0,
            file: f,
          };
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean) as {
    slug: string;
    title: string;
    count: number;
    file: string;
  }[];

  logger.log(`Found ${rows.length} art entries`);
  for (const r of rows) {
    logger.log(`${r.slug} (${r.count} images) - ${r.title}`);
  }
}

async function showArt(slug: string): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  console.log(yaml.dump(found.data, { indent: 2, lineWidth: -1 }));
}

async function createArt(args: string[]): Promise<void> {
  const rl = createReadlineInterface();
  try {
    if (args.length === 0) {
      logger.error("Provide at least one image path.");
      process.exit(1);
    }
    logger.log(`Creating new art with ${args.length} file(s)`);
    const title = await rl.question("Artwork title: ");
    if (!title) {
      logger.error("Title required.");
      process.exit(1);
    }
    const slug = generateSlug(title);
    const pinned = (await rl.question("Pinned? (y/N): "))
      .toLowerCase()
      .startsWith("y");
    const sketch = (await rl.question("Sketch? (y/N): "))
      .toLowerCase()
      .startsWith("y");
    const description = await rl.question("Description (optional): ");
    const tagsInput = await rl.question("Tags (comma, optional): ");
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const categoryInput = await rl.question(
      "Character art or general? (c/g): ",
    );
    const isCharacter = categoryInput.toLowerCase().startsWith("c");
    let character: string | undefined;
    let related_characters: string[] | undefined;
    if (isCharacter) {
      character = await rl.question("Primary character slug: ");
      if (!character) {
        logger.error("Character slug required.");
        process.exit(1);
      }
      const rel = await rl.question("Related characters (comma, optional): ");
      related_characters = rel
        ? rel
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    }
    const gallery = await buildGallery(rl, args, slug);
    if (!gallery) process.exit(1);
    const basePublicDir = isCharacter
      ? join(PUBLIC_ART_DIR, "characters", character!)
      : join(PUBLIC_ART_DIR, "general");
    const yamlPath = isCharacter
      ? join(CONTENT_ART_DIR, "characters", character!, `${slug}.yml`)
      : join(CONTENT_ART_DIR, "general", `${slug}.yml`);

    const yamlFile = Bun.file(yamlPath);
    if (await yamlFile.exists()) {
      logger.error("YAML already exists.");
      process.exit(1);
    }
    await mkdir(basePublicDir, { recursive: true });
    const thumbsDir = join(basePublicDir, "thumbnails");
    await mkdir(thumbsDir, { recursive: true });

    for (const img of gallery.images) {
      if (img.image_url.startsWith("__TEMP_SRC__")) {
        const originalSrc = img.image_url.replace("__TEMP_SRC__", "");
        const ext = extname(originalSrc);
        const filename = `${img.id}${ext}`;
        const dest = join(basePublicDir, filename);
        await copyImageToDestination(originalSrc, dest);
        const thumbDest = join(thumbsDir, `${img.id}.webp`);
        await generateThumbnail(dest, thumbDest);
        img.image_url = "/" + dest.replace(/\\/g, "/").replace(/^public\//, "");
        img.thumbnail_url =
          "/" + thumbDest.replace(/\\/g, "/").replace(/^public\//, "");
      }
      if (img.variants?.length) {
        for (const v of img.variants) {
          if (!v.image_url.startsWith("__TEMP_SRC__")) continue;
          const originalVarSrc = v.image_url.replace("__TEMP_SRC__", "");
          const extVar = extname(originalVarSrc);
          const slugPart = generateSlug(
            v.label || `variant-${img.variants.indexOf(v) + 1}`,
          );
          const variantName = `${img.id}__${slugPart}${extVar}`;
          const destVar = join(basePublicDir, variantName);
          await copyImageToDestination(originalVarSrc, destVar);
          const thumbVar = join(thumbsDir, `${img.id}__${slugPart}.webp`);
          await generateThumbnail(destVar, thumbVar);
          v.image_url =
            "/" + destVar.replace(/\\/g, "/").replace(/^public\//, "");
          v.thumbnail_url =
            "/" + thumbVar.replace(/\\/g, "/").replace(/^public\//, "");
        }
      }
    }

    const mtimes = await Promise.all(
      args.map(async (p) => (await stat(p)).mtime.getTime()),
    );
    const earliestMtime = new Date(Math.min(...mtimes));
    const defaultCreatedIso = earliestMtime.toISOString();
    const creationInput = await rl.question(
      `Creation date (YYYY-MM-DD or ISO, blank = file date ${defaultCreatedIso.slice(0, 10)}): `,
    );
    let created_at: string;
    if (!creationInput) {
      created_at = defaultCreatedIso;
    } else {
      let parsed: Date | null = null;
      const trimmed = creationInput.trim();
      if (/^now$/i.test(trimmed)) {
        parsed = new Date();
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        parsed = new Date(trimmed + "T00:00:00.000Z");
      } else {
        const tryDate = new Date(trimmed);
        if (!isNaN(tryDate.getTime())) parsed = tryDate;
      }
      if (!parsed) {
        logger.warn(
          "Could not parse creation date, falling back to earliest file mtime.",
        );
        created_at = defaultCreatedIso;
      } else {
        created_at = parsed.toISOString();
      }
    }
    const art: Art = {
      slug,
      created_at,
      modified_at: new Date().toISOString(),
      title,
      pinned,
      sketch: sketch || false,
      images: gallery.images,
    };
    if (description) art.description = description;
    if (tags?.length) art.tags = tags;
    if (character) art.character = character;
    if (related_characters?.length) art.related_characters = related_characters;
    await createYamlFile(art, yamlPath);
    logger.log(`Created art: ${slug}`);
  } finally {
    rl.close();
  }
}

function resolvePublicRoot(art: Art): string {
  return art.character
    ? join(PUBLIC_ART_DIR, "characters", art.character)
    : join(PUBLIC_ART_DIR, "general");
}

async function appendImages(slug: string, images: string[]): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  const rl = createReadlineInterface();
  try {
    const existingIds = new Set(
      found.data.images.map((i) => i.id!).filter(Boolean),
    );
    const gallery = await buildGallery(
      rl,
      images,
      found.data.slug,
      existingIds,
    );
    if (!gallery) process.exit(1);
    const baseDir = resolvePublicRoot(found.data);
    const thumbsDir = join(baseDir, "thumbnails");
    await mkdir(thumbsDir, { recursive: true });

    for (const img of gallery.images) {
      if (img.image_url.startsWith("__TEMP_SRC__")) {
        const original = img.image_url.replace("__TEMP_SRC__", "");
        const ext = extname(original);
        const filename = `${img.id}${ext}`;
        const dest = join(baseDir, filename);
        await copyImageToDestination(original, dest);
        const thumbDest = join(thumbsDir, `${img.id}.webp`);
        await generateThumbnail(dest, thumbDest);
        img.image_url = "/" + dest.replace(/\\/g, "/").replace(/^public\//, "");
        img.thumbnail_url =
          "/" + thumbDest.replace(/\\/g, "/").replace(/^public\//, "");
      }
      if (img.variants?.length) {
        for (const v of img.variants) {
          if (!v.image_url.startsWith("__TEMP_SRC__")) continue;
          const originalVarSrc = v.image_url.replace("__TEMP_SRC__", "");
          const extVar = extname(originalVarSrc);
          const slugPart = generateSlug(
            v.label || `variant-${img.variants.indexOf(v) + 1}`,
          );
          const variantName = `${img.id}__${slugPart}${extVar}`;
          const destVar = join(baseDir, variantName);
          await copyImageToDestination(originalVarSrc, destVar);
          const thumbVar = join(thumbsDir, `${img.id}__${slugPart}.webp`);
          await generateThumbnail(destVar, thumbVar);
          v.image_url =
            "/" + destVar.replace(/\\/g, "/").replace(/^public\//, "");
          v.thumbnail_url =
            "/" + thumbVar.replace(/\\/g, "/").replace(/^public\//, "");
        }
      }
      found.data.images.push(img);
    }
    await saveArt(found.path, found.data);
    logger.log(`Appended images to ${slug}`);
  } finally {
    rl.close();
  }
}

async function addVariantsFlexible(
  slug: string,
  maybeImageId: string | undefined,
  variantFiles: string[],
): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  await ensureImageIds(found);
  const rl = createReadlineInterface();
  try {
    let imageId = maybeImageId;
    if (imageId && (await validateImageFile(imageId))) {
      variantFiles = [imageId, ...variantFiles];
      imageId = undefined;
    }
    if (!variantFiles.length) {
      logger.error("No variant image files provided.");
      process.exit(1);
    }
    let base: ArtImage | undefined;
    if (imageId) {
      base = found.data.images.find(
        (i) => i.id === imageId || i.image_url.includes(imageId),
      );
      if (!base) {
        logger.warn("Image id not found; entering interactive selection.");
      }
    }
    if (!base) {
      logger.log("Select base image to attach variants:");
      found.data.images.forEach((img, idx) => {
        logger.log(`  [${idx}] id=${img.id} url=${img.image_url}`);
      });
      const choiceRaw = await rl.question("Index (default 0): ");
      const choice = choiceRaw ? parseInt(choiceRaw, 10) : 0;
      if (isNaN(choice) || choice < 0 || choice >= found.data.images.length) {
        logger.error("Invalid selection.");
        process.exit(1);
      }
      base = found.data.images[choice];
    }
    const baseDir = resolvePublicRoot(found.data);
    const thumbsDir = join(baseDir, "thumbnails");
    await mkdir(thumbsDir, { recursive: true });
    if (!base.variants) base.variants = [];

    for (const file of variantFiles) {
      if (!(await validateImageFile(file))) continue;
      const label = await rl.question(`Variant label (${file}) (optional): `);
      const alt = await rl.question("Variant alt (recommended): ");
      const slugPart = generateSlug(
        label || `variant-${base.variants.length + 1}`,
      );
      const ext = extname(file);
      const variantName = `${base.id}__${slugPart}${ext}`;
      const dest = join(baseDir, variantName);
      await copyImageToDestination(file, dest);
      const vThumbDest = join(thumbsDir, `${base.id}__${slugPart}.webp`);
      await generateThumbnail(dest, vThumbDest);
      base.variants.push({
        image_url: "/" + dest.replace(/\\/g, "/").replace(/^public\//, ""),
        thumbnail_url:
          "/" + vThumbDest.replace(/\\/g, "/").replace(/^public\//, ""),
        label: label || undefined,
        alt: alt || undefined,
      });
      logger.log(`Added variant ${variantName}`);
    }
    await saveArt(found.path, found.data);
    logger.log(`Variants added to base image id: ${base.id}`);
  } finally {
    rl.close();
  }
}

async function removeImage(
  slug: string,
  imageId: string,
  withFiles: boolean,
): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  const idx = found.data.images.findIndex((i) => i.id === imageId);
  if (idx === -1) {
    logger.error("Image not found");
    process.exit(1);
  }
  const [removed] = found.data.images.splice(idx, 1);
  if (withFiles) {
    const paths: string[] = [];
    paths.push("public" + removed.image_url);
    if (removed.thumbnail_url) paths.push("public" + removed.thumbnail_url);
    if (removed.variants) {
      for (const v of removed.variants) {
        paths.push("public" + v.image_url);
        if (v.thumbnail_url) paths.push("public" + v.thumbnail_url);
      }
    }
    for (const p of paths) {
      try {
        const file = Bun.file(p);
        if (await file.exists()) {
          await rm(p);
        }
      } catch {
        continue;
      }
    }
  }
  await saveArt(found.path, found.data);
  logger.log(`Removed image ${imageId}`);
}

async function removeVariant(
  slug: string,
  imageId: string,
  variantIdOrIndex: string,
  withFiles: boolean,
): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  const base = found.data.images.find((i) => i.id === imageId);
  if (!base) {
    logger.error("Image not found");
    process.exit(1);
  }
  if (!base.variants?.length) {
    logger.error("No variants present");
    process.exit(1);
  }
  let idx = -1;
  idx = base.variants.findIndex((v) => v.label === variantIdOrIndex);
  if (idx === -1 && /^\d+$/.test(variantIdOrIndex)) {
    idx = parseInt(variantIdOrIndex, 10);
  }
  if (idx < 0 || idx >= base.variants.length) {
    logger.error("Variant not found");
    process.exit(1);
  }
  const [removed] = base.variants.splice(idx, 1);
  if (withFiles) {
    const targets = ["public" + removed.image_url];
    if (removed.thumbnail_url) targets.push("public" + removed.thumbnail_url);
    for (const t of targets) {
      try {
        const file = Bun.file(t);
        if (await file.exists()) {
          await rm(t);
        }
      } catch {
        continue;
      }
    }
  }
  await saveArt(found.path, found.data);
  logger.log(`Removed variant ${variantIdOrIndex} from image ${imageId}`);
}

async function updateMeta(slug: string): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  const rl = createReadlineInterface();
  try {
    const d = found.data;
    const title = (await rl.question(`Title [${d.title}]: `)) || d.title;
    const desc =
      (await rl.question(`Description (leave blank keep) : `)) || d.description;
    const tags = await rl.question(
      `Tags (comma) [${(d.tags || []).join(",")}]: `,
    );
    const pinned = await rl.question(
      `Pinned? (y/N) [${d.pinned ? "y" : "n"}]: `,
    );
    const sketch = await rl.question(
      `Sketch? (y/N) [${d.sketch ? "y" : "n"}]: `,
    );
    d.title = title;
    d.description = desc || undefined;
    if (tags.trim()) {
      d.tags = tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (tags === "") {
      delete d.tags;
    }
    if (pinned.toLowerCase().startsWith("y")) d.pinned = true;
    else if (pinned) d.pinned = false;
    if (sketch.toLowerCase().startsWith("y")) d.sketch = true;
    else if (sketch) d.sketch = false;
    await saveArt(found.path, d);
    logger.log(`Updated metadata for ${slug}`);
  } finally {
    rl.close();
  }
}

async function deleteArt(slug: string, withFiles: boolean): Promise<void> {
  const found = await loadArtBySlug(slug);
  if (!found) {
    logger.error("Not found");
    process.exit(1);
  }
  if (withFiles) {
    for (const img of found.data.images) {
      try {
        const file = Bun.file("public" + img.image_url);
        if (await file.exists()) await rm("public" + img.image_url);
      } catch {}
      if (img.thumbnail_url) {
        try {
          const thumbFile = Bun.file("public" + img.thumbnail_url);
          if (await thumbFile.exists()) await rm("public" + img.thumbnail_url);
        } catch {}
      }
      if (img.variants) {
        for (const v of img.variants) {
          try {
            const vFile = Bun.file("public" + v.image_url);
            if (await vFile.exists()) await rm("public" + v.image_url);
          } catch {}
          if (v.thumbnail_url) {
            try {
              const vThumbFile = Bun.file("public" + v.thumbnail_url);
              if (await vThumbFile.exists())
                await rm("public" + v.thumbnail_url);
            } catch {}
          }
        }
      }
    }
  }
  try {
    await rm(found.path);
  } catch {}
  logger.log(`Deleted art ${slug}`);
}

function printUsage(): void {
  console.log(
    `Art Manager (gallery schema)\n\nUsage:\n  bun scripts/add-art2.ts create <img1> [img2 ...]\n  bun scripts/add-art2.ts append <slug> <img1> [img2 ...]\n  bun scripts/add-art2.ts add-variants <slug> [<imageId>] <imgVariant1> [imgVariant2 ...]\n  bun scripts/add-art2.ts remove-image <slug> <imageId> [--files]\n  bun scripts/add-art2.ts remove-variant <slug> <imageId> <variantLabel|index> [--files]\n  bun scripts/add-art2.ts update-meta <slug>\n  bun scripts/add-art2.ts show <slug>\n  bun scripts/add-art2.ts list\n  bun scripts/add-art2.ts delete <slug> [--files]\n`,
  );
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || ["-h", "--help"].includes(command)) {
    printUsage();
    process.exit(0);
  }
  switch (command) {
    case "list":
      await listArt();
      break;
    case "show":
      if (!rest[0]) return printUsage();
      await showArt(rest[0]);
      break;
    case "create":
      await createArt(rest);
      break;
    case "append":
      if (rest.length < 2) return printUsage();
      await appendImages(rest[0], rest.slice(1));
      break;
    case "add-variants":
      if (rest.length < 2) return printUsage();
      await addVariantsFlexible(rest[0], rest[1], rest.slice(2));
      break;
    case "remove-image":
      if (rest.length < 2) return printUsage();
      await removeImage(rest[0], rest[1], rest.includes("--files"));
      break;
    case "remove-variant":
      if (rest.length < 3) return printUsage();
      await removeVariant(rest[0], rest[1], rest[2], rest.includes("--files"));
      break;
    case "update-meta":
      if (!rest[0]) return printUsage();
      await updateMeta(rest[0]);
      break;
    case "delete":
      if (!rest[0]) return printUsage();
      await deleteArt(rest[0], rest.includes("--files"));
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

main();
