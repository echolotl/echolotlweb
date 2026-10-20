export type PicrossTileState = "empty" | "filled" | "marked";

export type PicrossBoard = PicrossTileState[][];
export type PicrossSolution = boolean[][];
export type PicrossTileColors = (string | null)[][]; // Per-tile CSS color overrides for filled tiles; null uses the default color

export type PicrossSize = {
  width: number;
  height: number;
};

export type PicrossMetadata = {
  title?: string;
  author?: string | { userId: string, placeholder: string };
  source?: string | { name: string, url: string | URL};
  created_at: string;
  modified_at: string;
}

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

export type InputMode = "fill" | "mark" | "erase";

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

export function fillRandomTile(game: PicrossGame, random = Math.random): boolean {
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
