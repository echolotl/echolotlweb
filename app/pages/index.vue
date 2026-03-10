<template>
  <div style="min-height: 75vh">
    <div class="main-content">
      <h1 class="heading">
        <SketchText size="2rem" text="Hi, i'm " />
        <SketchText class="echolotl-text" size="2rem" text="echolotl" />
        <SketchText size="2rem" text="!" />
      </h1>
      <div class="status-text">
        <div>subpar furry artist, hobby coder, cult of the lamb enthusiast</div>
        ◆
        <template v-if="spotifyStatus === 'loading'">
          <Icon icon="loading" />Getting a status...
        </template>
        <template
          v-if="
            spotifyStatus != 'loading' &&
            spotifyStatus != 'error' &&
            spotifyStatus?.is_playing && spotifyStatus.item?.type === 'track'
          "
        >
          <Icon icon="music-note" />
          <div>
            Listening to
            <a
              class="link"
              :href="spotifyStatus.item?.external_urls.spotify ?? undefined"
              target="_blank"
              rel="noopener noreferrer"
              ><b>{{ spotifyStatus.item?.name }}</b></a> by
              <a class="link" :href="spotifyStatus.item?.artists[0]?.external_urls.spotify ?? undefined" target="_blank" rel="noopener noreferrer"
                ><b>{{ spotifyStatus.item?.artists[0]?.name }}</b></a>
                <template v-if="spotifyStatus.item?.artists.length > 1"> (+{{ spotifyStatus.item?.artists.length - 1 }})</template>
          </div>
        </template>
      </div>
      <p>Holy WIP bro</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import SketchText from "~/components/common/SketchText.vue";
import Icon from "~/components/common/Icon.vue";
import type { CurrentlyPlayingResponse } from "~~/types/spotify";

const spotifyStatus = ref<CurrentlyPlayingResponse | "loading" | "error" | null>("loading");
let spotifyRefetchTimeout: ReturnType<typeof setTimeout> | null = null;

const clearSpotifyRefetchTimeout = () => {
  if (spotifyRefetchTimeout) {
    clearTimeout(spotifyRefetchTimeout);
    spotifyRefetchTimeout = null;
  }
};

const scheduleSpotifyRefetchOnSongEnd = (playback: CurrentlyPlayingResponse) => {
  clearSpotifyRefetchTimeout();

  if (
    !playback.item ||
    playback.item.duration_ms == null ||
    playback.progress_ms == null
  ) {
    return;
  }

  // Add a small buffer so we refetch after Spotify has updated playback state.
  const remainingMs = Math.max(playback.item.duration_ms - playback.progress_ms, 0);
  const refetchDelayMs = remainingMs + 1000;

  spotifyRefetchTimeout = setTimeout(() => {
    void fetchSpotifyStatus();
  }, refetchDelayMs);
};

const fetchSpotifyStatus = async () => {
  try {
    const data = await fetch("https://backend.echolotl.lol/spotify");
    if (data.status === 204) {
      spotifyStatus.value = null;
      clearSpotifyRefetchTimeout();
      return;
    } else if (!data.ok) {
      spotifyStatus.value = "error";
      throw new Error(`HTTP error! status: ${data.status}`);
    }
    const json = await data.json() as CurrentlyPlayingResponse;
    spotifyStatus.value = json;
    scheduleSpotifyRefetchOnSongEnd(json);
  } catch (err) {
    console.error("Error fetching Spotify status:", err);
    spotifyStatus.value = "error";
    clearSpotifyRefetchTimeout();
  }
};

onMounted(async () => {
  await fetchSpotifyStatus();
});

onBeforeUnmount(() => {
  clearSpotifyRefetchTimeout();
});
</script>

<style scoped lang="scss">
.heading {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  white-space: nowrap;
  margin: 0;
}

.echolotl-text {
  color: var(--primary);
}

.status-text {
  display: flex;
  align-items: center;
  font-size: var(--small-text);
  color: var(--text-secondary);
  margin-top: 0.25rem;
  gap: 0.25rem;
  > div {
    gap: 0.1rem;
  }
}

.top-overlay {
  width: 100%;
  object-fit: cover;
  height: auto;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}
.main-content {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  padding-top: calc(2rem + 60px);
  max-width: 1200px;
  margin: 0 auto;
  z-index: 1;
}
.hi-image {
  mask-image: url("/images/home/hi.webp");
  background-color: var(--text);
  width: 100%;
  height: 200px;
  display: block;
  mask-repeat: no-repeat;
}
.king-image {
  align-self: flex-end;
  max-height: 256px;
  width: auto;
  @media (max-width: 768px) {
    width: 50%;
  }
}
</style>
