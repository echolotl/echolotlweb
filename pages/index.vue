<template>
    <div>
                    <nuxt-img
            src="/images/home/header.webp"
            alt="Main header image"
            class="top-overlay"
        />
        <div class="main-content">
            <div
            class="hi-image"
                alt="hi! i'm echolotl"
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
</style>