<template>
    <div :class="['callout', `callout--${type}`]">
        <div class="callout__icon">
            <Icon :icon="iconName" :style="{ color: iconColor }" />
        </div>
        <div class="callout__content">
            <h4
                v-if="title"
                class="callout__title"
                :style="{ color: iconColor }"
            >
                {{ title }}
            </h4>
            <div class="callout__body">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Icon from "../common/Icon.vue";
interface Props {
    type?: "info" | "warning" | "error" | "success";
    title?: string;
}

const props = withDefaults(defineProps<Props>(), {
    type: "info",
    title: undefined,
});

const iconName = computed(() => {
    const icons = {
        info: "info",
        warning: "warning",
        error: "md-danger",
        success: "star",
        important: "feedback",
    };
    return icons[props.type];
});

const iconColor = computed(() => {
    const colors = {
        info: "var(--blue)",
        warning: "var(--orange)",
        error: "var(--red)",
        success: "var(--green)",
        important: "var(--purple)",
    };
    return colors[props.type];
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/_mixins" as *;

.callout {
    display: flex;
    gap: 12px;
    padding: 16px;
    border-radius: 0 0.5rem 0.5rem 0;
    border-left: 4px solid;
    margin: 16px 0;
    background: var(--surface);
}

.callout--info {
    border-left-color: var(--blue);
    @include tint-background(var(--blue), 10%, var(--surface));
}

.callout--warning {
    border-left-color: var(--orange);
    @include tint-background(var(--orange), 10%, var(--surface));
}

.callout--error {
    border-left-color: var(--red);
    @include tint-background(var(--red), 10%, var(--surface));
}

.callout--success {
    border-left-color: var(--green);
    @include tint-background(var(--green), 10%, var(--surface));
}

.callout--important {
    border-left-color: var(--purple);
    @include tint-background(var(--purple), 10%, var(--surface));
}

.callout__icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    @include drop-shadow-simple(var(--background));
}

.callout__title {
    font-weight: 800;
    margin: 0 0 8px 0;
    color: var(--text);
    text-transform: uppercase;
}

.callout__content {
    flex: 1;
}

.callout__body {
    color: var(--text);
}
</style>
