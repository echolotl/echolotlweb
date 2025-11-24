<template>
    <div>
        <NuxtLayout>
            <NuxtRouteAnnouncer />
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<style lang="scss">
@use "sass:color";
@use "~/assets/styles/partials/_variables.scss" as *;
@use "~/assets/styles/partials/_reusables.scss" as *;
@use "~/assets/styles/partials/_mixins.scss" as *;
@use "~/assets/styles/main.scss" as *;

:root {
    --foreground: #{$foreground};
    --text: #{$foreground-light};
    --text-secondary: #{color.scale($foreground-light, $alpha: -60%)};
    --background: #{$background};
    --distant: #{$distant};
    --primary: #{$primary};
    --solid: #{$solid};
    --inverted-solid: #{$solid-light};
    --filter-invert: 0;

    --red: #{$red};
    --green: #{$green};
    --blue: #{$blue};
    --yellow: #{$yellow};
    --purple: #{$purple};
    --orange: #{$orange};

    --surface: #{$surface};

    background-color: var(--background);
    color: var(--text);
    --scrollbar-bar: var(--primary);
    scrollbar-color: var(--scrollbar-bar) var(--distant);
    transition:
        background-color 0.2s ease-out,
        color 0.2s ease-out,
        border-color 0.2s ease-out,
        scrollbar-color 0.3s ease;
    @media print {
        --distant: black;
    }
}

:root[data-theme="light"] {
    --foreground: #{$foreground-light};
    --text: #{$foreground};
    --text-secondary: #{color.scale($foreground, $alpha: -25%)};
    --background: #{$background-light};
    --distant: #{$distant-light};
    --primary: #{$primary-light};
    --surface: #{$surface-light};
    --solid: #{$solid-light};
    --inverted-solid: #{$solid};
    --filter-invert: 1;

    --red: #{$red-light};
    --green: #{$green-light};
    --blue: #{$blue-light};
    --yellow: #{$yellow-light};
    --purple: #{$purple-light};
    --orange: #{$orange-light};

    color: var(--text);
}

.link {
    color: var(--primary);
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
        color: color-mix(in srgb, var(--primary), blue 20%);
        text-decoration: underline;
    }
}

.page-enter-active,
.page-leave-active {
    transition: all 0.4s;
}

.page-enter-from {
    opacity: 0;

    transform: translateY(-1rem);
}
.page-leave-to {
    opacity: 0;
    transform: translateY(1rem);
}
</style>
