import { existsSync, mkdirSync, statSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname, basename, dirname, relative } from 'path';
import sharp from 'sharp';
import * as yaml from 'js-yaml';

const PUBLIC_ART_DIR = 'public/art';
const CONTENT_ART_DIR = 'content/art';
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

async function findYamlFileForImage(imagePath: string): Promise<string | null> {
  try {
    // Convert public art path to content art path
    const relativePath = relative(PUBLIC_ART_DIR, imagePath);
    const [category, ...pathParts] = relativePath.split(/[/\\]/);
    
    let searchDir: string;
    if (category === 'characters' && pathParts.length >= 2) {
      // For character art: search in content/art/characters/chomb/
      const characterName = pathParts[0];
      searchDir = join(CONTENT_ART_DIR, 'characters', characterName);
    } else if (category === 'general') {
      // For general art: search in content/art/general/
      searchDir = join(CONTENT_ART_DIR, 'general');
    } else {
      // Fallback for other structures
      searchDir = join(CONTENT_ART_DIR, category);
    }
    
    if (!existsSync(searchDir)) {
      return null;
    }
    
    // Generate the expected image URL that should be in the YAML file
    const expectedImageUrl = '/' + relative('public', imagePath).replace(/\\/g, '/');
    
    // Search through all YAML files in the directory
    const files = readdirSync(searchDir);
    for (const file of files) {
      if (!file.endsWith('.yml')) continue;
      
      const yamlPath = join(searchDir, file);
      try {
        const yamlContent = readFileSync(yamlPath, 'utf8');
        const data = yaml.load(yamlContent) as Record<string, unknown>;
        
        if (data && data.image_url === expectedImageUrl) {
          return yamlPath;
        }
      } catch {
        // Skip invalid YAML files
        continue;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

async function updateYamlThumbnailUrl(imagePath: string, newThumbnailPath: string): Promise<boolean> {
  try {
    // Find the YAML file that corresponds to this image
    const yamlPath = await findYamlFileForImage(imagePath);
    
    if (!yamlPath) {
      console.log(`  ⚠️ No YAML file found for image: ${imagePath}`);
      return false;
    }
    
    const yamlContent = readFileSync(yamlPath, 'utf8');
    const data = yaml.load(yamlContent) as Record<string, unknown>;
    
    if (!data || !data.thumbnail_url) {
      console.log(`  ⚠️ No thumbnail_url field in: ${yamlPath}`);
      return false;
    }
    
    // Generate new thumbnail URL (relative to public/)
    const newThumbnailUrl = '/' + relative('public', newThumbnailPath).replace(/\\/g, '/');
    
    if (data.thumbnail_url === newThumbnailUrl) {
      console.log(`  ✓ YAML already up to date: ${yamlPath}`);
      return false;
    }
    
    data.thumbnail_url = newThumbnailUrl;
    data.modified_at = new Date().toISOString();
    
    const updatedYaml = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    
    writeFileSync(yamlPath, updatedYaml, 'utf8');
    console.log(`  ✓ Updated YAML: ${yamlPath} -> ${newThumbnailUrl}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to update YAML for ${imagePath}:`, error);
    return false;
  }
}

async function createThumbnail(inputPath: string, outputPath: string): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      })
      .webp({ quality: 100 })
      .toFile(outputPath);
    
    console.log(`✓ Created thumbnail: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to create thumbnail for ${inputPath}:`, error);
    throw error;
  }
}

async function processSpecificImages(imagePaths: string[]): Promise<void> {
  let processed = 0;
  let errors = 0;
  let yamlUpdated = 0;
  
  for (const imagePath of imagePaths) {
    try {
      // Convert relative path to absolute if needed
      let fullPath = imagePath;
      if (!imagePath.startsWith(PUBLIC_ART_DIR)) {
        // If path doesn't start with public/art, assume it's relative to public/art
        fullPath = join(PUBLIC_ART_DIR, imagePath);
      }
      
      // Check if file exists
      if (!existsSync(fullPath)) {
        console.error(`✗ File not found: ${fullPath}`);
        errors++;
        continue;
      }
      
      // Check if it's a file
      const stat = statSync(fullPath);
      if (!stat.isFile()) {
        console.error(`✗ Not a file: ${fullPath}`);
        errors++;
        continue;
      }
      
      const ext = extname(fullPath).toLowerCase();
      
      // Check if it's a supported image format
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        console.error(`✗ Unsupported format: ${fullPath}`);
        errors++;
        continue;
      }
      
      // Skip if it's already a thumbnail
      const fileName = basename(fullPath);
      if (fileName.startsWith('thumb_')) {
        console.log(`⏭ Skipping thumbnail file: ${fullPath}`);
        continue;
      }
      
      // Ensure thumbnails directory exists
      const parentDir = dirname(fullPath);
      const thumbnailDir = join(parentDir, 'thumbnails');
      if (!existsSync(thumbnailDir)) {
        mkdirSync(thumbnailDir, { recursive: true });
      }
      
      // Generate new thumbnail filename (without thumb_ prefix)
      const nameWithoutExt = basename(fullPath, ext);
      const thumbnailPath = join(thumbnailDir, `${nameWithoutExt}.webp`);
      
      await createThumbnail(fullPath, thumbnailPath);
      processed++;
      
      // Update YAML file with new thumbnail URL
      const yamlUpdateResult = await updateYamlThumbnailUrl(fullPath, thumbnailPath);
      if (yamlUpdateResult) {
        yamlUpdated++;
      }
      
    } catch (error) {
      errors++;
      console.error(`Error processing ${imagePath}:`, error);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✓ Processed: ${processed}`);
  console.log(`📝 YAML Updated: ${yamlUpdated}`);
  console.log(`✗ Errors: ${errors}`);
  
  if (errors === 0) {
    console.log('\n🎉 All specified thumbnails created successfully!');
  } else {
    console.log(`\n⚠️ Completed with ${errors} errors.`);
  }
}

function printUsage() {
  console.log('Usage: bun scripts/create-thumbnails.ts [image-paths...]');
  console.log('');
  console.log('Examples:');
  console.log('  bun scripts/create-thumbnails.ts characters/chomb/chombSass.png');
  console.log('  bun scripts/create-thumbnails.ts general/bug.png characters/echo/echo.png');
  console.log('  bun scripts/create-thumbnails.ts public/art/general/bug.png');
  console.log('');
  console.log('Note: Paths can be relative to public/art/ or absolute paths within the project.');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ No image paths provided.');
    printUsage();
    process.exit(1);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  console.log('🎨 Creating thumbnails for specified images...\n');
  
  try {
    await processSpecificImages(args);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main();
