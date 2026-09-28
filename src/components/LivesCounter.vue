<script setup>
import { MAX_LIVES, formatDelay, nextLifeIn } from '../lives.js'
import { save } from '../store.js'
import Icon from './ui/Icon.vue'
</script>

<template>
  <span class="pill lives" :aria-label="`${save.lives} vies`">
    <Icon name="heart" :size="20" />
    {{ save.lives }}
    <small v-if="save.lives < MAX_LIVES && nextLifeIn">{{ formatDelay(nextLifeIn) }}</small>
  </span>
</template>
