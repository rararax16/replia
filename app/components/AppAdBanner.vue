<script setup lang="ts">
const props = withDefaults(defineProps<{
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle'
}>(), {
  format: 'auto'
})

const { adsenseAdSlot } = useRuntimeConfig().public

onMounted(() => {
  if (!adsenseAdSlot) return
  try {
    ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
    ;(window as any).adsbygoogle.push({})
  }
  catch {}
})
</script>

<template>
  <div v-if="adsenseAdSlot" class="flex justify-center">
    <ins
      class="adsbygoogle"
      style="display: block;"
      data-ad-client="ca-pub-4003353824515477"
      :data-ad-slot="adsenseAdSlot"
      :data-ad-format="props.format"
      data-full-width-responsive="true"
    />
  </div>
</template>
