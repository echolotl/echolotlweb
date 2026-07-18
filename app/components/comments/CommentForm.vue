<template>
  <div class="comment-form">
    <UserAvatar :default="!isLoggedIn" :user="publicUser" />
    <form @submit.prevent="submitComment">
      <span
        class="textarea"
        :class="{ disabled: !isLoggedIn }"
        role="textbox"
        contenteditable
        @input="onInput"
        @paste="onPaste"
        @drop="onDrop"
        ref="textboxSpan"></span>
      <div v-if="isLoggedIn" class="comment-actions">
        <button
          type="submit"
          :disabled="submitting || !(commentText.length > 0)"
          class="filled round">
          Post Comment</button
        ><Icon v-if="submitting" icon="loading" width="40px" height="40px" />
        <span
          style="
            color: var(--text-secondary);
            font-size: var(--very-small-text);
          "
          v-else
          >Markdown supported! Commenting as
          <b>{{ getDisplayName(publicUser) }}</b
          >.</span
        >
      </div>
      <div v-if="error" class="comment-form-error">{{ error }}</div>
      <button
        v-if="!isLoggedIn"
        type="button"
        class="discord-login round"
        @click="login">
        Login with
        <img
          style="margin-left: 6px"
          width="24"
          height="24"
          src="~/assets/images/discord_logo.svg" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useComments } from "~~/composables/useComments";
import { useAuth } from "~~/composables/useAuth";
import UserAvatar from "~/components/common/UserAvatar.vue";
import { insertPlainText } from "~/utils";
const props = defineProps<Props>();
const { isLoggedIn, login, publicUser, getDisplayName } = useAuth();
const { postComment, error } = useComments(props.slug);
import { ref } from "vue";
import Icon from "../common/Icon.vue";
const textboxSpan = ref<HTMLElement | null>(null);
interface Props {
  slug: string;
}

const commentText = ref("");
const onInput = (event: InputEvent) => {
  const target = event.target as HTMLElement;
  commentText.value = target.innerText.trim();
};
const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") ?? "";
  insertPlainText(text);
};
const onDrop = (event: DragEvent) => {
  event.preventDefault();
  const text = event.dataTransfer?.getData("text/plain") ?? "";
  insertPlainText(text);
};
const submitting = ref(false);

const submitComment = async () => {
  if (isLoggedIn.value) {
    submitting.value = true;
    try {
      await postComment(commentText.value);
      commentText.value = "";
      if (textboxSpan.value) {
        textboxSpan.value.innerText = "";
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      submitting.value = false;
    }
  } else {
    login();
  }
};
</script>

<style lang="scss">
button.discord-login {
  background: #5865f2;
  border-color: color-mix(in srgb, #5865f2, var(--inverted-solid) 20%);
  color: white;
  font-weight: bold;
}
form {
  flex: 1;
}
form .textarea {
  display: block;
  width: 100%;
  min-height: 1rem;
  max-width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  margin-bottom: 8px;
  resize: none;
  border: 1px solid var(--distant);
  background: var(--surface);
  padding: 8px;
  color: var(--text);
  font-family: var(--base-font);
  font-size: var(--base-text);
  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  &:empty::before {
    content: "Write a comment...";
    color: var(--text-secondary);
  }
  &:active,
  &:focus {
    outline: none;
  }
}

.comment-form {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.comment-form-error {
  margin-top: 0.5rem;
  color: var(--red);
  font-size: var(--small-text);
}
</style>
