<script setup lang="ts">
import { Bot, Sparkles } from 'lucide-vue-next'

defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="relative flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
      <Bot class="size-5" />
      <span class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
        <Sparkles class="size-3" />
      </span>
    </div>

    <div v-if="!compact" class="space-y-0.5">
      <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Instagram Auto Reply
      </p>
      <p class="text-xl font-extrabold tracking-tight text-foreground">
        Replia
      </p>
    </div>
  </div>
</template>
