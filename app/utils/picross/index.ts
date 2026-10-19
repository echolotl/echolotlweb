export type PicrossTileState = "empty" | "filled" | "marked";

export type PicrossBoard = PicrossTileState[][];
export type PicrossSolution = boolean[][];
export type PicrossTileColors = (string | null)[][]; // Per-tile CSS color overrides for filled tiles; null uses the default color

export type PicrossSize = {
  width: number;
  height: number;
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
};

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

// The daily puzzle changes at midnight in this timezone, regardless of the player's own
export const DAILY_TIME_ZONE = "America/Chicago";

const dateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Calendar date in DAILY_TIME_ZONE as YYYY-MM-DD, used to key the daily puzzle
export function getDateKey(date = new Date()) {
  const parts = Object.fromEntries(
    dateKeyFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// Seconds until the date in DAILY_TIME_ZONE next changes. Found by search so
// 23 and 25 hour days (daylight saving changes) are handled correctly.
export function getSecondsUntilNextDay(now = new Date()) {
  const today = getDateKey(now);
  let low = 0;
  let high = 26 * 3600;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (getDateKey(new Date(now.getTime() + mid * 1000)) === today) low = mid;
    else high = mid;
  }
  return high;
}

// Whole calendar days from one YYYY-MM-DD key to another
export function daysBetweenDateKeys(from: string, to: string) {
  const toUtcDay = (key: string) => {
    const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtcDay(to) - toUtcDay(from)) / 86_400_000);
}

// mulberry32-like deterministic PRNG seeded from a string
export function createSeededRandom(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
