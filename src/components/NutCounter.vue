<script setup>
import { save } from '../store.js'
import AcornIcon from './ui/AcornIcon.vue'
</script>

<template>
  <span class="pill nuts" :aria-label="`${save.nuts} noisettes`"><AcornIcon :size="20" />{{ save.nuts }}</span>
</template>
