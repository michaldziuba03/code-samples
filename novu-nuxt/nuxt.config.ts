export default defineNuxtConfig({
  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    },
  ],
  css: ['~/assets/global.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
});
