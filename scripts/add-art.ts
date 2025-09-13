import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { createInterface } from 'readline';
import sharp from 'sharp';
import * as yaml from 'js-yaml';

const PUBLIC_ART_DIR = 'public/art';
const CONTENT_ART_DIR = 'content/art';
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

interface ArtData {
  slug: string;
  created_at: string;
  modified_at: string;
  title: string;
  pinned: boolean;
  sketch: boolean;
  image_url: string;
  description?: string;
  tags?: string[];
  character?: string;
  related_characters?: string[];
  thumbnail_url: string;
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
  console.log(`✅ Created YAML file: ${yamlPath}`);
}

async function processImage(imagePath: string, rl: ReturnType<typeof createInterface>, imageIndex: number, totalImages: number): Promise<boolean> {
  console.log(`\n🎨 Processing image ${imageIndex}/${totalImages}: ${imagePath}\n`);

  if (!validateImageFile(imagePath)) {
    console.error(`❌ Skipping invalid image: ${imagePath}\n`);
    return false;
  }

  try {
    // Ask for basic information
    const title = await askQuestion(rl, 'Enter the title: ');
    if (!title) {
      console.error('❌ Title is required! Skipping this image.\n');
      return false;
    }

    const slug = generateSlug(title);
    console.log(`Generated slug: ${slug}\n`);

    const categoryInput = await askQuestion(rl, 'Is this character art or general art? (character/general): ');
    const isCharacterArt = categoryInput.toLowerCase().startsWith('c');

    let character: string | undefined;
    let related_characters: string[] | undefined;
    let destImagePath: string;
    let yamlPath: string;
    let thumbnailPath: string;

    if (isCharacterArt) {
      character = await askQuestion(rl, 'Enter the character name: ');
      if (!character) {
        console.error('❌ Character name is required for character art! Skipping this image.\n');
        return false;
      }

      const imageExt = extname(imagePath);
      const imageFilename = `${slug}${imageExt}`;
      
      destImagePath = join(PUBLIC_ART_DIR, 'characters', character, imageFilename);
      thumbnailPath = join(PUBLIC_ART_DIR, 'characters', character, 'thumbnails', `${slug}.webp`);
      yamlPath = join(CONTENT_ART_DIR, 'characters', character, `${slug}.yml`);

      // Ask for related characters
      const relatedInput = await askQuestion(rl, 'Enter related characters (comma-separated, optional): ');
      related_characters = relatedInput ? relatedInput.split(',').map(rc => rc.trim()).filter(rc => rc) : [];
    } else {
      const imageExt = extname(imagePath);
      const imageFilename = `${slug}${imageExt}`;
      
      destImagePath = join(PUBLIC_ART_DIR, 'general', imageFilename);
      thumbnailPath = join(PUBLIC_ART_DIR, 'general', 'thumbnails', `${slug}.webp`);
      yamlPath = join(CONTENT_ART_DIR, 'general', `${slug}.yml`);
    }

    // Check if files already exist
    if (existsSync(destImagePath) || existsSync(yamlPath)) {
      console.error('❌ Error: Files with this slug already exist! Skipping this image.\n');
      return false;
    }

    const description = await askQuestion(rl, 'Enter a description (optional): ');
    
    const isSketch = await askQuestion(rl, 'Is this a sketch? (y/n): ');
    const sketch = isSketch.toLowerCase().startsWith('y');

    const isPinned = await askQuestion(rl, 'Should this be pinned? (y/n): ');
    const pinned = isPinned.toLowerCase().startsWith('y');

    const tagsInput = await askQuestion(rl, 'Enter tags (comma-separated, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    console.log('\n🔄 Processing...\n');

    // Copy image
    copyImageToDestination(imagePath, destImagePath);

    // Generate thumbnail
    await generateThumbnail(destImagePath, thumbnailPath);

    // Create YAML data
    const now = new Date().toISOString();
    const imageUrl = '/' + destImagePath.replace(/\\/g, '/').replace(/^public\//, '');
    const thumbnailUrl = '/' + thumbnailPath.replace(/\\/g, '/').replace(/^public\//, '');

    const artData: ArtData = {
      slug,
      created_at: now,
      modified_at: now,
      title,
      pinned,
      sketch,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl
    };

    if (description) {
      artData.description = description;
    }

    if (tags.length > 0) {
      artData.tags = tags;
    }

    if (character) {
      artData.character = character;
    }
    if (related_characters && related_characters.length > 0) {
      artData.related_characters = related_characters;
    }

    createYamlFile(artData, yamlPath);

    console.log('🎉 Art successfully added!');
    console.log(`📁 Image: ${destImagePath}`);
    console.log(`🖼️  Thumbnail: ${thumbnailPath}`);
    console.log(`📄 Data: ${yamlPath}\n`);

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${imagePath}:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: bun scripts/add-art.ts <image-path> [image-path2] [image-path3] ...');
    process.exit(1);
  }

  const imagePaths = args;
  const rl = createReadlineInterface();

  console.log(`🎨 Adding ${imagePaths.length} art image(s)...\n`);

  let successCount = 0;
  let skipCount = 0;

  try {
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const success = await processImage(imagePath, rl, i + 1, imagePaths.length);
      
      if (success) {
        successCount++;
      } else {
        skipCount++;
      }

      // Ask if user wants to continue if there are more images and this one failed
      if (!success && i < imagePaths.length - 1) {
        const continueProcessing = await askQuestion(rl, 'Continue with the next image? (y/n): ');
        if (!continueProcessing.toLowerCase().startsWith('y')) {
          console.log('🛑 Processing stopped by user.');
          break;
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`📁 Total: ${imagePaths.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
