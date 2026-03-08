<template>
    <div style="min-height: 75vh">
        <div class="main-content">
            <h1 class="heading">
                <SketchText size="2rem" text="Hi, i'm " />
                <SketchText class="echolotl-text" size="2rem" text="echolotl" />
                <SketchText size="2rem" text="!" />
            </h1>
            <div class="status-text" v-if="spotifyStatus === 'loading'"><Icon icon="loading" />Checking something...</div>
            <div class="status-text" v-if="spotifyStatus != 'loading' && spotifyStatus != 'error' && spotifyStatus.state === 'playing'">
                <Icon icon="spotify" /><div>Listening to <a class="link" :href="spotifyStatus.trackUrl ?? undefined" target="_blank" rel="noopener noreferrer"><b>{{ spotifyStatus.track }}</b> by <b>{{ spotifyStatus.artist }}</b></a></div>
            </div>
            <p>
                Holy WIP bro
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import SketchText from '~/components/common/SketchText.vue';
import Icon from '~/components/common/Icon.vue';

interface SpotifyPlayback {
	state: "playing" | "not_playing";
	isPlaying: boolean;
	track: string | null;
	artist: string | null;
	artists: string[];
	trackId: string | null;
	album: string | null;
	albumImageUrl: string | null;
	trackUrl: string | null;
	previewUrl: string | null;
	progressMs: number | null;
	durationMs: number | null;
	timestamp: number | null;
	currentlyPlayingType: "track" | "episode" | "ad" | "unknown";
	repeatState: "off" | "track" | "context" | "unknown";
	shuffleState: boolean | null;
	explicit: boolean | null;
	popularity: number | null;
	isLocal: boolean | null;
	device: {
		name: string | null;
		type: string | null;
		volumePercent: number | null;
		isActive: boolean | null;
	};
	context: {
		type: string | null;
		uri: string | null;
		href: string | null;
		externalUrl: string | null;
	};
}

const spotifyStatus = ref<SpotifyPlayback | 'loading' | 'error'>('loading')
let spotifyRefetchTimeout: ReturnType<typeof setTimeout> | null = null

const clearSpotifyRefetchTimeout = () => {
    if (spotifyRefetchTimeout) {
        clearTimeout(spotifyRefetchTimeout)
        spotifyRefetchTimeout = null
    }
}

const scheduleSpotifyRefetchOnSongEnd = (playback: SpotifyPlayback) => {
    clearSpotifyRefetchTimeout()

    if (!playback.isPlaying || playback.durationMs == null || playback.progressMs == null) {
        return
    }

    // Add a small buffer so we refetch after Spotify has updated playback state.
    const remainingMs = Math.max(playback.durationMs - playback.progressMs, 0)
    const refetchDelayMs = remainingMs + 1000

    spotifyRefetchTimeout = setTimeout(() => {
        void fetchSpotifyStatus()
    }, refetchDelayMs)
}

const fetchSpotifyStatus = async () => {
    try {
        const data = await fetch('https://status.echolotl.lol/spotify')
        const json = await data.json()
        const playback = json.playback as SpotifyPlayback
        spotifyStatus.value = playback
        scheduleSpotifyRefetchOnSongEnd(playback)
    } catch (err) {
        console.error('Error fetching Spotify status:', err)
        spotifyStatus.value = 'error'
        clearSpotifyRefetchTimeout()
    }
}

onMounted(async () => {
    await fetchSpotifyStatus()
})

onBeforeUnmount(() => {
    clearSpotifyRefetchTimeout()
})
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
    margin-top: 0.5rem;
    gap: 0.25rem;
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
