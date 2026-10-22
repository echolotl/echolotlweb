import { clamp } from "~/utils";

export type PicrossTileState = "empty" | "filled" | "marked";

export type PicrossBoard = PicrossTileState[][];
export type PicrossSolution = boolean[][];
export type PicrossTileColors = (string | null)[][]; // Per-tile CSS color overrides for filled tiles; null uses the default color

export type PicrossSize = {
  width: number;
  height: number;
};

export const MIN_BOARD_SIZE = 1;
export const MAX_BOARD_SIZE = 50;
export const DEFAULT_BOARD_SIZE = 10;

export function clampPicrossSize(size: PicrossSize): PicrossSize {
  return {
    width: clamp(size.width, MIN_BOARD_SIZE, MAX_BOARD_SIZE),
    height: clamp(size.height, MIN_BOARD_SIZE, MAX_BOARD_SIZE),
  };
}

export function isValidBoard(
  board: unknown,
  size: PicrossSize,
): board is PicrossBoard {
  return (
    Array.isArray(board) &&
    board.length === size.height &&
    board.every(
      (row) =>
        Array.isArray(row) &&
        row.length === size.width &&
        row.every((tile) => ["empty", "filled", "marked"].includes(tile)),
    )
  );
}

export function isValidSolution(
  solution: unknown,
  size: PicrossSize,
): solution is PicrossSolution {
  return (
    Array.isArray(solution) &&
    solution.length === size.height &&
    solution.every(
      (row) =>
        Array.isArray(row) &&
        row.length === size.width &&
        row.every((tile) => typeof tile === "boolean"),
    )
  );
}

export type PicrossMetadata = {
  title?: string;
  author?: { name: string; id?: string };
  source?: { name: string; url?: string | URL };
  created_at: string;
  modified_at: string;
};

export function createTileColors(size: PicrossSize): PicrossTileColors {
  return Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => null),
  );
}

export type PicrossGame = {
  board: PicrossBoard;
  tileColors: PicrossTileColors;
  solution: PicrossSolution; // The correct solution without any marked tiles
  hints: {
    rows: number[][];
    columns: number[][];
  };
  size: PicrossSize;
  isCompleted: boolean;
  moves: number;
  hintsUsed: number;
  secondsElapsed: number;
  metadata?: PicrossMetadata;
};

// A tile's state plus its color; only filled tiles keep a color
export type PicrossTile = {
  state: PicrossTileState;
  color: string | null;
};

// What an input does to a tile; an omitted state or color leaves it as is
export type PicrossTileChange = {
  state?: PicrossTileState;
  color?: string | null;
};

// Applies a change to a tile, dropping the color of anything that isn't filled
export function applyTileChange(
  tile: PicrossTile,
  change: PicrossTileChange,
): PicrossTile {
  const state = change.state ?? tile.state;
  if (state !== "filled") return { state, color: null };
  return {
    state,
    color: change.color === undefined ? tile.color : change.color,
  };
}

export type InputModeDefinition = {
  icon: string;
  keys: string[]; // KeyboardEvent.code values that select this mode
  optIn?: true; // Hidden from the controls unless a parent lists it in `addModes`
  // What a tile should become when clicked; secondary is a right click.
  // Colors only matter in the editor, where they are written to the solution.
  resolve: (
    current: PicrossTile,
    secondary: boolean,
    editor?: boolean,
    paintColor?: string | null,
  ) => PicrossTileChange;
};

function toggleTo(
  current: PicrossTile,
  target: PicrossTileState,
): PicrossTileChange {
  return { state: current.state === target ? "empty" : target };
}

export const INPUT_MODES = {
  fill: {
    icon: "edit",
    keys: ["KeyB", "Key1"],
    resolve: (current, secondary, editor) => {
      if (editor) return toggleTo(current, secondary ? "empty" : "filled");
      return toggleTo(current, secondary ? "marked" : "filled");
    },
  },
  mark: {
    icon: "close",
    keys: ["KeyM", "Key2"],
    resolve: (current, secondary, editor) => {
      if (editor) return {};
      return toggleTo(current, secondary ? "filled" : "marked");
    },
  },
  erase: {
    icon: "trash",
    keys: ["KeyE", "Key3"],
    resolve: () => ({ state: "empty" }),
  },
  paint: {
    icon: "palette",
    keys: ["KeyP", "Key4"],
    optIn: true,
    resolve: (current, secondary, editor, paintColor) => {
      if (!editor) return {};
      // No paint color means the default tile color
      return { color: secondary ? null : (paintColor ?? null) };
    },
  },
} as const satisfies Record<string, InputModeDefinition>;

export type InputMode = keyof typeof INPUT_MODES;

export const DEFAULT_INPUT_MODE = Object.keys(INPUT_MODES)[0] as InputMode;

const inputModeDefinitions: Record<InputMode, InputModeDefinition> =
  INPUT_MODES;

export function getInputModeDefinition(mode: InputMode): InputModeDefinition {
  return inputModeDefinitions[mode];
}

// Modes shown in the controls: every non-opt-in mode plus `add`, minus `remove`
export function getInputModes(
  remove: readonly InputMode[] = [],
  add: readonly InputMode[] = [],
): { mode: InputMode; definition: InputModeDefinition }[] {
  return (Object.keys(INPUT_MODES) as InputMode[])
    .map((mode) => ({ mode, definition: inputModeDefinitions[mode] }))
    .filter(
      ({ mode, definition }) =>
        !remove.includes(mode) && (!definition.optIn || add.includes(mode)),
    );
}

export function getInputModeForKey(code: string): InputMode | undefined {
  return getInputModes().find(({ definition }) =>
    definition.keys.includes(code),
  )?.mode;
}

export function createPicrossGame(
  size: PicrossSize,
  solution: PicrossSolution,
): PicrossGame {
  return {
    board: Array.from({ length: size.height }, () =>
      Array.from({ length: size.width }, () => "empty" as PicrossTileState),
    ),
    tileColors: createTileColors(size),
    solution,
    hints: getHints(solution),
    size,
    isCompleted: false,
    moves: 0,
    hintsUsed: 0,
    secondsElapsed: 0,
  };
}
//#region HINTS UTILS

// Gets the runs of filled tiles in a line
function getLineRuns(
  line: PicrossTileState[],
): { length: number; start: number }[] {
  const runs: { length: number; start: number }[] = [];
  let start = -1;

  line.forEach((tile, index) => {
    if (tile === "filled") {
      if (start === -1) start = index;
    } else if (start !== -1) {
      runs.push({ length: index - start, start });
      start = -1;
    }
  });

  if (start !== -1) runs.push({ length: line.length - start, start });
  return runs;
}

export function getLineHints(line: PicrossSolution[number]) {
  const runs = getLineRuns(
    line.map((filled): PicrossTileState => (filled ? "filled" : "empty")),
  ).map((run) => run.length);
  return runs.length > 0 ? runs : [0];
}

// Gets the hints for the entire solution board based on the filled runs
export function getHints(solution: PicrossSolution) {
  const rows = solution.map((row) => getLineHints(row));
  const columns =
    solution[0]?.map((_, column) =>
      getLineHints(solution.map((row) => row[column] ?? false)),
    ) ?? [];

  return { rows, columns };
}

// More filled tiles than the hints allow means the line is wrong, even if some runs still look solved
export function isLineOverfilled(line: PicrossTileState[], hints: number[]) {
  const filled = line.filter((tile) => tile === "filled").length;
  return filled > hints.reduce((a, b) => a + b, 0);
}

// Determines which hints are solved based on the current line state
export function getSolvedHints(line: PicrossTileState[], hints: number[]) {
  if (hints.length === 1 && hints[0] === 0) {
    return [line.every((tile) => tile === "marked")];
  }

  if (isLineOverfilled(line, hints)) return hints.map(() => false);

  // With multiple hints, a run only counts once it's capped by an edge or an X on both sides
  const capped = (index: number) =>
    index < 0 || index >= line.length || line[index] === "marked";
  const runs = getLineRuns(line).filter(
    (run) =>
      hints.length === 1 ||
      (capped(run.start - 1) && capped(run.start + run.length)),
  );

  const count = hints.length;
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const minStart = (k: number) => sum(hints.slice(0, k)) + k;
  const minTail = (k: number) => sum(hints.slice(k + 1)) + (count - k - 1);

  let agreed: boolean[] | null = null;

  function assign(j: number, previous: number, chosen: number[]) {
    if (j === runs.length) {
      agreed = hints.map(
        (_, i) => chosen.includes(i) && (agreed ? agreed[i]! : true),
      );
      return;
    }

    const run = runs[j]!;
    for (let k = previous + 1; k < count; k++) {
      if (hints[k] !== run.length) continue;
      if (run.start < minStart(k)) continue;
      if (run.start + run.length > line.length - minTail(k)) continue;
      if (j > 0) {
        const prev = runs[j - 1]!;
        const between = hints.slice(previous + 1, k);
        const needed = 1 + sum(between) + between.length;
        if (run.start - (prev.start + prev.length) < needed) continue;
      }
      assign(j + 1, k, [...chosen, k]);
    }
  }

  assign(0, -1, []);
  return agreed ?? hints.map(() => false);
}

//#endregion HINTS UTILS

// Solved when the filled tiles match the solution; marks and empties are equivalent
export function isBoardSolved({ board, solution }: PicrossGame) {
  for (let y = 0; y < solution.length; y++) {
    const row = solution[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      if ((board[y]?.[x] === "filled") !== (row[x] ?? false)) return false;
    }
  }
  return true;
}

export function clearBoard(game: PicrossGame): void {
  for (const row of game.board) row.fill("empty");
  game.tileColors = createTileColors(game.size);
  game.isCompleted = false;
}

export function solveGame(game: PicrossGame): void {
  for (let y = 0; y < game.solution.length; y++) {
    const [row, boardRow] = [game.solution[y], game.board[y]];
    if (!row || !boardRow) continue;
    // Fill the board row with the solution.
    for (let x = 0; x < row.length; x++) {
      boardRow[x] = row[x] ? "filled" : "marked";
    }
  }
  game.isCompleted = true;
}

export function fillRandomTile(
  game: PicrossGame,
  random = Math.random,
): boolean {
  if (game.isCompleted) return false;
  const { board, solution } = game;
  const emptyTiles: { x: number; y: number }[] = [];
  board.forEach((row, y) =>
    row.forEach((tile, x) => {
      if (tile === "empty") emptyTiles.push({ x, y });
    }),
  );
  const randomTile = emptyTiles[Math.floor(random() * emptyTiles.length)];
  const boardRow = randomTile && board[randomTile.y];
  if (!randomTile || !boardRow) return false;
  const correctValue = solution[randomTile.y]?.[randomTile.x];
  boardRow[randomTile.x] = correctValue ? "filled" : "marked";
  game.isCompleted = isBoardSolved(game);
  return true;
}
