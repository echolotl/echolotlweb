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

function getAllArtImages(artDir: string): string[] {
  const images: string[] = [];
  
  function scanDirectory(dir: string) {
    if (!existsSync(dir)) return;
    
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip thumbnails directories
        if (item === 'thumbnails') continue;
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = extname(item).toLowerCase();
        
        // Check if it's a supported image format
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          // Skip if it's already a thumbnail
          if (item.startsWith('thumb_')) continue;
          
          images.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(artDir);
  return images;
}

async function regenerateAllThumbnails(dryRun: boolean = false, force: boolean = false): Promise<void> {
  console.log('🔍 Scanning for all art images...\n');
  
  const allImages = getAllArtImages(PUBLIC_ART_DIR);
  
  if (allImages.length === 0) {
    console.log('❌ No art images found!');
    return;
  }
  
  console.log(`📊 Found ${allImages.length} art images to process\n`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
    if (force) {
      console.log('🔧 FORCE MODE - Would regenerate all thumbnails regardless of modification times\n');
    }
    for (const imagePath of allImages) {
      const relativePath = relative(process.cwd(), imagePath);
      console.log(`  Would process: ${relativePath}`);
    }
    console.log(`\n📊 Total images that would be processed: ${allImages.length}`);
    return;
  }
  
  let processed = 0;
  let errors = 0;
  let yamlUpdated = 0;
  let skipped = 0;
  
  for (const imagePath of allImages) {
    try {
      const relativePath = relative(process.cwd(), imagePath);
      console.log(`\n🖼️ Processing: ${relativePath}`);
      
      // Check if file exists and is accessible
      if (!existsSync(imagePath)) {
        console.error(`✗ File not found: ${imagePath}`);
        errors++;
        continue;
      }
      
      const stat = statSync(imagePath);
      if (!stat.isFile()) {
        console.error(`✗ Not a file: ${imagePath}`);
        errors++;
        continue;
      }
      
      const ext = extname(imagePath).toLowerCase();
      
      // Double-check supported format
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        console.error(`✗ Unsupported format: ${imagePath}`);
        errors++;
        continue;
      }
      
      // Skip if it's already a thumbnail (extra safety check)
      const fileName = basename(imagePath);
      if (fileName.startsWith('thumb_')) {
        console.log(`⏭ Skipping thumbnail file: ${imagePath}`);
        skipped++;
        continue;
      }
      
      // Ensure thumbnails directory exists
      const parentDir = dirname(imagePath);
      const thumbnailDir = join(parentDir, 'thumbnails');
      if (!existsSync(thumbnailDir)) {
        mkdirSync(thumbnailDir, { recursive: true });
        console.log(`📁 Created thumbnails directory: ${thumbnailDir}`);
      }
      
      // Generate thumbnail filename
      const nameWithoutExt = basename(imagePath, ext);
      const thumbnailPath = join(thumbnailDir, `${nameWithoutExt}.webp`);
      
      // Check if thumbnail already exists and compare modification times
      if (existsSync(thumbnailPath) && !force) {
        const originalStat = statSync(imagePath);
        const thumbnailStat = statSync(thumbnailPath);
        
        if (thumbnailStat.mtime >= originalStat.mtime) {
          console.log(`⏭ Thumbnail is up-to-date: ${thumbnailPath}`);
          skipped++;
          continue;
        }
      }
      
      await createThumbnail(imagePath, thumbnailPath);
      processed++;
      
      // Update YAML file with new thumbnail URL
      const yamlUpdateResult = await updateYamlThumbnailUrl(imagePath, thumbnailPath);
      if (yamlUpdateResult) {
        yamlUpdated++;
      }
      
    } catch (error) {
      errors++;
      console.error(`Error processing ${imagePath}:`, error);
    }
  }
  
  console.log(`\n📊 Final Summary:`);
  console.log(`🖼️ Total images found: ${allImages.length}`);
  console.log(`✓ Processed: ${processed}`);
  console.log(`⏭ Skipped (up-to-date): ${skipped}`);
  console.log(`📝 YAML files updated: ${yamlUpdated}`);
  console.log(`✗ Errors: ${errors}`);
  
  if (errors === 0) {
    console.log('\n🎉 All thumbnails regenerated successfully!');
  } else {
    console.log(`\n⚠️ Completed with ${errors} errors.`);
  }
}

function printUsage() {
  console.log('Usage: bun scripts/regenerate-all-thumbnails.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run    Show what would be processed without making changes');
  console.log('  --force      Regenerate all thumbnails, even if they appear up-to-date');
  console.log('  --help, -h   Show this help message');
  console.log('');
  console.log('This script will:');
  console.log('1. Find all art images in public/art/ (excluding existing thumbnails)');
  console.log('2. Generate/regenerate thumbnails in their respective thumbnails/ directories');
  console.log('3. Update corresponding YAML files with new thumbnail URLs');
  console.log('4. Skip thumbnails that are already up-to-date (unless --force is used)');
  console.log('');
  console.log('Examples:');
  console.log('  bun scripts/regenerate-all-thumbnails.ts');
  console.log('  bun scripts/regenerate-all-thumbnails.ts --dry-run');
  console.log('  bun scripts/regenerate-all-thumbnails.ts --force');
  console.log('  bun scripts/regenerate-all-thumbnails.ts --dry-run --force');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  
  if (force && !dryRun) {
    console.log('🔧 FORCE MODE: Regenerating all thumbnails regardless of modification times\n');
  }
  
  console.log('🎨 Regenerating thumbnails for all art...\n');
  
  try {
    await regenerateAllThumbnails(dryRun, force);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main();
