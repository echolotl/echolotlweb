<template>
    <div class="main-page">
        <SketchFilter
            id="sketch-filter-main"
            flood-color="var(--distant)"
            :seed="seed" />
        <div class="main-content">
            <h1 class="heading">
                <span class="lotl-font" style="font-size: 2.1rem"
                    >Hi, i'm
                    <span class="lotl-font echolotl-text">echolotl</span>!</span
                >
            </h1>
            <div class="subtitle">
                so called "furry artist", hobby coder, cult of the lamb
                enthusiast
            </div>
        </div>
        <aside class="sidebar">
            <template v-if="status">
                <div class="status-think-bubble">
                    <div
                        v-if="status === 'loading'"
                        style="
                            display: flex;
                            align-items: center;
                            gap: 0.25rem;
                        ">
                        <Icon icon="loading" width="32px" height="32px" />
                        Thinking of a status...
                    </div>
                    <div
                        v-else-if="status === 'error'"
                        style="color: var(--red)">
                        Error loading status.
                    </div>
                    <template v-else-if="isEcholotlStatus(status)">
                        <span class="emoji">{{ status.emoji }}</span>
                        <span>{{ status.text }}</span>
                        <span class="extra-info">
                            {{
                                getCreatedAtRelativeTime(status.createdAt)
                            }}</span
                        >
                    </template>
                    <template v-else>
                        <span class="emoji"
                            ><Icon
                                icon="music-note"
                                width="54px"
                                height="54px"
                                style="color: var(--primary)"
                        /></span>
                        <span>
                            Listening to
                            <a
                                class="link"
                                :href="
                                    status.item?.external_urls.spotify ??
                                    undefined
                                "
                                target="_blank"
                                rel="noopener noreferrer"
                                ><b>{{ status.item?.name }}</b></a
                            >
                            -
                            <a
                                class="link"
                                :href="
                                    status.item?.artists[0]?.external_urls
                                        .spotify ?? undefined
                                "
                                target="_blank"
                                rel="noopener noreferrer"
                                ><b>{{ status.item?.artists[0]?.name }}</b></a
                            >
                            <span
                                v-if="status.item?.artists.length > 1"
                                style="color: var(--text-secondary)">
                                (+{{
                                    status.item?.artists.length - 1
                                }}
                                other)</span
                            >
                            on Spotify
                        </span>
                        <span class="extra-info"
                            >{{ msToMinutesAndSeconds(curDurationMsSpotify) }}
                            /
                            {{
                                msToMinutesAndSeconds(
                                    status.item?.duration_ms ?? 0,
                                )
                            }}</span
                        >
                    </template>
                </div>
                <div
                    class="the-thinker"
                    title="the thinkerrrr"
                    :style="{ maskImage: `url(${thinkerImage})` }" />
            </template>
        </aside>
    </div>
</template>

<script setup lang="ts">
import SketchFilter from "~/components/common/SketchFilter.vue";
import Icon from "~/components/common/Icon.vue";
import type { CurrentlyPlayingResponse } from "~~/types/spotify";

const BACKEND_URL = "https://backend.echolotl.lol";

const dateFormat = new Intl.RelativeTimeFormat("en", { style: "short" });
const seed = ref(0);
const curDurationMsSpotify = ref(0);

function generateSeed() {
    seed.value = Math.floor(Math.random() * 1000000);
}

const thinkerImages = [
    "/images/home/plushking.webp",
    "/images/home/doeh.webp",
    "/images/home/gamercube.webp",
    "/images/home/bf.webp",
    "/images/home/beetle.webp",
];

const getRandomThinkerImage = () => {
    const index = Math.floor(Math.random() * thinkerImages.length);
    return thinkerImages[index];
};

const thinkerImage = ref(null);

type EcholotlStatus = {
    text: string;
    emoji: string;
    createdAt: string;
};

const status = ref<
    CurrentlyPlayingResponse | EcholotlStatus | "loading" | "error" | null
>("loading");
let spotifyRefetchTimeout: ReturnType<typeof setTimeout> | null = null;
let spotifyPollInterval: ReturnType<typeof setInterval> | null = null;
let seedInterval: ReturnType<typeof setInterval> | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;

const SPOTIFY_POLL_INTERVAL_MS = 15_000;
const PROGRESS_TICK_MS = 1_000;

const clearSpotifyRefetchTimeout = () => {
    if (spotifyRefetchTimeout) {
        clearTimeout(spotifyRefetchTimeout);
        spotifyRefetchTimeout = null;
    }
};

const clearSpotifyPollInterval = () => {
    if (spotifyPollInterval) {
        clearInterval(spotifyPollInterval);
        spotifyPollInterval = null;
    }
};

const clearSeedInterval = () => {
    if (seedInterval) {
        clearInterval(seedInterval);
        seedInterval = null;
    }
};

const clearProgressInterval = () => {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
};

const msToMinutesAndSeconds = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const isEcholotlStatus = (
    value:
        | CurrentlyPlayingResponse
        | EcholotlStatus
        | "loading"
        | "error"
        | null,
): value is EcholotlStatus => {
    return (
        value !== null &&
        value !== "loading" &&
        value !== "error" &&
        "text" in value
    );
};

const isSpotifyStatus = (
    value:
        | CurrentlyPlayingResponse
        | EcholotlStatus
        | "loading"
        | "error"
        | null,
): value is CurrentlyPlayingResponse => {
    return (
        value !== null &&
        value !== "loading" &&
        value !== "error" &&
        "is_playing" in value
    );
};

const getCreatedAtRelativeTime = (createdAt: string) => {
    const createdAtDate = new Date(createdAt);
    const now = new Date();
    const diffMs = createdAtDate.getTime() - now.getTime();

    if (diffMs > -60000) {
        return dateFormat.format(Math.round(diffMs / 1000), "second");
    } else if (diffMs > 60 * -60000) {
        return dateFormat.format(Math.round(diffMs / 60000), "minute");
    } else if (diffMs > 24 * 60 * -60000) {
        return dateFormat.format(Math.round(diffMs / (60 * 60000)), "hour");
    } else {
        return dateFormat.format(Math.round(diffMs / (24 * 60 * 60000)), "day");
    }
};

const startProgressTick = () => {
    clearProgressInterval();
    progressInterval = setInterval(() => {
        if (!isSpotifyStatus(status.value) || !status.value.is_playing) {
            clearProgressInterval();
            return;
        }
        const duration = status.value.item?.duration_ms ?? 0;
        curDurationMsSpotify.value = Math.min(
            curDurationMsSpotify.value + PROGRESS_TICK_MS,
            duration,
        );
        console.log(
            "Progress tick:",
            curDurationMsSpotify.value,
            "/",
            duration,
        );
    }, PROGRESS_TICK_MS);
};

const scheduleSpotifyRefetchOnSongEnd = (
    playback: CurrentlyPlayingResponse,
) => {
    clearSpotifyRefetchTimeout();

    if (
        !playback.item ||
        playback.item.duration_ms == null ||
        playback.progress_ms == null
    ) {
        return;
    }

    const remainingMs = Math.max(
        playback.item.duration_ms - playback.progress_ms,
        0,
    );
    const refetchDelayMs = remainingMs + 1000;

    spotifyRefetchTimeout = setTimeout(() => {
        void refreshStatus();
    }, refetchDelayMs);
};

const fetchSpotifyStatus: () => Promise<CurrentlyPlayingResponse | null> =
    async () => {
        try {
            const data = await fetch(`${BACKEND_URL}/spotify`);
            if (data.status === 204) {
                clearSpotifyRefetchTimeout();
                return null;
            } else if (!data.ok) {
                throw new Error(`HTTP error! status: ${data.status}`);
            }
            const json = (await data.json()) as CurrentlyPlayingResponse;
            curDurationMsSpotify.value = json.progress_ms ?? 0;
            return json;
        } catch (err) {
            console.error("Error fetching Spotify status:", err);
            clearSpotifyRefetchTimeout();
            return null;
        }
    };

const fetchEcholotlStatus: () => Promise<EcholotlStatus | null> = async () => {
    try {
        const data = await fetch(`${BACKEND_URL}/status`);
        if (data.status === 204) {
            return null;
        } else if (!data.ok) {
            throw new Error(`HTTP error! status: ${data.status}`);
        }
        const json = (await data.json()) as EcholotlStatus;
        return json;
    } catch (err) {
        console.error("Error fetching Echolotl status:", err);
        return null;
    }
};

const refreshStatus = async () => {
    const hasCustomStatusDisplayed = isEcholotlStatus(status.value);
    const spotifyResponse = await fetchSpotifyStatus();

    if (
        spotifyResponse &&
        spotifyResponse.is_playing &&
        spotifyResponse.item?.type === "track"
    ) {
        status.value = spotifyResponse;
        scheduleSpotifyRefetchOnSongEnd(spotifyResponse);
        startProgressTick();
        return;
    }

    clearSpotifyRefetchTimeout();
    clearProgressInterval();

    if (hasCustomStatusDisplayed) {
        return;
    }

    status.value = await fetchEcholotlStatus();
};

const startSpotifyPolling = () => {
    clearSpotifyPollInterval();
    spotifyPollInterval = setInterval(() => {
        void refreshStatus();
    }, SPOTIFY_POLL_INTERVAL_MS);
};

onMounted(async () => {
    generateSeed();
    await refreshStatus();
    startSpotifyPolling();
    seedInterval = setInterval(() => {
        generateSeed();
    }, 1500);
    thinkerImage.value = getRandomThinkerImage();
});

onBeforeUnmount(() => {
    clearSpotifyRefetchTimeout();
    clearSpotifyPollInterval();
    clearSeedInterval();
    clearProgressInterval();
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

.main-page {
    display: flex;
    flex-direction: row;
    padding: 2rem;
    padding-top: calc(2rem + 60px);
    max-width: 1200px;
    min-height: 75vh;
    margin: 0 auto;
    z-index: 1;
    @media (max-width: 768px) {
        flex-direction: column;
    }
}

.echolotl-text {
    color: var(--primary);
}

.status-think-bubble {
    position: relative;
    width: 100%;
    background-color: var(--surface);
    color: var(--text);
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--distant);
    box-shadow: inset 0 2px 12px var(--distant);
    filter: url(#sketch-filter-main);

    &::after {
        content: "";
        position: absolute;
        bottom: -52px;
        right: 64px;
        mask-image: url("/images/home/think.webp");
        background-color: var(--surface);
        width: 49px;
        height: 49px;
        mask-repeat: no-repeat;
    }

    :not(.extra-info) {
        font-family: Lotl;
    }

    .emoji {
        position: absolute;
        top: -2rem;
        left: -2rem;
        font-size: 2.5rem;
    }
    .extra-info {
        position: absolute;
        top: -16px;
        left: 32px;
        background-color: var(--surface);
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        display: block;
        font-size: var(--small-text);
        color: var(--text-secondary);
    }
}

.the-thinker {
    position: relative;
    width: 100%;
    height: 150px;
    background-color: var(--text);
    mask-repeat: no-repeat;
    mask-size: contain;
    margin-top: 1rem;
    margin-left: 16px;
}

.thinker-shelf {
    position: relative;
    width: 100%;
    height: 16px;
    top: -14px;
    margin-bottom: -14px;
    background: linear-gradient(to bottom, var(--surface), transparent 50%);
    border-bottom: 4px solid var(--distant);
    z-index: -1;
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
    flex: 1;
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

.sidebar {
    width: 250px;
    padding: 0 1rem;
    border-left: 1px dashed var(--distant);

    @media (max-width: 768px) {
        border: none;
    }
}
</style>
