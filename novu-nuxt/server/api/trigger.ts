import { Novu } from '@novu/node';

const novu = new Novu({
  apiKey: process.env.NOVU_API_KEY,
});

export default defineEventHandler(async (event) => {
  console.log(`Received event: ${event}`);

  await novu.trigger('sample-workflow', {
    to: {
      subscriberId: process.env.NOVU_SUBSRIBER_ID!,
    },
    payload: {}
  });
});
