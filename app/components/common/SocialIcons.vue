<template>
  <div class="social-icons">
    <a href="https://echolotl.tumblr.com/" target="_blank" rel="noopener noreferrer" class="link">
      <Icon icon="socials/tumblr" :height="iconSize" :width="iconSize"/>
    </a>
    <div class="twitter">
      <a href="https://x.com/echolotl" target="_blank" rel="noopener noreferrer" class="link">
        <Icon 
          v-show="!isShiftPressed" 
          icon="socials/x"
          :height="iconSize"
          :width="iconSize"
        />
      </a>
      <a href="https://twitter.com/echolotl" target="_blank" rel="noopener noreferrer" class="link">
        <Icon 
          v-show="isShiftPressed" 
          icon="socials/twitter" 
          :height="iconSize"
          :width="iconSize"
        />
      </a>
    </div>
    <a href="https://echolotl.newgrounds.com/" target="_blank" rel="noopener noreferrer" class="link">
      <Icon icon="socials/newgrounds" :height="iconSize" :width="iconSize"/>
    </a>
    <a href="https://bsky.app/profile/echolotl.loll" target="_blank" rel="noopener noreferrer" class="link">
      <Icon icon="socials/bluesky" :height="iconSize" :width="iconSize"/>
    </a>
    <a href="https://github.com/echolotl" target="_blank" rel="noopener noreferrer" class="link">
      <Icon icon="socials/github" :height="iconSize" :width="iconSize"/>
    </a>
    <div class="discord-container">
      <div class="discord-icon" @click="copyDiscordToClipboard" title="Click to copy Discord username">
        <Icon icon="socials/discord" :height="iconSize" :width="iconSize"/>
      </div>
      <SketchText 
        v-if="showCopiedText" 
        class="copied-text"
        :class="{ 'float-up': showCopiedText }"
      >
        Copied!
      </SketchText>
    </div>
    <a href="https://www.youtube.com/@echolotl" target="_blank" rel="noopener noreferrer" class="link">
      <Icon icon="socials/youtube" :height="iconSize" :width="iconSize"/>
    </a>
    <a href="https://www.instagram.com/echolotl_/" target="_blank" rel="noopener noreferrer" class="link">
      <Icon icon="socials/instagram" :height="iconSize" :width="iconSize"/>
    </a>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Icon from './Icon.vue';
import SketchText from './SketchText.vue';

const isShiftPressed = ref(false);
const showCopiedText = ref(false);
const iconSize = "2.5rem";

const handleKeyDown = (event) => {
  if (event.key === 'Shift') {
    isShiftPressed.value = true;
  }
};

const handleKeyUp = (event) => {
  if (event.key === 'Shift') {
    isShiftPressed.value = false;
  }
};

const copyDiscordToClipboard = async () => {
  const discordUsername = "echolotl";
  try {
    await navigator.clipboard.writeText(discordUsername);
    // Show the floating text
    showCopiedText.value = true;
    
    // Hide the text after animation completes
    setTimeout(() => {
      showCopiedText.value = false;
    }, 2000);
    
    console.log('Discord username copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style>
.twitter {
    display: inline-block;
}
.social-icons {
    width: 100%;
    display: flex;
    justify-content: center;
}
.social-icons a {
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease;
}
.social-icons a:hover, .social-icons .twitter:hover {
    transform: scale(1.1);
}
.discord-container {
    position: relative;
    display: inline-block;
}
.discord-icon {
    cursor: pointer;
    transition: transform 0.2s ease;
    display: inline-block;
}
.discord-icon:hover {
    transform: scale(1.1);
}
.copied-text {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 10;
    color: var(--blue);
}
.float-up {
    animation: floatUp 2s ease-out forwards;
}
@keyframes floatUp {
    0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
    }
}
</style>