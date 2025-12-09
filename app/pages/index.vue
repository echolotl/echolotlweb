<template>
    <div style="min-height: 75vh">
        <div class="main-content">hi 😟</div>
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
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    padding-top: calc(2rem + 60px);
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
.king-image {
    align-self: flex-end;
    max-height: 256px;
    width: auto;
    @media (max-width: 768px) {
        width: 50%;
    }
}
</style>
