<template>
  <div class="wheel-page">
    <div class="content">
      <div class="wheel-container" @click="!isSpinning && spinToSlice()">
        <SketchFilter id="wheel-sketch" flood-color="var(--surface)" />
        <svg
          viewBox="0 0 400 400"
          width="800"
          height="800"
          filter="url(#wheel-sketch)">
          <g
            v-if="wheelSlices.length >= 1"
            class="wheel-spin-layer"
            :style="{ transform: `rotate(${wheelRotation}deg)` }">
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="none"
              stroke="var(--distant)"
              stroke-width="6" />
            <template v-for="(slice, index) in wheelSlices" :key="index">
              <circle
                v-if="slice.endAngle - slice.startAngle >= 359.999"
                cx="200"
                cy="200"
                r="180"
                :fill="slice.color" />
              <g v-else>
                <path
                  :d="getSlice(200, 200, 180, slice.startAngle, slice.endAngle)"
                  :fill="slice.color" />
                <path
                  :d="
                    getOuterArc(200, 200, 180, slice.startAngle, slice.endAngle)
                  "
                  fill="none"
                  :stroke="slice.color"
                  stroke-width="3" />
                <g
                  :transform="`translate(200, 200) rotate(${(slice.startAngle + slice.endAngle) / 2 - 90})`">
                  <text
                    :x="175"
                    y="
                    0
                  "
                    text-anchor="end"
                    dominant-baseline="middle"
                    :fill="sliceContrastTextColor(slice)"
                    font-size="16"
                    font-family="Lotl">
                    {{ slice.title }}
                  </text>
                </g>
              </g>
            </template>
            <path
              v-for="(slice, index) in wheelSlices"
              :key="`separator-${index}`"
              :d="getLeftEdge(200, 200, 180, slice.startAngle)"
              fill="none"
              stroke="var(--distant)"
              stroke-width="3"
              vector-effect="non-scaling-stroke" />
          </g>
          <template v-else>
            <circle
              cx="200"
              cy="200"
              r="180"
              stroke="var(--distant)"
              fill="none"
              stroke-dasharray="16 8"
              stroke-linecap="round"
              stroke-width="3" />
          </template>
        </svg>
      </div>
      <div class="selector">
        <div class="section preset">
          <h6 class="section-heading">Preset</h6>
          <select v-model="selectedPreset" class="preset-select">
            <option
              v-for="preset in Object.keys(presets)"
              :key="preset"
              :value="preset">
              {{ preset }}
            </option>
          </select>
        </div>
        <div class="section">
          <h6 class="section-heading">Slices</h6>
          <div class="slice-editor">
            <div
              v-for="(slice, index) in slices"
              :key="index"
              class="slice-item">
              <input v-model="slice.title" />
              <div style="display: flex; justify-content: space-between">
                <div
                  style="
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    width: 100%;
                  ">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    placeholder="%"
                    v-model.number="slice.percent" />
                  <input type="color" v-model="slice.color" />
                </div>
                <div>
                  <button
                    @click="
                      () => {
                        if (isSpinning) stopSpinAnimation();
                        slices.splice(index, 1);
                      }
                    "
                    class="action-button delete">
                    <Icon icon="close" />
                  </button>
                </div>
              </div>
            </div>
            <button
              @click="
                slices.push({
                  title: 'New Slice',
                  color: `#${Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0')}`,
                })
              "
              class="action-button"
              style="
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                gap: 0.25rem;
              ">
              <Icon icon="edit" /> Add Slice
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { queryCollection } from "#imports";
import { useAsyncData } from "nuxt/app";
import { type Character } from "~~/types";
import Icon from "~/components/common/Icon.vue";
import SketchFilter from "~/components/common/SketchFilter.vue";

// Types
type Slice = {
  title: string;
  percent?: number | null;
  color: string;
};

type WheelSlice = Slice & {
  percent: number;
  startAngle: number;
  endAngle: number;
};

// Reactive state
const slices = ref<Slice[]>([]);
const wheelRotation = ref(0);
const selectedSlice = ref<WheelSlice | null>(null);
const isSpinning = ref(false);
const selectedPreset = ref("");

// Animation timing
const SPIN_DURATION = 10000;
const PREPARE_DURATION = 500;
const PREPARE_OFFSET = 55;

// Animation tracking
let spinAnimationToken = 0;
let spinRafId: number | null = null;

// Preset generators
const presets: Record<string, () => Slice[] | Promise<Slice[]>> = {
  None: () => [],
  Characters: async () => {
    const { data: characters } = await useAsyncData<Character[]>(
      "characters",
      () => {
        return queryCollection("characters" as never).all();
      },
    );
    return characters.value
      ? characters.value.map((char) => ({
          title: char.name,
          color: char.theme_color || "#888888",
        }))
      : [];
  },
  "4 Slices": () => [
    { title: "Slice 1", color: "#FF0000" },
    { title: "Slice 2", color: "#00FF00" },
    { title: "Slice 3", color: "#0000FF" },
    { title: "Slice 4", color: "#FFFF00" },
  ],
};

// Preset selection
watch(selectedPreset, async (preset: keyof typeof presets) => {
  if (preset && presets[preset]) {
    slices.value = await presets[preset]();
  }
});

// Angle helpers
const toRad = (angle: number) => ((angle - 90) * Math.PI) / 180;
const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

// SVG path helpers
const getSlice = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) => {
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
};

const getOuterArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) => {
  if (endAngle - startAngle >= 360) {
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  }

  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

const getLeftEdge = (cx: number, cy: number, r: number, startAngle: number) => {
  const x = cx + (r + 2) * Math.cos(toRad(startAngle));
  const y = cy + (r + 2) * Math.sin(toRad(startAngle));

  return `M ${cx} ${cy} L ${x} ${y}`;
};

// Animation helpers
function stopSpinAnimation() {
  spinAnimationToken += 1;
  if (spinRafId !== null) {
    cancelAnimationFrame(spinRafId);
    spinRafId = null;
    isSpinning.value = false;
  }
}

function runTween(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number,
  token: number,
): Promise<boolean> {
  if (duration <= 0) {
    wheelRotation.value = to;
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const start = performance.now();

    const step = (now: number) => {
      if (token !== spinAnimationToken) {
        resolve(false);
        return;
      }

      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easing(t);
      wheelRotation.value = from + (to - from) * eased;

      if (t < 1) {
        spinRafId = requestAnimationFrame(step);
        return;
      }

      spinRafId = null;
      resolve(true);
    };

    spinRafId = requestAnimationFrame(step);
  });
}

// Derived wheel slices
const wheelSlices = computed<WheelSlice[]>(() => {
  if (slices.value.length === 0) {
    return [];
  }

  const specified: Array<number | null> = slices.value.map((slice) => {
    if (!Number.isFinite(slice.percent)) {
      return null;
    }
    return Math.max(0, slice.percent as number);
  });

  const specifiedTotal = specified.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  const unspecifiedCount = specified.filter((value) => value === null).length;
  const remaining = Math.max(0, 100 - specifiedTotal);
  const fallbackPercent =
    unspecifiedCount > 0 ? remaining / unspecifiedCount : 0;

  const resolvedPercents = specified.map((value) => value ?? fallbackPercent);
  const totalPercent = resolvedPercents.reduce((sum, value) => sum + value, 0);
  const normalizedTotal = totalPercent > 0 ? totalPercent : 1;

  let currentAngle = 0;
  return slices.value.map((slice, index) => {
    const percent = resolvedPercents[index] ?? 0;
    const angleSize = (percent / normalizedTotal) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSize;
    currentAngle = endAngle;

    return {
      ...slice,
      percent,
      startAngle,
      endAngle,
    };
  });
});

// Randomally selects a slice w/ weights
function selectSlice(): WheelSlice | null {
  const totalPercent = wheelSlices.value.reduce(
    (sum, slice) => sum + slice.percent,
    0,
  );
  if (totalPercent <= 0) {
    return null;
  }

  // Select proportionally to the resolved per-slice percentages.
  const rand = Math.random() * totalPercent;
  let cumulative = 0;
  for (const slice of wheelSlices.value) {
    cumulative += slice.percent;
    if (rand < cumulative) {
      return slice;
    }
  }
  return wheelSlices.value.at(-1) ?? null;
}

async function spinToSlice() {
  const slice = selectSlice();
  if (!slice) {
    return;
  }

  selectedSlice.value = slice;
  isSpinning.value = true;
  stopSpinAnimation();
  const token = spinAnimationToken;

  const startRotation = wheelRotation.value;
  const randomInSlice =
    slice.startAngle + Math.random() * (slice.endAngle - slice.startAngle);
  const targetRotation = (360 - normalizeAngle(randomInSlice)) % 360;
  const currentRotation = normalizeAngle(startRotation);
  const deltaToTarget = (targetRotation - currentRotation + 360) % 360;
  const extraTurns = 3 + Math.floor(Math.random() * 3);
  const endRotation = startRotation + extraTurns * 360 + deltaToTarget;

  const prepareDone = await runTween(
    startRotation,
    startRotation - PREPARE_OFFSET,
    PREPARE_DURATION,
    (t) => 1 - Math.pow(1 - t, 1.5),
    token,
  );
  if (!prepareDone || token !== spinAnimationToken) {
    isSpinning.value = false;
    return;
  }

  const spinDone = await runTween(
    startRotation - PREPARE_OFFSET,
    endRotation,
    SPIN_DURATION,
    (t) => 1 - Math.pow(1 - t, 3),
    token,
  );
  if (!spinDone || token !== spinAnimationToken) {
    isSpinning.value = false;
    return;
  }

  wheelRotation.value = normalizeAngle(endRotation);
  isSpinning.value = false;
}

// Text contrast helper
function sliceContrastTextColor(slice: Slice): string {
  const color = slice.color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

onBeforeUnmount(() => {
  stopSpinAnimation();
});
</script>
<style scoped lang="scss">
@use "sass:color";
.wheel-page {
  display: flex;
  flex-direction: row;
  padding: 2rem;
  padding-top: calc(2rem + 60px);
  max-width: 100%;
  min-height: 75vh;
  margin: 0 auto;
  z-index: 1;
}
.content {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.wheel-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 2rem;
  overflow: hidden;
  mask-image: linear-gradient(to top, transparent 0%, black 64px);
  position: relative;

  > svg {
    transform: translateY(50%);
  }
  &::after {
    content: "";
    position: absolute;
    bottom: 408px;
    left: calc(50% - 16px);
    width: 32px;
    height: 32px;
    mask: url("/images/icons/small-arrow.webp") no-repeat center;
    background-color: var(--text);
    transform: rotate(90deg);
    pointer-events: none;
  }
}
.wheel-spin-layer {
  transform-origin: 200px 200px;
  transform-box: view-box;
  will-change: transform;
}
.selector {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  width: 100%;
  height: 300px;
  max-height: 75vh;
  overflow: hidden;
  padding: 2rem 0;
  .section {
    display: flex;
    flex-direction: column;
    min-width: 0;

    &:not(.preset) {
      flex: 1;
    }

    &.preset {
      flex-shrink: 0;
      width: 200px;
    }
  }
}
.section-heading {
  margin: 1rem 0 0.5rem;
  font-size: var(--small-text);
  text-transform: uppercase;
  color: var(--text-secondary);
}
.slice-editor {
  display: grid;
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: column;
  grid-auto-columns: minmax(160px, 220px);
  width: 100%;
  gap: 1rem;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-gutter: stable;
}
.slice-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  input {
    padding: 0.25rem;
    border: none;
    border-bottom: 1px solid var(--distant);
    background: transparent;
    color: var(--text);
    font-family: inherit;
    font-size: inherit;
    &:active,
    &:focus,
    &:focus-visible {
      outline: none;
      border-color: var(--primary);
    }
  }
  input[type="text"] {
    flex: 1;
  }
  input[type="color"] {
    appearance: none;
    -moz-appearance: none;
    -webkit-appearance: none;
    width: 48px;
    padding: 0;
    border: 0;
    background: none;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: 1px solid var(--distant);
      border-radius: 0;
    }

    &::-moz-color-swatch,
    & ::-moz-focus-inner {
      border: 1px solid var(--distant);
    }

    &::-moz-focus-inner {
      padding: 0;
    }
  }
}
.action-button {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 9999px;
  vertical-align: top;
  &.delete {
    color: var(--red);

    &:hover {
      background-color: rgba(from var(--red) r g b / 0.25);
      color: var(--text);
    }
  }
}
select {
  width: 100%;
  padding: 0.25rem;
  border: none;
  border-bottom: 1px solid var(--distant);
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: inherit;
  appearance: base-select;
  border-radius: 0;
  &:active,
  &:focus,
  &:focus-visible {
    outline: none;
    border-color: var(--primary);
  }
}
::picker(select) {
  appearance: base-select;
  background: var(--background);
  color: var(--text);
  border: 1px solid var(--distant);
}
.preset-select option {
  background: var(--surface);
  color: var(--text);
  &:hover {
    background: rgba(from var(--primary) r g b / 0.25);
  }
  &:checked {
    background: var(--primary);
    color: var(--background);
    font-weight: bold;
  }
  &::checkmark {
    display: none;
  }
}
.spin-button {
  margin-top: 1rem;
  width: 100%;
  background-color: var(--primary);
  color: var(--background);
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-size: inherit;
  font-family: inherit;

  &:disabled {
    cursor: progress;
    opacity: 0.75;
  }
}
.selected-slice {
  margin: 0.75rem 0 0;
  color: var(--text-secondary);
  font-size: var(--small-text);
}
</style>
