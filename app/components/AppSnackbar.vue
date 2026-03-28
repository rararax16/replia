<script setup lang="ts">
import { CheckCircle2, CircleAlert, X } from 'lucide-vue-next'

const { items, dismiss } = useSnackbar()
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-2">
      <TransitionGroup name="snackbar">
        <div
          v-for="item in items"
          :key="item.id"
          class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.15)] backdrop-blur"
          :class="item.type === 'error' ? 'border-destructive/30' : 'border-border/70'"
        >
          <component
            :is="item.type === 'error' ? CircleAlert : CheckCircle2"
            class="mt-0.5 size-4 shrink-0"
            :class="item.type === 'error' ? 'text-destructive' : 'text-primary'"
          />
          <p class="flex-1 text-sm leading-5 text-foreground">
            {{ item.message }}
          </p>
          <button
            class="shrink-0 rounded-lg p-0.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            @click="dismiss(item.id)"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.snackbar-enter-active,
.snackbar-leave-active {
  transition: all 0.22s ease;
}

.snackbar-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.snackbar-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
