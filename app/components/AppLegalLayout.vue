<script setup lang="ts">
defineProps<{
  title: string
  lead: string
  updatedAt: string
}>()
</script>

<template>
  <main class="px-4 py-8 sm:px-6 sm:py-10">
    <div class="mx-auto flex max-w-5xl flex-col gap-6">
      <section class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10">
        <div class="flex flex-col gap-8">
          <AppBrandMark />

          <div class="max-w-3xl space-y-4">
            <Badge variant="secondary" class="rounded-full px-3 py-1">
              Replia ポリシー
            </Badge>
            <div class="space-y-3">
              <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {{ title }}
              </h1>
              <p class="text-sm leading-7 text-muted-foreground sm:text-base">
                {{ lead }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardContent class="space-y-5 p-6 sm:p-10">
          <slot />
        </CardContent>
        <CardFooter class="flex flex-col items-start gap-4 border-t bg-muted/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p class="text-sm text-muted-foreground">
            最終更新日: {{ updatedAt }}
          </p>
          <div class="flex flex-wrap gap-3">
            <slot name="actions" />
          </div>
        </CardFooter>
      </Card>
    </div>
  </main>
</template>
