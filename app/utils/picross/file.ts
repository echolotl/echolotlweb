import type {
  PicrossSize,
  PicrossSolution,
  PicrossTileColors,
} from "~/utils/picross";

const MAGIC_HEADER = new Uint8Array([0x50, 0x43, 0x52, 0x53]); // "PCRS"
export const FILE_EXTENSION = "epcp"; // "echolotl Picross Puzzle"

// What a saved puzzle file holds. Hints are derived from the solution on load, never stored.
export type PicrossPuzzleData = {
  size: PicrossSize;
  solution: PicrossSolution;
  tileColors: PicrossTileColors;
};

// Serializes a puzzle into the custom file format
export function savePicrossPuzzle(_puzzle: PicrossPuzzleData): string {
  const { size, solution, tileColors } = _puzzle;
  const sizeBuffer = new Uint8Array([size.width, size.height]);
  const solutionBuffer = new Uint8Array(
    solution.flat().map((cell) => (cell ? 1 : 0)),
  );
  // Colors are strings or null: store a palette (count, then length-prefixed
  // strings), followed by one byte per tile (0 = null, otherwise palette index + 1).
  const palette = [
    ...new Set(tileColors.flat().filter((c): c is string => c !== null)),
  ];
  const paletteBytes = palette.flatMap((color) => [
    color.length,
    ...Array.from(color, (ch) => ch.charCodeAt(0) & 0xff),
  ]);
  const tileColorsBuffer = new Uint8Array([
    palette.length,
    ...paletteBytes,
    ...tileColors.flat().map((c) => (c === null ? 0 : palette.indexOf(c) + 1)),
  ]);

  const totalLength =
    MAGIC_HEADER.length +
    sizeBuffer.length +
    solutionBuffer.length +
    tileColorsBuffer.length;
  const buffer = new Uint8Array(totalLength);
  buffer.set(MAGIC_HEADER, 0);
  buffer.set(sizeBuffer, MAGIC_HEADER.length);
  buffer.set(solutionBuffer, MAGIC_HEADER.length + sizeBuffer.length);
  buffer.set(
    tileColorsBuffer,
    MAGIC_HEADER.length + sizeBuffer.length + solutionBuffer.length,
  );

  return btoa(String.fromCharCode(...buffer));
}

// Parses the custom file format back into a puzzle
export function loadPicrossPuzzle(_contents: string): PicrossPuzzleData {
  const buffer = Uint8Array.from(atob(_contents), (c) => c.charCodeAt(0));
  if (buffer.length < MAGIC_HEADER.length + 2) {
    throw new Error("Invalid puzzle file");
  }
  for (let i = 0; i < MAGIC_HEADER.length; i++) {
    if (buffer[i] !== MAGIC_HEADER[i]) {
      throw new Error("Invalid puzzle file");
    }
  }

  function ensureValue(value: number | undefined, name: string) {
    if (value === undefined) {
      throw new Error(`Missing value for ${name}`);
    }
    return value;
  }
  const size: PicrossSize = {
    width: ensureValue(buffer[MAGIC_HEADER.length], "width"),
    height: ensureValue(buffer[MAGIC_HEADER.length + 1], "height"),
  };
  const solutionStart = MAGIC_HEADER.length + 2;
  const solutionEnd = solutionStart + size.width * size.height;
  const solution: PicrossSolution = [];
  for (let y = 0; y < size.height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size.width; x++) {
      row.push(buffer[solutionStart + y * size.width + x] === 1);
    }
    solution.push(row);
  }
  let offset = solutionEnd;
  const paletteLength = ensureValue(buffer[offset++], "palette length");
  const palette: string[] = [];
  for (let i = 0; i < paletteLength; i++) {
    const colorLength = ensureValue(buffer[offset++], "color length");
    let color = "";
    for (let j = 0; j < colorLength; j++) {
      color += String.fromCharCode(ensureValue(buffer[offset++], "color byte"));
    }
    palette.push(color);
  }
  const tileColors: PicrossTileColors = [];
  for (let y = 0; y < size.height; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < size.width; x++) {
      const idx = ensureValue(buffer[offset++], "tile color");
      row.push(idx === 0 ? null : (palette[idx - 1] ?? null));
    }
    tileColors.push(row);
  }
  return { size, solution, tileColors };
}
