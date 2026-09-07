import sharp from "sharp";
import { spawn } from "node:child_process";
import { Logger } from "../../logger";
import * as fs from "node:fs";
import * as path from "node:path";
import { context } from "./context";
import type { ThumbnailAnchor } from "../../../types";

const THUMBNAIL_SIZE = 300;

const thumbnailAnchorPositions: Record<ThumbnailAnchor, sharp.Gravity> = {
  "top-left": "northwest",
  top: "north",
  "top-right": "northeast",
  left: "west",
  center: "centre",
  right: "east",
  "bottom-left": "southwest",
  bottom: "south",
  "bottom-right": "southeast",
};

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

export async function getImageDimensions(
  filePath: string,
): Promise<{ width?: number; height?: number }> {
  const metadata = await sharp(filePath).metadata();
  return { width: metadata.width, height: metadata.height };
}

export function previewImage(filePath: string): void {
  const command =
    process.platform === "win32"
      ? "explorer.exe"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  const previewProcess = spawn(command, [filePath], {
    detached: true,
    stdio: "ignore",
  });
  previewProcess.unref();
}

export async function copyImage(
  source: string,
  destination: string,
): Promise<void> {
  if (!(await validateImage(source))) return;
  if (context.dryRun) {
    Logger.warning(
      `[DRYRUN] Would copy ${Logger.fmtBold(source)} to ${Logger.fmtBold(destination)}`,
    );
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  Logger.info(
    `Copied image from ${Logger.fmtBold(source)} to ${Logger.fmtBold(destination)}`,
  );
}

export async function generateThumbnail(
  imagePath: string,
  thumbnailPath: string,
  thumbnailAnchor: ThumbnailAnchor = "center",
): Promise<void> {
  const thumbnailDir = path.dirname(thumbnailPath);
  fs.mkdirSync(thumbnailDir, { recursive: true });

  await sharp(imagePath)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "cover",
      position: thumbnailAnchorPositions[thumbnailAnchor],
    })
    .webp({ quality: 100 })
    .toFile(thumbnailPath);
}
