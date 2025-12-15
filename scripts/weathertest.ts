import { useWeather } from "../app/composables/useWeather";

const { getWeatherFromCoordinates } = useWeather();

const weatherData = await getWeatherFromCoordinates(
  32.66927765989551,
  -97.65628547021377,
);

console.log(weatherData);
