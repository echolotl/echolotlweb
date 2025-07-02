<template>
  <header class="navbar">
    <nav class="navbar-top">
      <div class="navbar-top__content">
        <div class="navbar-top__themeicon" @click="toggleTheme">
          <Icon
            :icon="currentThemeIcon"
            width="48"
            height="48"
            class="icon"
          />
        </div>
        <div class="navbar-top__logo">
          <nuxt-link to="/">
            <Icon
              icon="echolotl"
              width="48"
              height="48"
              class="navbar-top__logo-icon"
              :invert="props.light"
            />
            <img
              src="~/assets/images/logo.png"
              alt="echolotl"
              height="48"
              :class="props.light ? 'invert' : ''"
            />
          </nuxt-link>
        </div>
        <div class="navbar-top__nav-icons">
          <nuxt-link
            v-for="(navIcon, index) in props.navIcons"
            :key="index"
            :to="navIcon.to"
          >
            <Icon
              :icon="navIcon.icon"
              :alt="navIcon.alt"
              width="48"
              height="48"
              :invert="props.light"
                class="icon"
            />
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

const currentThemeIcon = computed(() => (props.light ? "moon" : "sun"));

function toggleTheme() {
  emit("toggle-theme");
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/partials/_variables.scss" as vars;
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
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
}
.navbar-top__themeicon {
  position: absolute;
  left: 1rem;
}
.navbar-top__logo:hover * .navbar-top__logo-icon {
  animation: jumpAndFlip 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.navbar-top__logo {
    display: flex;
    flex-direction: row;
    min-width: auto;
}
.navbar-top__logo-icon {
  margin-right: 0.5rem;
}
.navbar-top__nav-icons {
  display: flex;
  gap: 1rem;
  align-items: center;
  position: absolute;
  right: 1rem;
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
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
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
}
</style>
