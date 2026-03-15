<template>
  <div class="relative isolate min-h-screen">
    <div class="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.2),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_24%)]" />
    <div class="pointer-events-none fixed inset-x-0 top-[-8rem] -z-10 h-72 bg-[radial-gradient(circle,rgba(15,23,42,0.08),transparent_62%)] blur-3xl" />
    <NuxtLoadingIndicator color="hsl(var(--primary))" :height="3" />
    <NuxtPage />
  </div>
</template>
