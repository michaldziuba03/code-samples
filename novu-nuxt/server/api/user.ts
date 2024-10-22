import { createHmac } from "crypto";

export default defineEventHandler(async (event) => {
  console.log(`Received event: ${event}`);

  const userId = process.env.NOVU_SUBSRIBER_ID!; // it should be some id from your database

  const hmacHash = createHmac("sha256", process.env.NOVU_API_KEY!)
    .update(userId)
    .digest("hex");

  return {
    userId,
    hmacHash,
  }
});
