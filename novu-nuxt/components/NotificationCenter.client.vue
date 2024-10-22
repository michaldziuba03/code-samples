<script lang="ts" setup>

const { data, status } = await useAsyncData('session', () =>
  $fetch('/api/user')
)

const applicationIdentifier = import.meta.env.VITE_NOVU_APP_ID;
const sessionLoaded = () => {
  console.log('Notification center session loaded successfully!');
};

</script>
<template>
  <NotificationCenterComponent
    v-if="status == 'success' && data"
    v-slot="slot"
    :subscriber-id="data.userId"
    :subscriber-hash="data.hmacHash"
    :application-identifier="applicationIdentifier"
    :session-loaded="sessionLoaded"
  >
    <button 
      class="relative w-8 h-8 m-auto"
      :class="{'before:bg-red-700 before:w-2.5 before:h-2.5 before:rounded-full before:absolute before:top-0 before:right-0': slot.unseenCount > 0}"
      >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    </button>
  </NotificationCenterComponent>
</template>
