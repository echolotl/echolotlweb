<template>
  <div class="settings-page">
    <template v-if="user">
      <div class="settings-section">
        <div class="account-info">
          <UserAvatar :size="64" :user="user" />
          <div class="account-details">
            <div class="display-name lotl-font">
              {{ getDisplayName(user) }}
              <span v-if="user.anonymous" style="color: var(--text-secondary)"
                >({{ getDisplayName(publicUser) }})</span
              >
            </div>
            <div class="username lotl-font">
              @{{ user.username }}
              <span v-if="user.anonymous" style="color: var(--text-secondary)"
                >(@{{ publicUser?.username }})</span
              >
            </div>
            <div class="subtitle" style="margin-bottom: 0">
              Account created on
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="small-title">Privacy</h2>
        <label class="anonymous-toggle">
          <input
            type="checkbox"
            :checked="user.anonymous"
            :disabled="anonymousSaving"
            @change="onToggleAnonymous" />
          <div>
            <div>Post anonymously</div>
            <div class="text-secondary">
              Hide your username, avatar, and Discord ID from other visitors on
              comments and throughout the backend.
            </div>
          </div>
        </label>
      </div>
      <div class="settings-section">
        <h2 class="small-title">Debug</h2>
        <p class="text-secondary"><b>User ID:</b> {{ user.userId }}</p>
        <p class="text-secondary">
          <b>Discord ID:</b> {{ user.id }}
          {{ publicUser?.id ? null : "(hidden)" }}
        </p>
      </div>

      <div class="settings-footer">
        <button
          style="
            margin-top: 1rem;
            align-self: flex-end;
            display: flex;
            align-items: center;
            gap: 8px;
          "
          type="button"
          @click="logoutAndRedirect">
          <Icon icon="logout" width="24px" height="24px" />
          Log Out
        </button>

        <button
          style="
            margin-top: 1rem;
            align-self: flex-end;
            display: flex;
            align-items: center;
            gap: 8px;
          "
          type="button"
          :disabled="deletingAccount"
          @click="handleDeleteAccount"
          class="filled red">
          <Icon icon="trash" width="24px" height="24px" />
          {{ deletingAccount ? "Deleting..." : "Delete Account" }}
        </button>
      </div>
      <p v-if="deleteError" class="text-secondary">{{ deleteError }}</p>
    </template>

    <template v-else>
      <p class="subtitle">You're not logged in.</p>
      <button type="button" class="filled" @click="login">
        Login with Discord
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "~~/composables/useAuth";
import UserAvatar from "~/components/common/UserAvatar.vue";
import Icon from "~/components/common/Icon.vue";

const {
  user,
  login,
  logout,
  setAnonymous,
  deleteAccount,
  getDisplayName,
  publicUser,
} = useAuth();

const anonymousSaving = ref(false);
const deletingAccount = ref(false);
const deleteError = ref<string | null>(null);

const logoutAndRedirect = () => {
  window.location.href = "/";
  logout();
};

async function onToggleAnonymous(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  anonymousSaving.value = true;
  try {
    await setAnonymous(checked);
  } catch (err) {
    console.error("Error updating anonymous setting:", err);
  } finally {
    anonymousSaving.value = false;
  }
}

async function handleDeleteAccount() {
  deletingAccount.value = true;
  deleteError.value = null;
  try {
    await deleteAccount();
    window.location.href = "/";
  } catch (err) {
    console.error("Error deleting account:", err);
    deleteError.value =
      err instanceof Error ? err.message : "Failed to delete account.";
  } finally {
    deletingAccount.value = false;
  }
}

useSeoMeta({
  title: "Account - echolotl.lol",
});
</script>

<style scoped lang="scss">
.settings-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 75vh;
  justify-content: center;
}

.settings-section {
  margin-bottom: 1rem;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.display-name {
  font-size: var(--large-text);
}

.username {
  color: var(--text-secondary);
}

.anonymous-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;

  input[type="checkbox"] {
    margin-top: 0.2rem;
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
    cursor: pointer;
  }
}

.settings-footer {
  display: flex;
  margin-top: 1rem;
  gap: 8px;
  align-items: center;
}
</style>
