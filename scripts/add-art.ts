import { existsSync, mkdirSync, copyFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { createInterface } from 'readline';
import sharp from 'sharp';
import * as yaml from 'js-yaml';

const PUBLIC_ART_DIR = 'public/art';
const CONTENT_ART_DIR = 'content/art';
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

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

async function buildGallery(rl: ReturnType<typeof createInterface>, imagePaths: string[]): Promise<{ images: ArtImageData[] } | null> {
  const images: ArtImageData[] = [];
  let baseIndex = 0;

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

    const fileExt = extname(src);

    if (attachAsVariant) {
      const base = images[baseIndex];
      if (!base.variants) base.variants = [];
      const label = await askQuestion(rl, 'Variant label (short, optional): ');
      const alt = await askQuestion(rl, 'Variant alt text (recommended): ');
      const variantSlugPart = label ? generateSlug(label) : `variant-${base.variants.length + 1}`;
      const destImagePath = join(dirname(base.image_url), `${variantSlugPart}${fileExt}`);
      const absoluteDest = join('public', destImagePath.replace(/^\//, ''));
      const thumbnailPath = join(dirname(absoluteDest), 'thumbnails', `${variantSlugPart}.webp`);

      copyImageToDestination(src, absoluteDest);
      await generateThumbnail(absoluteDest, thumbnailPath);

      const variant: ArtImageVariantData = {
        image_url: '/' + destImagePath.replace(/\\/g, '/'),
        thumbnail_url: '/' + thumbnailPath.replace(/\\/g, '/').replace(/^public\//, ''),
        label: label || undefined,
        alt: alt || undefined,
      };
      base.variants.push(variant);
      console.log('Added variant to previous image!');
    } else {
      const title = await askQuestion(rl, 'Image title (optional): ');
      const alt = await askQuestion(rl, 'Image alt text (recommended): ');
      const id = generateSlug(title || `image-${images.length + 1}`);

      // We'll place all images later once we know character/general root
      images.push({ id, title: title || undefined, alt: alt || undefined, image_url: `__TEMP_SRC__${src}` });
      baseIndex = images.length - 1;
    }
  }
  // created_at is ultimately taken from first image's file time by caller
  return { images };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('❌ Usage: bun scripts/add-art.ts <image1> [image2] ...');
    process.exit(1);
  }
  const rl = createReadlineInterface();
  try {
    console.log(`Preparing gallery with ${args.length} source file(s).`);

    // Global metadata
    const title = await askQuestion(rl, 'Artwork title: ');
    if (!title) {
      console.error('Title required.');
      process.exit(1);
    }
    const slug = generateSlug(title);
    const pinned = (await askQuestion(rl, 'Pinned? (y/N): ')).toLowerCase().startsWith('y');
    const sketch = (await askQuestion(rl, 'Sketch? (y/N): ')).toLowerCase().startsWith('y');
    const description = await askQuestion(rl, 'Description (optional): ');
    const tagsInput = await askQuestion(rl, 'Tags (comma, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    const categoryInput = await askQuestion(rl, 'Character art or general? (c/g): ');
    const isCharacter = categoryInput.toLowerCase().startsWith('c');
    let character: string | undefined;
    let related_characters: string[] | undefined;
    if (isCharacter) {
      character = await askQuestion(rl, 'Primary character slug: ');
      if (!character) {
        console.error('Character slug required for character art.');
        process.exit(1);
      }
      const related = await askQuestion(rl, 'Related characters (comma, optional): ');
      related_characters = related ? related.split(',').map(c => c.trim()).filter(Boolean) : undefined;
    }

    const gallery = await buildGallery(rl, args);
    if (!gallery) {
      console.error('Failed to build gallery.');
      process.exit(1);
    }

    // Determine base directory paths
    const basePublicDir = isCharacter ? join(PUBLIC_ART_DIR, 'characters', character!) : join(PUBLIC_ART_DIR, 'general');
    const yamlPath = isCharacter ? join(CONTENT_ART_DIR, 'characters', character!, `${slug}.yml`) : join(CONTENT_ART_DIR, 'general', `${slug}.yml`);

    if (existsSync(yamlPath)) {
      console.error('❌ YAML already exists for slug.');
      process.exit(1);
    }

    // Ensure base directory exists
    if (!existsSync(basePublicDir)) mkdirSync(basePublicDir, { recursive: true });
    const thumbsDir = join(basePublicDir, 'thumbnails');
    if (!existsSync(thumbsDir)) mkdirSync(thumbsDir, { recursive: true });

    // Move/copy images replacing temp placeholders
    for (const img of gallery.images) {
      if (!img.image_url.startsWith('__TEMP_SRC__')) continue; // variants already copied
      const originalSrc = img.image_url.replace('__TEMP_SRC__', '');
      const ext = extname(originalSrc);
      const filename = `${img.id}${ext}`;
      const dest = join(basePublicDir, filename);
      copyImageToDestination(originalSrc, dest);
      const thumbDest = join(thumbsDir, `${img.id}.webp`);
      await generateThumbnail(dest, thumbDest);
      img.image_url = '/' + dest.replace(/\\/g, '/').replace(/^public\//, '');
      img.thumbnail_url = '/' + thumbDest.replace(/\\/g, '/').replace(/^public\//, '');
    }

    // Compute created_at from earliest source file mtime
    const mtimes = args.map(p => statSync(p).mtime.getTime());
    const createdAt = new Date(Math.min(...mtimes)).toISOString();
    const now = new Date().toISOString();

    const artData: ArtData = {
      slug,
      created_at: createdAt,
      modified_at: now,
      title,
      pinned,
      sketch,
      images: gallery.images,
    };
    if (description) artData.description = description;
    if (tags?.length) artData.tags = tags;
    if (character) artData.character = character;
    if (related_characters?.length) artData.related_characters = related_characters;

    createYamlFile(artData as any, yamlPath);
    console.log('\x1b[1m\x1b[42m\x1b[30m\nGallery artwork created! \x1b[0m');
    console.log(`* YAML: ${yamlPath}`);
    console.log(`* Images: ${gallery.images.length}`);
    const variantCount = gallery.images.reduce((n, im) => n + (im.variants?.length || 0), 0);
    console.log(`* Variants: ${variantCount}`);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
