import sharp from "sharp";
import { Logger } from "../../logger";
import * as fs from "node:fs";
import * as path from "node:path";
import { context } from "./context";

export async function validateImage(filePath: string): Promise<boolean> {
  if (!fs.existsSync(filePath)) {
    Logger.error(`Couldn't find "${filePath}"`);
    return false;
  }

  try {
    await sharp(filePath).metadata();
  } catch (error) {
    Logger.error(`Invalid image file at "${filePath}"`);
    return false;
  }

  return true;
}

export async function copyImage(source: string, destination: string): Promise<void> {
  if (!(await validateImage(source))) return;
  if (context.dryRun) {
    Logger.warning(
      `[DRYRUN] Would copy ${Logger.fmtBold(source)} to ${Logger.fmtBold(destination)}`,
    );
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  Logger.info(`Copied image from ${Logger.fmtBold(source)} to ${Logger.fmtBold(destination)}`);
}

export async function generateThumbnail(imagePath: string, thumbnailPath: string): Promise<void> {
  const thumbnailDir = path.dirname(thumbnailPath);
  fs.mkdirSync(thumbnailDir, { recursive: true });

  await sharp(imagePath)
    .resize(300, 300, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 100 })
    .toFile(thumbnailPath);

  Logger.info(`Generated thumbnail: ${Logger.fmtBold(thumbnailPath)}`);
}
