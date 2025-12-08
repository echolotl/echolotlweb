<template>
    <div style="min-height: 75vh">
        <div class="main-content"></div>
        <div class="under-construction-banner">
            <nuxt-img
                class="under-construction-text"
                src="/images/underconstructiontxt.png"
                alt="Under Construction"
            />
        </div>
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
    height: 64px;
    z-index: 10;
}
.under-construction-text {
    height: 32px;
    filter: drop-shadow(2px 0 0 black) drop-shadow(-2px 0 0 black)
        drop-shadow(0 -2px 0 black) drop-shadow(0 2px 0 black);
    @media (max-width: 768px) {
        width: 50%;
        height: auto;
        margin-left: 0.5rem;
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
