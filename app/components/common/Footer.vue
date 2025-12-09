<template>
    <footer>
        <div class="footer-content">
            <div class="content-container">
                <div class="small-username"></div>
                <SocialIcons style="image-rendering: pixelated" />
                <div>© echolotl 2025</div>
            </div>
        </div>
        <div class="footer-images">
            <div class="footer-image left-triangle" />
            <div class="footer-image right-triangle" />
            <div class="footer-image left-image" />
            <div class="footer-image right-image" />
        </div>
        <div
            v-if="rtc.public.underConstruction"
            class="under-construction-banner"
        >
            <nuxt-img
                class="under-construction-text"
                src="/images/underconstructiontxt.png"
                alt="Under Construction"
            />
        </div>
    </footer>
</template>

<script setup lang="ts">
import SocialIcons from "~/components/common/SocialIcons.vue";

const rtc = useRuntimeConfig();
console.log(rtc.public);
</script>

<style scoped lang="scss">
footer {
    position: relative;
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
    width: 100%;
    height: 500px;
    overflow: hidden;
}
.footer-images {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    .footer-image {
        position: absolute;
        bottom: 0;
        height: 100%;
        width: 100%;
        background-color: var(--text);
        mask-repeat: no-repeat;
        mask-size: contain;
        &.left-triangle {
            left: 0;
            mask-image: url("/images/footer/footerTriangle.webp");
            mask-position: left;
            background-color: var(--background);
        }
        &.right-triangle {
            right: 0;
            mask-image: url("/images/footer/footerTriangle.webp");
            mask-position: left;
            background-color: var(--background);
            transform: scaleX(-1);
        }
        &.left-image {
            left: 0;
            mask-image: url("/images/footer/footerLeft.webp");
            mask-position: left;
        }
        &.right-image {
            right: 0;
            mask-image: url("/images/footer/footerRight.webp");
            mask-position: right;
        }
    }

    @media (max-width: 1177px) {
        .footer-image {
            &.left-image,
            &.right-image,
            &.left-triangle,
            &.right-triangle {
                display: none;
            }
        }
    }
}

.footer-content {
    position: relative;
    bottom: 0;
    background: linear-gradient(to top, var(--surface), transparent 100%);
    height: 50%;
    width: 100%;

    .content-container {
        height: 100%;
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 0.25rem;
        filter: drop-shadow(0 1px 0 var(--background))
            drop-shadow(1px 0 0 var(--background))
            drop-shadow(-1px 0 0 var(--background))
            drop-shadow(0 -1px 0 var(--background))
            drop-shadow(1px 1px 0 var(--background))
            drop-shadow(-1px -1px 0 var(--background))
            drop-shadow(1px -1px 0 var(--background))
            drop-shadow(-1px 1px 0 var(--background));

        .small-username {
            width: 100%;
            height: 35px;
            mask-image: url("/images/footer/eac.webp");
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
            background-color: var(--text);
            transform: translateX(3px);
        }
    }
}

.under-construction-banner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url("/images/underconstruction.png");
    background-position: bottom;
    background-size: contain;
    background-repeat: repeat-x;
    width: 100%;
    height: 24px;
    z-index: 10;
}
.under-construction-text {
    height: 16px;
    filter: drop-shadow(2px 0 0 black) drop-shadow(-2px 0 0 black)
        drop-shadow(0 -2px 0 black) drop-shadow(0 2px 0 black);
}
</style>
