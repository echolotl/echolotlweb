export type PicrossTileState = "empty" | "filled" | "marked";

export type PicrossBoard = PicrossTileState[][];
export type PicrossSolution = boolean[][];

export type PicrossGame = {
  board: PicrossBoard;
  solution: PicrossSolution; // The correct solution without any marked tiles
  hints: {
    rows: number[][];
    columns: number[][];
  };
  size: {
    width: number;
    height: number;
  };
  isCompleted: boolean;
  moves: number;
  secondsElapsed: number;
};

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

// Determines which hints are solved based on the current line state
export function getSolvedHints(line: PicrossTileState[], hints: number[]) {
  if (hints.length === 1 && hints[0] === 0) {
    return [line.every((tile) => tile === "marked")];
  }

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
