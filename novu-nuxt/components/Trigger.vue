<script setup>
function triggerNotification() {
  fetch('/api/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
</script>

<template>
<Container>
  <div class="py-24 md:py-32 flex flex-col items-center">
    <a href="https://docs.novu.co/getting-started/send-your-first-notification"
      target="_blank"
      class="px-3 py-1 text-sm font-medium border border-[#e500c0] text-[#e500c0] rounded-full text-center mb-4">
      Check Novu docs 🚀
    </a>
    <h1 class="text-5xl md:text-6xl font-extrabold text-center">Trigger notification</h1>
    <p class="text-center text-slate-900 text-lg mt-4">
      Click the trigger button and then check the notification center by clicking the bell.
    </p>
    <div class="flex justify-center gap-4 mt-8">
      <button @click="triggerNotification" class="bg-black hover:bg-black/80 text-white font-medium px-8 py-3 rounded-md">Trigger</button>
    </div>
  </div>
</Container>
</template>
