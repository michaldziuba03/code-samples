<template>
<Container>
  <header class="w-full pt-6 lg:pt-8 flex gap-4 items-center justify-between">
    <h1 class="font-black text-lg">App</h1>
    <nav class="flex items-center gap-8 font-medium text-sm">
      <nuxt-link to="/">Home</nuxt-link>
      <nuxt-link to="/about">About</nuxt-link>
      <NotificationCenter />
    </nav>
  </header>
</Container>
</template>