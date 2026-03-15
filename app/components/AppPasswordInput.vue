<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  toggleLabel?: string
}>(), {
  toggleLabel: 'パスワード'
})

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const attrs = useAttrs()
const isVisible = ref(false)

const modelValue = computed({
  get() {
    return props.modelValue ?? props.defaultValue ?? ''
  },
  set(value: string | number) {
    emits('update:modelValue', value)
  }
})

const visibilityLabel = computed(() => `${props.toggleLabel}${isVisible.value ? 'を非表示' : 'を表示'}`)

function toggleVisibility() {
  isVisible.value = !isVisible.value
}
</script>

<template>
  <div class="relative">
    <Input
      v-model="modelValue"
      v-bind="attrs"
      :type="isVisible ? 'text' : 'password'"
      :class="cn('pr-12', props.class)"
    />
    <Button
      class="absolute right-1 top-1/2 h-8 -translate-y-1/2 px-2 text-muted-foreground hover:text-foreground"
      type="button"
      variant="ghost"
      @click="toggleVisibility"
    >
      <component :is="isVisible ? Eye : EyeOff" class="size-4" />
      <span class="sr-only">{{ visibilityLabel }}</span>
    </Button>
  </div>
</template>
