import sharp from "sharp";
import { Logger } from "../../logger";
import * as fs from "node:fs";
import * as path from "node:path";
import { context } from "./context";
import type { Point } from "../../../types";

const THUMBNAIL_SIZE = 300;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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
  thumbnailFocus?: Point,
  thumbnailScale?: number,
): Promise<void> {
  const thumbnailDir = path.dirname(thumbnailPath);
  fs.mkdirSync(thumbnailDir, { recursive: true });

  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error(`Could not read image dimensions for ${imagePath}`);
  }

  const baseCropSide = Math.min(width, height);
  const zoom =
    typeof thumbnailScale === "number" && Number.isFinite(thumbnailScale)
      ? Math.max(1, thumbnailScale)
      : 1;
  const cropSide = Math.max(1, Math.round(baseCropSide / zoom));

  const focusX =
    typeof thumbnailFocus?.x === "number" && Number.isFinite(thumbnailFocus.x)
      ? thumbnailFocus.x
      : width / 2;
  const focusY =
    typeof thumbnailFocus?.y === "number" && Number.isFinite(thumbnailFocus.y)
      ? thumbnailFocus.y
      : height / 2;

  const maxLeft = Math.max(0, width - cropSide);
  const maxTop = Math.max(0, height - cropSide);
  const left = clamp(Math.round(focusX - cropSide / 2), 0, maxLeft);
  const top = clamp(Math.round(focusY - cropSide / 2), 0, maxTop);

  await image
    .extract({
      left,
      top,
      width: cropSide,
      height: cropSide,
    })
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "cover",
    })
    .webp({ quality: 100 })
    .toFile(thumbnailPath);
}
