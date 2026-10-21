import type {
  PicrossMetadata,
  PicrossSize,
  PicrossSolution,
  PicrossTileColors,
} from "~/utils/picross";
import { isValidBoard, MAX_BOARD_SIZE, MIN_BOARD_SIZE } from "~/utils/picross";

const MAGIC_HEADER = new Uint8Array([
  0x45, 0x43, 0x48, 0x4f, 0x4c, 0x4f, 0x54, 0x4c,
]); // "ECHOLOTL"
const CURRENT_MAJOR_VERSION = 1;
const CURRENT_MINOR_VERSION = 0;
const MAX_PALETTE_SIZE = 255; // Tile color indexes are one byte, with 0 meaning "no color"
const MAX_COLOR_BYTES = 255; // Colors are length-prefixed with a single byte
export const FILE_EXTENSION = "epcp"; // "echolotl Picross Puzzle"

// What a saved puzzle file holds. Hints are derived from the solution on load, never stored.
export type PicrossPuzzleData = {
  majorVersion: number;
  minorVersion: number;
  metadata: PicrossMetadata;
  size: PicrossSize;
  solution: PicrossSolution;
  tileColors: PicrossTileColors;
};

// V1: [[magic, major, minor, width, height, solution,
// color count, length-prefixed colors, color indexes per tile, metadata
// as length-prefixed (u32, big endian) UTF-8 JSON.

function invalidFile(reason?: string): never {
  throw new Error(
    reason ? `Invalid puzzle file: ${reason}` : "Invalid puzzle file",
  );
}

function bytesToBase64(bytes: Uint8Array) {
  // fromCharCode EXPLODES on large arrays, so we do it in chunks
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(contents: string) {
  try {
    return Uint8Array.from(atob(contents.trim()), (c) => c.charCodeAt(0));
  } catch {
    return invalidFile("not valid base64");
  }
}

// Serializes a puzzle into the custom file format
export function savePicrossPuzzle(
  puzzle: Omit<PicrossPuzzleData, "majorVersion" | "minorVersion">,
): string {
  const { size, solution, tileColors, metadata } = puzzle;
  const textEncoder = new TextEncoder();

  const bytes: number[] = [
    ...MAGIC_HEADER,
    CURRENT_MAJOR_VERSION,
    CURRENT_MINOR_VERSION,
    size.width,
    size.height,
  ];
  for (const cell of solution.flat()) bytes.push(cell ? 1 : 0);

  const palette = [
    ...new Set(tileColors.flat().filter((c): c is string => c !== null)),
  ];
  if (palette.length > MAX_PALETTE_SIZE) {
    throw new Error(`Puzzles can use at most ${MAX_PALETTE_SIZE} colors`);
  }
  bytes.push(palette.length);
  for (const color of palette) {
    const encoded = textEncoder.encode(color);
    if (encoded.length > MAX_COLOR_BYTES) {
      throw new Error("A tile color is too long to save");
    }
    bytes.push(encoded.length, ...encoded);
  }
  for (const color of tileColors.flat()) {
    bytes.push(color === null ? 0 : palette.indexOf(color) + 1);
  }

  const metadataBytes = textEncoder.encode(JSON.stringify(metadata));
  const length = metadataBytes.length;
  bytes.push(
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
  );
  for (const byte of metadataBytes) bytes.push(byte);

  return bytesToBase64(Uint8Array.from(bytes));
}

// Parses the custom file format back into a puzzle
export function loadPicrossPuzzle(_contents: string): PicrossPuzzleData {
  const buffer = base64ToBytes(_contents);
  if (buffer.length < MAGIC_HEADER.length + 4) invalidFile();
  for (let i = 0; i < MAGIC_HEADER.length; i++) {
    if (buffer[i] !== MAGIC_HEADER[i]) invalidFile();
  }

  let offset = MAGIC_HEADER.length;
  function read(name: string) {
    const value = buffer[offset++];
    if (value === undefined) invalidFile(`missing ${name}`);
    return value;
  }
  function readBytes(length: number, name: string) {
    if (offset + length > buffer.length) invalidFile(`missing ${name}`);
    const slice = buffer.subarray(offset, offset + length);
    offset += length;
    return slice;
  }
  const textDecoder = new TextDecoder("utf-8", { fatal: true });
  function decode(bytes: Uint8Array) {
    try {
      return textDecoder.decode(bytes);
    } catch {
      return invalidFile("corrupt text");
    }
  }

  const majorVersion = read("major version");
  const minorVersion = read("minor version");
  if (majorVersion !== CURRENT_MAJOR_VERSION) {
    invalidFile(`unsupported version ${majorVersion}.${minorVersion}`);
  }

  const size: PicrossSize = { width: read("width"), height: read("height") };
  for (const side of [size.width, size.height]) {
    if (side < MIN_BOARD_SIZE || side > MAX_BOARD_SIZE) {
      invalidFile(`size must be ${MIN_BOARD_SIZE}-${MAX_BOARD_SIZE}`);
    }
  }

  const solution: PicrossSolution = [];
  for (let y = 0; y < size.height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size.width; x++) {
      const cell = read("solution tile");
      if (cell > 1) invalidFile("corrupt solution");
      row.push(cell === 1);
    }
    solution.push(row);
  }

  const paletteLength = read("palette length");
  const palette: string[] = [];
  for (let i = 0; i < paletteLength; i++) {
    palette.push(decode(readBytes(read("color length"), "color")));
  }

  const tileColors: PicrossTileColors = [];
  for (let y = 0; y < size.height; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < size.width; x++) {
      const index = read("tile color");
      if (index > palette.length) invalidFile("corrupt tile colors");
      row.push(index === 0 ? null : (palette[index - 1] ?? null));
    }
    tileColors.push(row);
  }

  const metadataLength =
    ((read("metadata length") << 24) |
      (read("metadata length") << 16) |
      (read("metadata length") << 8) |
      read("metadata length")) >>>
    0;
  let metadata: PicrossMetadata;
  try {
    metadata = JSON.parse(decode(readBytes(metadataLength, "metadata")));
  } catch {
    return invalidFile("corrupt metadata");
  }
  if (typeof metadata !== "object" || metadata === null) {
    invalidFile("corrupt metadata");
  }

  if (!isValidBoard(solution, size)) {
    invalidFile("corrupt solution");
  }

  return { majorVersion, minorVersion, metadata, size, solution, tileColors };
}
