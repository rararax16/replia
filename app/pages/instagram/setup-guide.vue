<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

await navigateTo('/instagram?guide=1', { replace: true })
</script>

<template>
  <div />
</template>
