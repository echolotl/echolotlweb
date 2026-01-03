<template>
    <header class="navbar">
        <nav class="navbar-top">
            <div class="navbar-top__content">
                <!-- Desktop theme icon -->
                <div
                    class="navbar-top__themeicon navbar-top__themeicon--desktop"
                    @click="toggleTheme"
                    tabindex="0"
                >
                    <Icon
                        :icon="currentThemeIcon"
                        width="48px"
                        height="48px"
                        class="icon icon--hoverable"
                    />
                </div>

                <!-- Mobile hamburger menu -->
                <div class="navbar-top__hamburger" @click="toggleMobileMenu">
                    <Icon
                        :icon="mobileMenuOpen ? 'close' : 'hamburger-open'"
                        width="48px"
                        height="48px"
                        class="icon icon--hoverable"
                    />
                </div>

                <div class="navbar-top__logo">
                    <nuxt-link to="/">
                        <Icon
                            icon="echolotl"
                            width="48px"
                            height="48px"
                            class="navbar-top__logo-icon navbar-top__logo-icon--desktop"
                            color="var(--inverted-solid)"
                        />
                        <img
                            src="~/assets/images/logo.png"
                            alt="echolotl"
                            height="48"
                            :class="props.light ? 'invert' : ''"
                            style="transition: filter 0.3s ease"
                        />
                    </nuxt-link>
                </div>

                <!-- Desktop navigation icons -->
                <div
                    class="navbar-top__nav-icons navbar-top__nav-icons--desktop"
                >
                    <nuxt-link
                        v-for="(navIcon, index) in props.navIcons"
                        :key="index"
                        :to="navIcon.to"
                    >
                        <Icon
                            :icon="navIcon.icon"
                            :alt="navIcon.alt"
                            width="48px"
                            height="48px"
                            class="icon icon--hoverable"
                        />
                    </nuxt-link>
                </div>
            </div>

            <!-- Mobile menu dropdown -->
            <div
                class="navbar-top__mobile-menu"
                :class="{ 'navbar-top__mobile-menu--open': mobileMenuOpen }"
            >
                <div class="navbar-top__mobile-menu-content">
                    <!-- Mobile theme toggle -->
                    <div class="navbar-top__mobile-item" @click="toggleTheme">
                        <Icon
                            :icon="currentThemeIcon"
                            width="32px"
                            height="32px"
                            class="icon icon--hoverable"
                        />
                        <span>{{
                            props.light ? "Dark Mode" : "Light Mode"
                        }}</span>
                    </div>

                    <!-- Mobile navigation items -->
                    <nuxt-link
                        v-for="(navIcon, index) in props.navIcons"
                        :key="index"
                        :to="navIcon.to"
                        class="navbar-top__mobile-item"
                        @click="closeMobileMenu"
                    >
                        <Icon
                            :icon="navIcon.icon"
                            :alt="navIcon.alt"
                            width="32px"
                            height="32px"
                            class="icon icon--hoverable"
                        />
                        <span>{{ navIcon.alt }}</span>
                    </nuxt-link>
                </div>
            </div>
        </nav>
        <div class="navbar-bottom" :class="{ light: props.light }" />
    </header>
    <div class="navbar-spacer" />
</template>

<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";

interface NavIcon {
    icon: string;
    alt: string;
    to: string;
}

const props = defineProps({
    navIcons: {
        type: Array as () => NavIcon[],
        required: true,
    },
    light: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["toggle-theme"]);

const mobileMenuOpen = ref(false);
const currentThemeIcon = computed(() => (props.light ? "moon" : "sun"));

function toggleTheme() {
    emit("toggle-theme");
}

function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
    mobileMenuOpen.value = false;
}

// Close mobile menu when clicking outside or when route changes
onMounted(() => {
    const handleClickOutside = (event: Event) => {
        const navbar = document.querySelector(".navbar");
        if (navbar && !navbar.contains(event.target as Node)) {
            mobileMenuOpen.value = false;
        }
    };

    document.addEventListener("click", handleClickOutside);

    onUnmounted(() => {
        document.removeEventListener("click", handleClickOutside);
    });
});
</script>

<style scoped lang="scss">
@use "@/assets/styles/partials/_variables.scss" as vars;
@use "@/assets/styles/partials/_mixins" as *;

.navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    @media not screen {
        display: none;
    }
}

.navbar-top {
    width: 100%;
    height: fit-content;
    background-color: var(--distant);
}

.navbar-top__content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    padding: 0 1rem;
    padding-top: 0.75rem;
    height: 100%;
    width: calc(100% - 2rem);
    position: relative;

    @media (max-width: 768px) {
        justify-content: space-between;
    }
}

.navbar-top__themeicon--desktop {
    position: absolute;
    left: 1rem;
    outline: none;

    @media (max-width: 768px) {
        display: none;
    }
}

.navbar-top__hamburger {
    position: absolute;
    left: 1rem;
    display: none;

    @media (max-width: 768px) {
        display: block;
        position: static;
        order: 2;
    }
}

.navbar-top__logo:hover * .navbar-top__logo-icon,
.navbar-top__logo:focus-visible * .navbar-top__logo-icon {
    animation: jumpAndFlip 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar-top__logo {
    display: flex;
    flex-direction: row;
    min-width: auto;
    outline: none;

    @media (max-width: 768px) {
        order: 1;
    }
}

.navbar-top__logo-icon {
    margin-right: 0.5rem;
}

.navbar-top__logo-icon--desktop {
    @media (max-width: 768px) {
        display: none !important;
    }
}

.navbar-top__nav-icons--desktop {
    display: flex;
    gap: 1rem;
    align-items: center;
    position: absolute;
    right: 1rem;

    @media (max-width: 768px) {
        display: none;
    }
}

.navbar-top__mobile-menu {
    position: absolute;
    top: 50;
    left: 0;
    width: 100%;
    background-color: var(--distant);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;
    display: none;

    @media (max-width: 768px) {
        display: block;
    }

    &--open {
        max-height: 400px;
    }
}

.navbar-top__mobile-menu-content {
    padding: 1rem;
    padding-top: calc(1rem + 60px);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.navbar-top__mobile-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    text-decoration: none;
    color: var(--inverted-solid);
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--surface);
    }

    span {
        font-size: 1rem;
        font-weight: 500;
    }

    .icon {
        flex-shrink: 0;
    }
}

.navbar-bottom {
    width: 100%;
    height: 60px;
    mask-image: url("@/assets/images/sketch_divider.png");
    background-color: var(--distant);
    transform: scaleY(-1);
}

.icon {
    cursor: pointer;
    color: var(--inverted-solid);

    &--hoverable {
        @include hover-scale(1.1);
    }
}

@keyframes jumpAndFlip {
    0% {
        transform: rotateY(0) translateY(0px);
    }
    35% {
        transform: rotateY(180deg) translateY(-13px) rotateZ(-8deg);
    }
    65% {
        transform: rotateY(360deg) translateY(-8px) rotateZ(4deg);
    }
    85% {
        transform: rotateY(360deg) translateY(0px) rotateZ(2deg);
    }
    92% {
        transform: rotateY(360deg) translateY(-1px) rotateZ(1deg);
    }
    100% {
        transform: rotateY(360deg) translateY(0px) rotateZ(0deg);
    }
}

.navbar-spacer {
    height: 64px;
    @media not screen {
        display: none;
    }
}
</style>
