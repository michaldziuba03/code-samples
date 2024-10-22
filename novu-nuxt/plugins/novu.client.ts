import NotificationCenterPlugin from '@novu/notification-center-vue';
import '@novu/notification-center-vue/dist/style.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(NotificationCenterPlugin);
});
