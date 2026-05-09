<template>
    <div style="min-height: 75vh">
        <div class="main-content">
            <h1 class="heading">
                <SketchText size="2rem" text="Hi, i'm " />
                <SketchText class="echolotl-text" size="2rem" text="echolotl" />
                <SketchText size="2rem" text="!" />
            </h1>
            <div class="status-text">
                <div>
                    subpar furry artist, hobby coder, cult of the lamb
                    enthusiast
                </div>
                <span v-if="status">◆</span>
                <template v-if="status === 'loading'">
                    <Icon icon="loading" />Getting a status...
                </template>
                <template
                    v-if="
                        status != 'loading' &&
                        status != 'error' &&
                        status !== null &&
                        'is_playing' in status &&
                        status?.is_playing &&
                        status.item?.type === 'track'
                    ">
                    <Icon icon="music-note" />
                    <div>
                        Listening to
                        <a
                            class="link"
                            :href="
                                status.item?.external_urls.spotify ?? undefined
                            "
                            target="_blank"
                            rel="noopener noreferrer"
                            ><b>{{ status.item?.name }}</b></a
                        >
                        by
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
                        <template v-if="status.item?.artists.length > 1">
                            (+{{ status.item?.artists.length - 1 }})</template
                        >
                    </div>
                </template>
                <template
                    v-if="
                        status != 'loading' &&
                        status != 'error' &&
                        status !== null &&
                        isEcholotlStatus(status)
                    ">
                    <span
                        v-if="status.emoji"
                        style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 24px;
                            height: 24px;
                            font-size: 16px;
                        "
                        >{{ (status as EcholotlStatus).emoji }}</span
                    >
                    <Icon v-else icon="info" />
                    <div>{{ (status as EcholotlStatus).text }}</div>
                    <div>
                        ({{
                            getCreatedAtRelativeTime(
                                (status as EcholotlStatus).createdAt,
                            )
                        }})
                    </div>
                </template>
            </div>
            <p>I like to play and draw</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import SketchText from "~/components/common/SketchText.vue";
import Icon from "~/components/common/Icon.vue";
import type { CurrentlyPlayingResponse } from "~~/types/spotify";

const BACKEND_URL = "https://backend.echolotl.lol";

const dateFormat = new Intl.RelativeTimeFormat("en", { style: "short" });

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

const SPOTIFY_POLL_INTERVAL_MS = 15_000;

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

    // Add a small buffer so we refetch after Spotify has updated playback state.
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
            console.warn("No Echolotl status available.");
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
        return;
    }

    clearSpotifyRefetchTimeout();
    // Keep current custom status while Spotify is still not playing.
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
    await refreshStatus();
    startSpotifyPolling();
});

onBeforeUnmount(() => {
    clearSpotifyRefetchTimeout();
    clearSpotifyPollInterval();
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
