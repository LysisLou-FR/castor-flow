<script setup>
import { save } from '../store.js'
import Icon from './ui/Icon.vue'
</script>

<template>
  <span class="pill lives" :aria-label="`${save.lives} vies`">
    <Icon name="heart" :size="20" />
    {{ save.lives }}
  </span>
</template>
