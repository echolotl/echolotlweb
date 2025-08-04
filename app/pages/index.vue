<template>
    <div style="height: 100vh;">
        <div class="under-construction-banner">
            <nuxt-img class="under-construction-text" src="/images/underconstructiontxt.png" alt="Under Construction" />
            <nuxt-img class="king-image" src="/images/king_pink.png" alt="King w/ a power tool" />
        </div>
        <SketchText class="main-content" style="text-align: center;" word-wrap :max-width="600">
            i'm working on stuff (i'm stuff)
            <br>
            The art pages work, character pages are WIP but kinda work, and the blog works but its just a bunch of tests.
        </SketchText>
    </div>
</template>

<style scoped lang="scss">
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
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    margin-top: 200px;
    z-index: 1;
}
.hi-image {
    mask-image: url('/images/home/hi.webp');
    background-color: var(--text);
    width: 100%;
    height: 200px;
    display: block;
    mask-repeat: no-repeat;
}
.under-construction-banner {
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url('/images/underconstruction.png');
    background-position: bottom;
    background-repeat: repeat-x;
    width: 100%;
    height: 64px;
    bottom: 0;
}
.under-construction-text {
    filter: drop-shadow(2px 0 0 black) drop-shadow(-2px 0 0 black) drop-shadow(0 -2px 0 black) drop-shadow(0 2px 0 black);
    @media (max-width: 768px) {
        width: 50%;
        height: auto;
        margin-left: .5rem;
    }
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
<script lang="ts" setup>
import SketchText from '~/components/common/SketchText.vue';
</script>