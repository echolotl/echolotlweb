<template>
  <div class="fridaylight-page">
    <div class="main-banner">
      <div class="main-banner__content">
        <div class="banner-background"></div>
        <div class="screenshots-container">
        <div class="screenshots">
          <img
            src="@/assets/images/fridaylight/fridaylightscreenshot1.webp"
            alt="Screenshot 1"
            class="screenshot"
            style="width: 100%;"
          />
          <img
            src="@/assets/images/fridaylight/fridaylightscreenshot2.webp"
            alt="Screenshot 2"
            class="screenshot"
          />
          <img
            src="@/assets/images/fridaylight/fridaylightscreenshot3.webp"
            alt="Screenshot 3"
            class="screenshot"
          />
        </div></div>
        <div class="main-banner__sections">
          <div class="main-banner__section left">
            <img
              src="@/assets/images/fridaylight/fridaylight.webp"
              alt="Fridaylight Logo"
              class="fridaylight-logo"
            />
            <sketch-text word-wrap size="2rem">
              Download, launch, and organize FNF mods, all in one place!
            </sketch-text>
            <div
              style="
                display: flex;
                gap: 0.5rem;
                flex-direction: row;
                align-items: center;
              "
            >
            <a href="/fridaylight/Fridaylight_0.11.6_x64-setup.exe" download>
              <button
                class="filled"
                style="width: fit-content; background-color: #2d9fcc"
              >
                <Icon icon="download"></Icon>Download Now</button
              ></a><span style="color: var(--text-secondary)">
                for Windows 10/11</span
              >
            </div>
            <div style="display: flex; gap: 0.25rem">
            <nuxt-link
              to="https://github.com/echolotl/fridaylight"
              target="_blank"
              ><Icon
                icon="socials/github"
                style="color: var(--text-secondary)"
                width="2rem"
                height="2rem"
            /></nuxt-link>
                        <nuxt-link
              to="https://gamebanana.com/wips/92338"
              target="_blank"
              ><Icon
                icon="socials/gamebanana"
                style="color: var(--text-secondary)"
                width="2rem"
                height="2rem"
            /></nuxt-link>
        <nuxt-link
              to="about:blank"
              target="_blank"
              ><Icon
                icon="socials/drive"
                style="color: var(--text-secondary)"
                width="2rem"
                height="2rem"
            /></nuxt-link></div>
          </div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <!-- Feature Overview  -->
       <div class="section">
        <div class="section-content">
          <div class="section-card">
            <h3 class="title"><Icon icon="folder" width="1.75rem" height="1.75rem" /> Organize</h3>
            <img
              src="@/assets/images/fridaylight/sections/placeholder_card_image.webp"
              alt="Organize"
              class="section-image"
            />
            <div class="description">
              <b>Import your existing collection of mods, or add new ones quickly!</b><br></br> Fridaylight organizes your mods into a single, easy-to-navigate library, along with powerful search, filtering, and folder management features.
            </div>
          </div>
          <div class="section-card">
            <h3 class="title"><Icon icon="download" width="1.75rem" height="1.75rem" /> Download</h3>
            <img
              src="@/assets/images/fridaylight/sections/placeholder_card_image.webp"
              alt="Download"
              class="section-image"
            />
            <div class="description">
              Download mods directly from Gamebanana without leaving the app! With one click in-app or on the Gamebanana website, you can download and install mods directly into your Fridaylight library.
            </div>
          </div>
          <div class="section-card">
            <h3 class="title"><Icon icon="open_in_new" width="1.75rem" height="1.75rem" />Launch</h3>
            <img
              src="@/assets/images/fridaylight/sections/placeholder_card_image.webp"
              alt="Organize"
              class="section-image"
            />
            <div class="description">
              Launch your mods quickly and easily! Along with launching your mods, Fridaylight also provides a built-in mod manager for engine mods, a live terminal, and log saving features.
            </div>
          </div>
        </div>
       </div>

      <!-- Organization/Customization -->

      <!-- Downloading -->

      <!-- Launching -->




    </div>
  </div>
</template>

<style scoped lang="scss">
.main-banner {
  top: 64px;
  height: 600px;
  overflow: hidden;
  z-index: -1;
  .banner-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(in oklab to right, #d15ac5, #fac84b 75%);
    mask-image: linear-gradient(to top, transparent, black);
    z-index: -1;
  }
  .banner-background::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: v-bind(fridaylightBGOverlayCorrected);
    background-size: cover;
    background-origin: content-box;
    opacity: 0.5;
    mix-blend-mode: luminosity;
  }
  .screenshots-container {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
    mask-image: linear-gradient(to top, transparent, black 33%);
  }
  .screenshots {
    position: absolute;
    top: -5%;
    right: 0;
    width: 50%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
    @media (max-width: 768px) {
      display: none;
    }
    .screenshot {
      position: absolute;
      max-width: 550px;
      bottom: 0;
      opacity: 0;
      will-change: transform, opacity;
      transform-origin: bottom right;
      filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
      &:nth-child(1) {
        z-index: 4;
        animation: screenshotFadeIn1 0.5s ease forwards;
        animation-delay: 800ms;
      }
    &:nth-child(2) {
        z-index: 3;
        left: 25%;
        bottom: -10%;
        animation: screenshotFadeIn2 0.5s ease forwards;
        animation-delay: 600ms;
      }
        &:nth-child(3) {
        z-index: 2;
        left: 50%;
        bottom: -20%;
        animation: screenshotFadeIn3 0.5s ease forwards;
        animation-delay: 400ms;
      }
    }
  }
  .main-banner__content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    .main-banner__sections {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      z-index: 1;
      padding: 0 2.5rem;
      .main-banner__section {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 1.5rem;
        max-width: 40%;
        @media (max-width: 768px) {
          max-width: 100%;
          align-items: center;
          text-align: center;
        }
        .hint {
          font-size: 0.875rem;
          text-transform: uppercase;
          border: 2px solid var(--primary);
          color: var(--primary);
          width: fit-content;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          background: color-mix(in srgb, var(--solid) 20%, transparent 80%);
        }
          .fridaylight-logo {
            max-width: 60%;
            min-width: 300px;
            height: auto;
            filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
          }
      }
    }
  }
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  .section {
    margin-bottom: 2rem;
    .section-heading {
      font-size: 2rem;
      margin-bottom: 1rem;
      text-align: center;
      text-transform: uppercase;
    }
    .section-content {
      display: flex;
      flex-direction: row;
  flex-wrap: wrap;
      align-items: flex-start;
      padding: 0 1rem;
      border-radius: 12px;
      gap: 1rem;
      &.vertical {
        flex-direction: column;
      }
      .section-section {
        flex: 1;
        font-size: 1rem;
        line-height: 1.5;
        &:nth-child(1) {
          max-width: 40%;
        }
      }
      .section-card {
        background-color: var(--surface);
        border: 1px solid var(--distant);
        border-bottom-width: 2px;
        padding: 1rem;
        border-radius: 4px;
  /* Allow cards to wrap and keep a sensible width */
  flex: 1 1 320px;
        .title {
          font-size: 1.5rem;
          margin: 0;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .section-image {
          width: 100%;
          height: auto;
        }
        .description {
          font-size: 1rem;
          margin-top: 0.5rem;
        }
      }
    }
  }
}

@keyframes screenshotFadeIn1 {
  0% {
    opacity: 0;
    transform: rotateZ(4deg) scale(1.2) translateY(100px);
  }
  100% {
    opacity: 1;
    transform: rotateZ(1deg) scale(1.2) translateY(40px);
  }
}

@keyframes screenshotFadeIn2 {
  0% {
    opacity: 0;
    transform: rotateZ(7deg) scale(1.1) translateY(60px);
  }
  100% {
    opacity: 1;
    transform: rotateZ(5deg) scale(1.1) translateY(0);
  }
}

@keyframes screenshotFadeIn3 {
  0% {
    opacity: 0;
    transform: rotateZ(10deg) scale(1) translateY(30px);
  }
  100% {
    opacity: 1;
    transform: rotateZ(8deg) scale(1) translateY(0);
  }
}
</style>
<script setup lang="ts">
import fridaylightLogo from "~/assets/images/fridaylight/fridaylight.webp";
import fridaylightBGOverlay from "~/assets/images/fridaylight/fridaylight_bg.webp";
import screenshot1 from "~/assets/images/fridaylight/fridaylightscreenshot1.webp";
import screenshot2 from "~/assets/images/fridaylight/fridaylightscreenshot2.webp";
import screenshot3 from "~/assets/images/fridaylight/fridaylightscreenshot3.webp";
import SketchText from "~/components/common/SketchText.vue";
import Icon from "~/components/common/Icon.vue";

import { computed } from "vue";
const fridaylightBGOverlayCorrected = computed(() => {
  return `url(${fridaylightBGOverlay})`;
});
</script>
