<template>
    <div>
        <WeatherBanner :weather-data="weatherData" />
        <div class="weather-page"></div>
    </div>
</template>

<style scoped lang="scss">
.weather-page {
    min-height: 100vh;
    margin: 0 auto;
    padding: 2rem;
    margin-top: 2rem;
    max-width: 1200px;
    text-align: center;
    @media (max-width: 600px) {
        padding: 1rem;
    }
}
</style>

<script setup lang="ts">
import { useWeather } from "~/composables/useWeather";

const route = useRoute();
const slug = route.params.slug;
const { getWeatherAtCoordinates } = useWeather();

if (typeof slug === "string" && !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(slug)) {
    throw createError({
        statusCode: 404,
        statusMessage: "Invalid coordinates format",
    });
}

const [lat, lon] = (slug as string).split(",").map(Number);
const weatherData = await getWeatherAtCoordinates(lat || 0, lon || 0);
</script>
