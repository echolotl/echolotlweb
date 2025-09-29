import { existsSync, mkdirSync, copyFileSync, writeFileSync, statSync, readdirSync, readFileSync, unlinkSync, rmSync } from 'fs';
import { join, extname, dirname, relative } from 'path';
import { createInterface } from 'readline';
import sharp from 'sharp';
import * as yaml from 'js-yaml';

const PUBLIC_ART_DIR = 'public/art';
const CONTENT_ART_DIR = 'content/art';
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif'];

interface ArtImageVariantData {
  image_url: string;
  thumbnail_url?: string;
  label?: string;
  alt?: string;
}

interface ArtImageData {
  id?: string;
  title?: string;
  image_url: string;
  thumbnail_url?: string;
  alt?: string;
  variants?: ArtImageVariantData[];
}

interface ArtData {
  slug: string;
  created_at: string;
  modified_at: string;
  title: string;
  pinned: boolean;
  sketch: boolean;
  description?: string;
  tags?: string[];
  character?: string;
  related_characters?: string[];
  images: ArtImageData[];
}

function createReadlineInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function validateImageFile(imagePath: string): boolean {
  if (!existsSync(imagePath)) {
    console.error(`❌ Error: Image file not found: ${imagePath}`);
    return false;
  }

  const ext = extname(imagePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    console.error(`❌ Error: Unsupported image format. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    return false;
  }

  return true;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateThumbnail(imagePath: string, thumbnailPath: string): Promise<void> {
  const thumbnailDir = dirname(thumbnailPath);
  if (!existsSync(thumbnailDir)) {
    mkdirSync(thumbnailDir, { recursive: true });
  }

  await sharp(imagePath)
    .resize(300, 300, {
        fit: 'cover',
        position: 'center'
    })
    .webp({ quality: 80 })
    .toFile(thumbnailPath);

  console.log(`✅ Generated thumbnail: ${thumbnailPath}`);
}

function copyImageToDestination(sourcePath: string, destPath: string): void {
  const destDir = dirname(destPath);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  copyFileSync(sourcePath, destPath);
  console.log(`✅ Copied image: ${destPath}`);
}

function createYamlFile(artData: ArtData, yamlPath: string): void {
  const yamlDir = dirname(yamlPath);
  if (!existsSync(yamlDir)) {
    mkdirSync(yamlDir, { recursive: true });
  }

  const yamlContent = yaml.dump(artData, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });

  writeFileSync(yamlPath, yamlContent, 'utf8');
  console.log(`Created YAML file: ${yamlPath}`);
}


async function buildGallery(rl: ReturnType<typeof createInterface>, imagePaths: string[], fallbackSlug?: string, existingIds?: Set<string>): Promise<{ images: ArtImageData[] } | null> {
  const images: ArtImageData[] = [];
  let baseIndex = 0;
  const usedIds = new Set<string>(existingIds || []);

  function allocateDefaultId(): string {
    if (!fallbackSlug) {
      // Legacy behavior if no slug passed in
      let n = images.length + 1; let candidate = `image-${n}`;
      while (usedIds.has(candidate)) { n++; candidate = `image-${n}`; }
      usedIds.add(candidate);
      return candidate;
    }
    // First try plain slug, then slug-2, slug-3 until unique
    let i = 1; let candidate = fallbackSlug;
    while (usedIds.has(candidate)) { i++; candidate = `${fallbackSlug}-${i}`; }
    usedIds.add(candidate);
    return candidate;
  }

  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i];
    if (!validateImageFile(src)) {
      console.error(`Invalid image: ${src}`);
      return null;
    }
    console.log(`\nSource ${i + 1}/${imagePaths.length}: ${src}`);

    // Decide if this should join a previous base as a variant
    let attachAsVariant = false;
    if (images.length > 0) {
      const asVar = await askQuestion(rl, 'Make this a variant of the previous base image? (y/N): ');
      attachAsVariant = asVar.toLowerCase().startsWith('y');
    }

    if (attachAsVariant) {
      const base = images[baseIndex];
      if (!base.variants) base.variants = [];
      const label = await askQuestion(rl, 'Variant label (short, optional): ');
      const alt = await askQuestion(rl, 'Variant alt text (recommended): ');
      // Defer actual file placement until later (after base image paths are finalized)
      base.variants.push({
        image_url: `__TEMP_SRC__${src}`,
        label: label || undefined,
        alt: alt || undefined,
      });
      console.log('Queued variant (will be copied after base images are placed).');
    } else {
  const title = await askQuestion(rl, 'Image title (optional): ');
  const alt = await askQuestion(rl, 'Image alt text (recommended): ');
  const id = title ? generateSlug(title) : allocateDefaultId();

      // We'll place all images later once we know character/general root
      images.push({ id, title: title || undefined, alt: alt || undefined, image_url: `__TEMP_SRC__${src}` });
      baseIndex = images.length - 1;
    }
  }
  // created_at is ultimately taken from first image's file time by caller
  return { images };
}

// CRUD operations

function walkArtYamlFiles(): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full); else if (entry.isFile() && entry.name.endsWith('.yml')) out.push(full);
    }
  }
  walk(CONTENT_ART_DIR);
  return out;
}

function loadArtBySlug(slug: string): { path: string; data: ArtData } | null {
  for (const file of walkArtYamlFiles()) {
    try {
      const raw = readFileSync(file, 'utf8');
      const data = yaml.load(raw) as ArtData;
      if (data?.slug === slug) return { path: file, data };
    } catch {/* ignore */}
  }
  return null;
}

function ensureImageIds(entry: { path: string; data: ArtData }): boolean {
  let changed = false;
  entry.data.images = entry.data.images || [];
  entry.data.images.forEach((img, idx) => {
    if (!img.id) {
      // derive from filename if possible
      const segments = img.image_url.split('/');
      const filename = segments[segments.length - 1] || '';
      const base = filename.replace(/\.[a-zA-Z0-9]+$/, '');
      img.id = base || `image-${idx+1}`;
      changed = true;
    }
    if (img.variants) {
      // no ids for variants, that's fine
    }
  });
  if (changed) saveArt(entry.path, entry.data);
  return changed;
}

function saveArt(path: string, data: ArtData) {
  data.modified_at = new Date().toISOString();
  const content = yaml.dump(data, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false });
  writeFileSync(path, content, 'utf8');
}

function listArt() {
  const rows = walkArtYamlFiles().map(f => {
    try { const d = yaml.load(readFileSync(f, 'utf8')) as ArtData; return { slug: d.slug, title: d.title, count: d.images?.length || 0, file: f }; } catch { return null; }
  }).filter(Boolean) as { slug: string; title: string; count: number; file: string }[];
  console.log(`Found ${rows.length} art entries`);
  for (const r of rows) console.log(`• ${r.slug} (${r.count} images) - ${r.title}`);
}

function showArt(slug: string) {
  const found = loadArtBySlug(slug);
  if (!found) { console.error('Not found'); process.exit(1); }
  console.log(yaml.dump(found.data, { indent: 2, lineWidth: -1 }));
}

async function createArt(args: string[]) {
  const rl = createReadlineInterface();
  try {
    if (args.length === 0) { console.error('Provide at least one image path.'); process.exit(1); }
    console.log(`Creating new art with ${args.length} file(s)`);
    const title = await askQuestion(rl, 'Artwork title: ');
    if (!title) { console.error('Title required.'); process.exit(1); }
    const slug = generateSlug(title);
    const pinned = (await askQuestion(rl, 'Pinned? (y/N): ')).toLowerCase().startsWith('y');
    const sketch = (await askQuestion(rl, 'Sketch? (y/N): ')).toLowerCase().startsWith('y');
    const description = await askQuestion(rl, 'Description (optional): ');
    const tagsInput = await askQuestion(rl, 'Tags (comma, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const categoryInput = await askQuestion(rl, 'Character art or general? (c/g): ');
    const isCharacter = categoryInput.toLowerCase().startsWith('c');
    let character: string | undefined; let related_characters: string[] | undefined;
    if (isCharacter) {
      character = await askQuestion(rl, 'Primary character slug: ');
      if (!character) { console.error('Character slug required.'); process.exit(1); }
      const rel = await askQuestion(rl, 'Related characters (comma, optional): ');
      related_characters = rel ? rel.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    }
  const gallery = await buildGallery(rl, args, slug);
    if (!gallery) process.exit(1);
    const basePublicDir = isCharacter ? join(PUBLIC_ART_DIR, 'characters', character!) : join(PUBLIC_ART_DIR, 'general');
    const yamlPath = isCharacter ? join(CONTENT_ART_DIR, 'characters', character!, `${slug}.yml`) : join(CONTENT_ART_DIR, 'general', `${slug}.yml`);
    if (existsSync(yamlPath)) { console.error('YAML already exists.'); process.exit(1); }
    if (!existsSync(basePublicDir)) mkdirSync(basePublicDir, { recursive: true });
    const thumbsDir = join(basePublicDir, 'thumbnails'); if (!existsSync(thumbsDir)) mkdirSync(thumbsDir, { recursive: true });
    for (const img of gallery.images) {
      if (img.image_url.startsWith('__TEMP_SRC__')) {
        const originalSrc = img.image_url.replace('__TEMP_SRC__', '');
        const ext = extname(originalSrc); const filename = `${img.id}${ext}`; const dest = join(basePublicDir, filename);
        copyImageToDestination(originalSrc, dest);
        const thumbDest = join(thumbsDir, `${img.id}.webp`); await generateThumbnail(dest, thumbDest);
        img.image_url = '/' + dest.replace(/\\/g, '/').replace(/^public\//, '');
        img.thumbnail_url = '/' + thumbDest.replace(/\\/g, '/').replace(/^public\//, '');
      }
      // Process any queued variants for this base image
      if (img.variants?.length) {
        for (const v of img.variants) {
          if (!v.image_url.startsWith('__TEMP_SRC__')) continue; // already processed
            const originalVarSrc = v.image_url.replace('__TEMP_SRC__', '');
            const extVar = extname(originalVarSrc);
            const slugPart = generateSlug(v.label || `variant-${img.variants.indexOf(v) + 1}`);
            const variantName = `${img.id}__${slugPart}${extVar}`;
            const destVar = join(basePublicDir, variantName);
            copyImageToDestination(originalVarSrc, destVar);
            const thumbVar = join(thumbsDir, `${img.id}__${slugPart}.webp`);
            await generateThumbnail(destVar, thumbVar);
            v.image_url = '/' + destVar.replace(/\\/g,'/').replace(/^public\//,'');
            v.thumbnail_url = '/' + thumbVar.replace(/\\/g,'/').replace(/^public\//,'');
        }
      }
    }
    // Determine created_at (earliest mtime of supplied files by default, allow override)
    const mtimes = args.map(p => statSync(p).mtime.getTime());
    const earliestMtime = new Date(Math.min(...mtimes));
    const defaultCreatedIso = earliestMtime.toISOString();
    const creationInput = await askQuestion(rl, `Creation date (YYYY-MM-DD or ISO, blank = file date ${defaultCreatedIso.slice(0,10)}): `);
    let created_at: string;
    if (!creationInput) {
      created_at = defaultCreatedIso;
    } else {
      let parsed: Date | null = null;
      const trimmed = creationInput.trim();
      if (/^now$/i.test(trimmed)) {
        parsed = new Date();
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        // Treat as UTC midnight
        parsed = new Date(trimmed + 'T00:00:00.000Z');
      } else {
        const tryDate = new Date(trimmed);
        if (!isNaN(tryDate.getTime())) parsed = tryDate;
      }
      if (!parsed) {
        console.warn('⚠️  Could not parse creation date, falling back to earliest file mtime.');
        created_at = defaultCreatedIso;
      } else {
        created_at = parsed.toISOString();
      }
    }
    const art: ArtData = {
      slug,
      created_at,
      modified_at: new Date().toISOString(),
      title,
      pinned,
      sketch,
      images: gallery.images,
    };
    if (description) art.description = description;
    if (tags?.length) art.tags = tags;
    if (character) art.character = character;
    if (related_characters?.length) art.related_characters = related_characters;
    createYamlFile(art, yamlPath);
    console.log('Created art:', slug);
  } finally { rl.close(); }
}

function resolvePublicRoot(art: ArtData): string {
  return art.character ? join(PUBLIC_ART_DIR, 'characters', art.character) : join(PUBLIC_ART_DIR, 'general');
}

async function appendImages(slug: string, images: string[]) {
  const found = loadArtBySlug(slug); if (!found) { console.error('Not found'); process.exit(1); }
  const rl = createReadlineInterface();
  try {
  const existingIds = new Set(found.data.images.map(i => i.id!).filter(Boolean));
  const gallery = await buildGallery(rl, images, found.data.slug, existingIds); if (!gallery) process.exit(1);
    const baseDir = resolvePublicRoot(found.data); const thumbsDir = join(baseDir, 'thumbnails'); if (!existsSync(thumbsDir)) mkdirSync(thumbsDir, { recursive: true });
    for (const img of gallery.images) {
      if (img.image_url.startsWith('__TEMP_SRC__')) {
        const original = img.image_url.replace('__TEMP_SRC__',''); const ext = extname(original); const filename = `${img.id}${ext}`; const dest = join(baseDir, filename);
        copyImageToDestination(original, dest);
        const thumbDest = join(thumbsDir, `${img.id}.webp`); await generateThumbnail(dest, thumbDest);
        img.image_url = '/' + dest.replace(/\\/g,'/').replace(/^public\//,'');
        img.thumbnail_url = '/' + thumbDest.replace(/\\/g,'/').replace(/^public\//,'');
      }
      // Handle queued variants
      if (img.variants?.length) {
        for (const v of img.variants) {
          if (!v.image_url.startsWith('__TEMP_SRC__')) continue;
          const originalVarSrc = v.image_url.replace('__TEMP_SRC__','');
          const extVar = extname(originalVarSrc);
          const slugPart = generateSlug(v.label || `variant-${img.variants.indexOf(v) + 1}`);
          const variantName = `${img.id}__${slugPart}${extVar}`;
          const destVar = join(baseDir, variantName);
          copyImageToDestination(originalVarSrc, destVar);
          const thumbVar = join(thumbsDir, `${img.id}__${slugPart}.webp`);
          await generateThumbnail(destVar, thumbVar);
          v.image_url = '/' + destVar.replace(/\\/g,'/').replace(/^public\//,'');
          v.thumbnail_url = '/' + thumbVar.replace(/\\/g,'/').replace(/^public\//,'');
        }
      }
      found.data.images.push(img);
    }
    saveArt(found.path, found.data);
    console.log('Appended images to', slug);
  } finally { rl.close(); }
}

async function addVariantsFlexible(slug: string, maybeImageId: string | undefined, variantFiles: string[]) {
  const found = loadArtBySlug(slug); if (!found) { console.error('Not found'); process.exit(1); }
  ensureImageIds(found);
  const rl = createReadlineInterface();
  try {
    let imageId = maybeImageId;
    // If imageId is actually the first file path (exists on disk), shift logic
    if (imageId && validateImageFile(imageId)) {
      variantFiles = [imageId, ...variantFiles];
      imageId = undefined; // force selection
    }
    if (!variantFiles.length) {
      console.error('No variant image files provided.');
      process.exit(1);
    }
    let base: ArtImageData | undefined;
    if (imageId) {
      base = found.data.images.find(i => i.id === imageId || i.image_url.includes(imageId));
      if (!base) {
        console.warn('Image id not found; entering interactive selection.');
      }
    }
    if (!base) {
      console.log('Select base image to attach variants:');
      found.data.images.forEach((img, idx) => {
        console.log(`  [${idx}] id=${img.id} url=${img.image_url}`);
      });
      const choiceRaw = await askQuestion(rl, 'Index (default 0): ');
      const choice = choiceRaw ? parseInt(choiceRaw, 10) : 0;
      if (isNaN(choice) || choice < 0 || choice >= found.data.images.length) {
        console.error('Invalid selection.');
        process.exit(1);
      }
      base = found.data.images[choice];
    }
    const baseDir = resolvePublicRoot(found.data); const thumbsDir = join(baseDir, 'thumbnails'); if (!existsSync(thumbsDir)) mkdirSync(thumbsDir,{recursive:true});
    if (!base.variants) base.variants = [];
    for (const file of variantFiles) {
      if (!validateImageFile(file)) continue;
      const label = await askQuestion(rl, `Variant label (${file}) (optional): `);
      const alt = await askQuestion(rl, 'Variant alt (recommended): ');
      const slugPart = generateSlug(label || `variant-${base.variants.length + 1}`);
      const ext = extname(file);
      const variantName = `${base.id}__${slugPart}${ext}`;
      const dest = join(baseDir, variantName);
      copyImageToDestination(file, dest);
      const vThumbDest = join(thumbsDir, `${base.id}__${slugPart}.webp`);
      await generateThumbnail(dest, vThumbDest);
      base.variants.push({
        image_url: '/' + dest.replace(/\\/g,'/').replace(/^public\//,''),
        thumbnail_url: '/' + vThumbDest.replace(/\\/g,'/').replace(/^public\//,''),
        label: label || undefined,
        alt: alt || undefined,
      });
      console.log(' Added variant', variantName);
    }
    saveArt(found.path, found.data);
    console.log('Variants added to base image id:', base.id);
  } finally { rl.close(); }
}

function removeImage(slug: string, imageId: string, withFiles: boolean) {
  const found = loadArtBySlug(slug); if (!found) { console.error('Not found'); process.exit(1); }
  const idx = found.data.images.findIndex(i => i.id === imageId);
  if (idx === -1) { console.error('Image not found'); process.exit(1); }
  const [removed] = found.data.images.splice(idx,1);
  if (withFiles) {
    // Attempt deletion of base + variant files & thumbs
    const paths: string[] = [];
    paths.push('public' + removed.image_url);
    if (removed.thumbnail_url) paths.push('public' + removed.thumbnail_url);
    if (removed.variants) for (const v of removed.variants) { paths.push('public' + v.image_url); if (v.thumbnail_url) paths.push('public'+v.thumbnail_url);}    
    for (const p of paths) { try { if (existsSync(p)) unlinkSync(p); } catch {/* ignore */} }
  }
  saveArt(found.path, found.data);
  console.log('Removed image', imageId);
}

function removeVariant(slug: string, imageId: string, variantIdOrIndex: string, withFiles: boolean) {
  const found = loadArtBySlug(slug); if (!found) { console.error('Not found'); process.exit(1); }
  const base = found.data.images.find(i => i.id === imageId); if (!base) { console.error('Image not found'); process.exit(1); }
  if (!base.variants?.length) { console.error('No variants present'); process.exit(1); }
  let idx = -1;
  // Try label match
  idx = base.variants.findIndex(v => v.label === variantIdOrIndex);
  if (idx === -1 && /^\d+$/.test(variantIdOrIndex)) {
    idx = parseInt(variantIdOrIndex,10);
  }
  if (idx < 0 || idx >= base.variants.length) { console.error('Variant not found'); process.exit(1); }
  const [removed] = base.variants.splice(idx,1);
  if (withFiles) {
    const targets = ['public' + removed.image_url]; if (removed.thumbnail_url) targets.push('public' + removed.thumbnail_url);
    for (const t of targets) { try { if (existsSync(t)) unlinkSync(t); } catch {/* ignore */} }
  }
  saveArt(found.path, found.data);
  console.log('Removed variant', variantIdOrIndex, 'from image', imageId);
}

async function updateMeta(slug: string) {
  const found = loadArtBySlug(slug); if (!found) { console.error('Not found'); process.exit(1); }
  const rl = createReadlineInterface();
  try {
    const d = found.data;
    const title = await askQuestion(rl, `Title [${d.title}]: `) || d.title;
    const desc = await askQuestion(rl, `Description (leave blank keep) : `) || d.description;
    const tags = await askQuestion(rl, `Tags (comma) [${(d.tags||[]).join(',')}]: `);
    const pinned = await askQuestion(rl, `Pinned? (y/N) [${d.pinned?'y':'n'}]: `);
    const sketch = await askQuestion(rl, `Sketch? (y/N) [${d.sketch?'y':'n'}]: `);
    d.title = title;
    d.description = desc || undefined;
    if (tags.trim()) d.tags = tags.split(',').map(s=>s.trim()).filter(Boolean); else if (tags==='') delete d.tags;
    if (pinned.toLowerCase().startsWith('y')) d.pinned = true; else if (pinned) d.pinned = false;
    if (sketch.toLowerCase().startsWith('y')) d.sketch = true; else if (sketch) d.sketch = false;
    saveArt(found.path, d);
    console.log('Updated metadata for', slug);
  } finally { rl.close(); }
}

function deleteArt(slug: string, withFiles: boolean) {
  const found = loadArtBySlug(slug); if (!found) { console.error('Not found'); process.exit(1); }
  if (withFiles) {
    for (const img of found.data.images) {
      try { if (existsSync('public'+img.image_url)) unlinkSync('public'+img.image_url); } catch {}
      if (img.thumbnail_url) try { if (existsSync('public'+img.thumbnail_url)) unlinkSync('public'+img.thumbnail_url); } catch {}
      if (img.variants) for (const v of img.variants) {
        try { if (existsSync('public'+v.image_url)) unlinkSync('public'+v.image_url); } catch {}
        if (v.thumbnail_url) try { if (existsSync('public'+v.thumbnail_url)) unlinkSync('public'+v.thumbnail_url); } catch {}
      }
    }
    // Optionally remove empty directories could be added here
  }
  try { rmSync(found.path); } catch {}
  console.log('Deleted art', slug);
}

function printUsage() {
  console.log(`Art Manager (gallery schema)\n\nUsage:\n  bun scripts/add-art.ts create <img1> [img2 ...]\n  bun scripts/add-art.ts append <slug> <img1> [img2 ...]\n  bun scripts/add-art.ts add-variants <slug> [<imageId>] <imgVariant1> [imgVariant2 ...]\n  bun scripts/add-art.ts remove-image <slug> <imageId> [--files]\n  bun scripts/add-art.ts remove-variant <slug> <imageId> <variantLabel|index> [--files]\n  bun scripts/add-art.ts update-meta <slug>\n  bun scripts/add-art.ts show <slug>\n  bun scripts/add-art.ts list\n  bun scripts/add-art.ts delete <slug> [--files]\n`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || ['-h','--help'].includes(command)) { printUsage(); process.exit(0); }
  switch (command) {
    case 'list': listArt(); break;
    case 'show': if (!rest[0]) return printUsage(); showArt(rest[0]); break;
    case 'create': await createArt(rest); break;
    case 'append': if (rest.length < 2) return printUsage(); await appendImages(rest[0], rest.slice(1)); break;
  case 'add-variants': if (rest.length < 2) return printUsage(); await addVariantsFlexible(rest[0], rest[1], rest.slice(2)); break;
    case 'remove-image': if (rest.length < 2) return printUsage(); removeImage(rest[0], rest[1], rest.includes('--files')); break;
    case 'remove-variant': if (rest.length < 3) return printUsage(); removeVariant(rest[0], rest[1], rest[2], rest.includes('--files')); break;
    case 'update-meta': if (!rest[0]) return printUsage(); await updateMeta(rest[0]); break;
    case 'delete': if (!rest[0]) return printUsage(); deleteArt(rest[0], rest.includes('--files')); break;
    default: printUsage(); process.exit(1);
  }
}

main();
