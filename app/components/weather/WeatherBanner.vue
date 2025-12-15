<template>
    <div ref="bannerContainer" class="weather-banner"></div>
</template>

<style scoped lang="scss">
.weather-banner {
    width: 100%;
    height: 600px;
    overflow: hidden;
    mask-image: linear-gradient(black 70%, transparent);
}
</style>

<script setup lang="ts">
import {
    Application,
    Assets,
    Container,
    Sprite,
    Texture,
    AnimatedSprite,
} from "pixi.js";
import { ref, onMounted, onBeforeUnmount } from "vue";
import dome from "../../assets/images/weather/dome_placeholder.webp";
import prop from "../../assets/images/weather/props/prop1.webp";

const bannerContainer = ref<HTMLElement | null>(null);
let app: Application | null = null;
let globe: Sprite;
let walker: AnimatedSprite;

const SPAWN_ANGLE_WORLD = -2.7;
const DESTROY_ANGLE_WORLD = -0.5;
const ROTATION_SPEED = -0.001;

const MIN_SPACING = 0.3;
const MAX_SPACING = 0.8;

const propTypes = [
    "/images/weather/props/dome.webp",
    "/images/weather/props/house.webp",
    "/images/weather/props/tower.webp",
    "/images/weather/props/structure.webp",
];

const walkerTypes = ["stickman"];

let propTextures: Texture[] = [];
let lastSpawnedLocalAngle = 0;
let nextSpacing = 0;

onMounted(async () => {
    if (!bannerContainer.value) return;

    try {
        app = new Application();
        await app.init({
            backgroundAlpha: 0,
            resizeTo: bannerContainer.value,
            antialias: false,
        });
        bannerContainer.value.append(app.canvas);

        const container = new Container();
        app.stage.addChild(container);

        const domeTexture = await Assets.load(dome);

        const allPropPaths = [...new Set([...propTypes, prop])];
        const loadedTextures = await Promise.all(
            allPropPaths.map((path) => Assets.load(path).catch((e) => null)),
        );

        const textureMap = new Map<string, Texture>();
        allPropPaths.forEach((path, index) => {
            if (loadedTextures[index]) {
                textureMap.set(path, loadedTextures[index]!);
            }
        });

        propTextures = propTypes
            .map((path) => textureMap.get(path))
            .filter((t): t is Texture => !!t);

        if (propTextures.length === 0 && textureMap.get(prop)) {
            propTextures.push(textureMap.get(prop)!);
        }

        globe = new Sprite(domeTexture);

        globe.width = 1500;
        globe.height = globe.width;
        globe.x = app.renderer.width / 2;
        globe.y = app.renderer.height + globe.height / 3;
        globe.anchor.set(0.5, 0.5);
        container.addChild(globe);

        // Initial population
        // Fill from SPAWN_ANGLE_WORLD down to DESTROY_ANGLE_WORLD
        let currentAngle = SPAWN_ANGLE_WORLD;
        while (currentAngle > DESTROY_ANGLE_WORLD) {
            spawnProp(currentAngle);
            lastSpawnedLocalAngle = currentAngle;
            currentAngle -= getRandomSpacing();
        }
        nextSpacing = getRandomSpacing();

        // Walker
        const frames: Texture[] = [];
        for (let i = 0; i <= 1; i++) {
            const texture = await Assets.load(
                `/images/weather/walkers/stickman_${("000" + i).slice(-4)}.webp`,
            );
            frames.push(texture);
        }
        walker = new AnimatedSprite(frames);
        walker.animationSpeed = 2 / app.ticker.FPS;
        walker.play();
        walker.anchor.set(0.5, 1);
        walker.height = 125;
        // scale proportionally
        walker.width =
            walker.height * (walker.texture.width / walker.texture.height);
        walker.x = globe.x;
        walker.y = globe.y - globe.width / 2;
        container.addChild(walker);

        app.ticker.add((time) => {
            if (!globe) return;

            globe.rotation -= ROTATION_SPEED * time.deltaTime;

            // Spawning
            const nextPropLocalAngle = lastSpawnedLocalAngle - nextSpacing;
            const nextPropWorldAngle = nextPropLocalAngle + globe.rotation;

            if (nextPropWorldAngle >= SPAWN_ANGLE_WORLD) {
                spawnProp(nextPropLocalAngle);
                lastSpawnedLocalAngle = nextPropLocalAngle;
                nextSpacing = getRandomSpacing();
            }

            // Cleanup
            for (let i = globe.children.length - 1; i >= 0; i--) {
                const child = globe.children[i] as Sprite & {
                    spawnAngle?: number;
                };
                if (typeof child.spawnAngle === "number") {
                    const worldAngle = child.spawnAngle + globe.rotation;
                    if (worldAngle > DESTROY_ANGLE_WORLD) {
                        child.destroy();
                    }
                }
            }
        });

        window.addEventListener("resize", onResize);
    } catch (error) {
        console.error("Error initializing weather banner:", error);
    }
});

const onResize = () => {
    if (app && globe) {
        globe.x = app.renderer.width / 2;
        if (walker) {
            walker.x = globe.x;
        }
    }
};

const getRandomSpacing = () => {
    return MIN_SPACING + Math.random() * (MAX_SPACING - MIN_SPACING);
};

const spawnProp = (angle: number) => {
    if (!globe || propTextures.length === 0) return;

    const texture =
        propTextures[Math.floor(Math.random() * propTextures.length)];
    const propSprite = new Sprite(texture) as Sprite & { spawnAngle?: number };
    propSprite.anchor.set(0.5, 1);
    propSprite.height = 75;
    propSprite.width =
        propSprite.height *
        (propSprite.texture.width / propSprite.texture.height);

    const distance = globe.texture.width / 2 - 3;

    propSprite.x = Math.cos(angle) * distance;
    propSprite.y = Math.sin(angle) * distance;
    propSprite.rotation = angle + Math.PI / 2;
    propSprite.spawnAngle = angle;

    globe.addChild(propSprite);
};

onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    if (app) {
        app.destroy(true);
        app = null;
    }
});
</script>
