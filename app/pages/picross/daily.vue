<template>
  <div class="picross-page">
    <div class="decoration"></div>
    <h1 class="picross-header">Nautilus' Picross</h1>
    <span v-if="puzzleNumber !== null" class="header-games lotl-font"
      >Puzzle #{{ puzzleNumber }}
    </span>
    <div class="game">
      <PicrossGrid v-if="game" :game="game" :locked="!started" />
      <p
        v-if="game"
        class="daily-info text-secondary lotl-font"
        :style="{ color: game.isCompleted ? 'var(--primary)' : undefined }"
      >
        <span v-if="game.isCompleted && !gaveUp">
          <Icon
            icon="crown"
            width="16px"
            height="16px"
            :style="{ color: 'var(--orange)' }"
          ></Icon>
        </span>
        <span>
          <Icon icon="time" width="16px" height="16px" />
          <SlotText :text="timeDisplay" :options="{ skipUnchanged: true }" />
        </span>
        <span>
          <Icon icon="moves" width="16px" height="16px" />
          <SlotText
            :text="String(game?.moves ?? 0)"
            :options="{ skipUnchanged: true }"
          />
        </span>
        <span>
          <Icon icon="tip" width="16px" height="16px" />
          <SlotText
            :text="String(game?.hintsUsed ?? 0)"
            :options="{ skipUnchanged: true }"
          />
        </span>
        <span>
          <Icon icon="size" width="16px" height="16px" />
          {{ game?.size.width ?? 0 }}x{{ game?.size.height ?? 0 }}
        </span>
      </p>
      <div v-if="game?.isCompleted" class="game-actions">
        <button @click="copyWin" class="round filled">
          <Icon icon="copy" width="16px" height="16px" />
          Copy Result
        </button>
      </div>
      <p v-if="game?.isCompleted" class="time-till-next-game text-secondary">
        Next game in:
        <b>
          <SlotText
            :text="`${timeTillNextGameDisplay}`"
            :options="{ skipUnchanged: true }"
          />
        </b>
      </p>
      <div v-if="game && !started" class="game-actions">
        <button @click="beginGame" class="round filled">Start</button>
      </div>
      <div v-else class="game-actions">
        <button :disabled="game?.isCompleted" @click="clearBoard" class="round">
          <Icon icon="trash" width="20px" height="20px" />
          Clear
        </button>
        <button
          :disabled="game?.isCompleted"
          @click="giveUp"
          class="round filled red"
        >
          Give Up
        </button>
        <button :disabled="game?.isCompleted" @click="useHint" class="round">
          <Icon icon="tip" width="20px" height="20px" />
          Hint
        </button>
      </div>
      <p>
        Want to keep playing? Go to
        <NuxtLink to="/picross" class="link">free play</NuxtLink>!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import Icon from "~/components/common/Icon.vue";
import { SlotText } from "slot-text/vue";
import "slot-text/style.css";
import {
  createSeededRandom,
  createPicrossGame,
  daysBetweenDateKeys,
  getDateKey,
  getHints,
  getSecondsUntilNextDay,
  type PicrossBoard,
  type PicrossGame,
} from "~/utils/picross";
import { generateSolvableSolution } from "~/utils/picross/solver";
import { usePicrossGame } from "~/composables/usePicrossGame";

type PicrossGameStats = Omit<PicrossGame, "tileColors" | "solution"> & {
  gaveUp?: boolean;
};

type PicrossSave = {
  history: Record<string, PicrossGameStats>; // Keyed by date
  totalMoves: number;
  totalHintsUsed: number;
  totalWins: number;
  lastPlayed: string | null; // date
};

const MIN_SIZE = 5;
const MAX_SIZE = 20;
const LOCAL_STORAGE_KEY = "picross:stats:v1";
const FIRST_GAME_DATE = "2026-10-18";

const { game, checkIfCompleted, clearBoard, solveGame, fillOne } =
  usePicrossGame();
const dateKey = ref("");
const gaveUp = ref(false);
const started = ref(false);
const save = ref<PicrossSave>({
  history: {},
  totalMoves: 0,
  totalHintsUsed: 0,
  totalWins: 0,
  lastPlayed: null,
});
let timer: ReturnType<typeof setInterval> | undefined;
let countedMoves = 0;
let countedHints = 0;
let countedWin = false;

function formatTime(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatCountdown(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// Reactive clock so the countdown updates every tick
const now = ref(new Date());

const timeDisplay = computed(() => formatTime(game.value?.secondsElapsed ?? 0));
const timeTillNextGameDisplay = computed(() => {
  if (!game.value?.isCompleted) return "";
  return formatCountdown(getSecondsUntilNextDay(now.value));
});

const puzzleNumber = computed(() =>
  dateKey.value ? daysBetweenDateKeys(FIRST_GAME_DATE, dateKey.value) : null,
);

// #region SAVE DATA
function loadSave() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<PicrossSave>;
    save.value = {
      history: parsed.history ?? {},
      totalMoves: parsed.totalMoves ?? 0,
      totalHintsUsed: parsed.totalHintsUsed ?? 0,
      totalWins: parsed.totalWins ?? 0,
      lastPlayed: parsed.lastPlayed ?? null,
    };
  } catch {
    // Corrupt or unavailable storage: start fresh
  }
}

function persist() {
  const current = game.value;
  if (!current || !started.value) return;

  // Totals are only credited with progress made since the last persist
  save.value.totalMoves += current.moves - countedMoves;
  countedMoves = current.moves;
  save.value.totalHintsUsed += current.hintsUsed - countedHints;
  countedHints = current.hintsUsed;
  if (current.isCompleted && !gaveUp.value && !countedWin) {
    save.value.totalWins++;
    countedWin = true;
  }

  save.value.lastPlayed = dateKey.value;
  save.value.history[dateKey.value] = {
    board: current.board,
    hints: current.hints,
    size: current.size,
    isCompleted: current.isCompleted,
    moves: current.moves,
    hintsUsed: current.hintsUsed,
    secondsElapsed: current.secondsElapsed,
    gaveUp: gaveUp.value,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(save.value));
  } catch {
    // Storage full or unavailable; progress just won't persist
  }
}
// #endregion SAVE DATA

// #region GAME INIT
// The same date always produces the same size and puzzle
function createDailyGame(key: string): PicrossGame {
  const random = createSeededRandom(`echolotl-picross-${key}`);
  const randomSide = () =>
    MIN_SIZE + Math.floor(random() * (MAX_SIZE - MIN_SIZE + 1));
  const size = { width: randomSide(), height: randomSide() };
  const solution = generateSolvableSolution(
    size,
    getHints,
    300,
    Infinity,
    random,
  );
  return createPicrossGame(size, solution);
}

function isValidBoard(
  board: unknown,
  size: PicrossGame["size"],
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

function startDailyGame() {
  dateKey.value = getDateKey();
  const created = createDailyGame(dateKey.value);
  gaveUp.value = false;
  started.value = false;
  countedMoves = 0;
  countedHints = 0;
  countedWin = false;

  const saved = save.value.history[dateKey.value];
  if (saved && isValidBoard(saved.board, created.size)) {
    created.board = saved.board;
    created.moves = saved.moves ?? 0;
    created.hintsUsed = saved.hintsUsed ?? 0;
    created.secondsElapsed = saved.secondsElapsed ?? 0;
    created.isCompleted = saved.isCompleted ?? false;
    gaveUp.value = saved.gaveUp ?? false;
    started.value = true;
    countedMoves = created.moves;
    countedHints = created.hintsUsed;
    countedWin = created.isCompleted;
  }

  game.value = created;
  checkIfCompleted();
}
// #endregion GAME INIT

function beginGame() {
  started.value = true;
  persist();
}

function giveUp() {
  if (!game.value || game.value.isCompleted) return;
  gaveUp.value = true;
  solveGame();
}

function useHint() {
  if (fillOne()) game.value!.hintsUsed++;
}

function copyWin() {
  if (!game.value || !game.value.isCompleted) return;
  const text = `
  Nautilus' Picross #${puzzleNumber.value} [${game.value.size.width}x${game.value.size.height}] ${gaveUp.value ? "❌" : "👑"}\n⬜ ${game.value.moves}\n💡 ${game.value.hintsUsed}\n🕒 ${formatTime(game.value.secondsElapsed)}\n\nhttps://echolotl.lol/picross/daily
  `.trim();
  navigator.clipboard.writeText(text);
}

onMounted(() => {
  loadSave();
  startDailyGame();
  timer = setInterval(() => {
    now.value = new Date();
    // Start the new puzzle if the page stayed open past midnight
    if (getDateKey(now.value) !== dateKey.value) {
      startDailyGame();
      return;
    }
    if (
      game.value &&
      started.value &&
      !game.value.isCompleted &&
      !document.hidden
    ) {
      game.value.secondsElapsed++;
    }
  }, 1000);
});

onBeforeUnmount(() => clearInterval(timer));

watch(game, persist, { deep: true });

useSeoMeta({
  title: "echolotl - Nautilus' Picross",
  description:
    "Play Nautilus' daily picross puzzle! Figure out the pattern the best you can every day.",
  ogDescription:
    "Play Nautilus' daily picross puzzle! (They are fed by puzzles)",
  ogTitle: "Nautilus' Picross",
  ogUrl: "https://echolotl.lol/picross/daily",
});
</script>

<style scoped>
.picross-page {
  margin-top: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80vh; /* Ensure the page takes full viewport height */
}
.picross-header {
  position: relative;
  mask-image: url("/images/picross/daily.webp");
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  background-color: var(--text);
  height: 100px;
  width: 100%;
}
.game {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
}
.header-games {
  position: relative;
  z-index: 1;
  margin-top: -28px;
  font-size: 1.25rem;
  paint-order: stroke;
  -webkit-text-stroke: 6px var(--background);
}
.daily-info {
  display: flex;
  align-items: center;
  gap: 8px;
  > span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
.solved-message {
  margin: 0;
  font-weight: bold;
}
.game-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  > button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 8px;
  }
}
</style>
