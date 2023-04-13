import { RateLimiterMemory } from 'rate-limiter-flexible';

const resetLimiter = new RateLimiterMemory({
    duration: 5 * 60 * 60,
    points: 5,
    keyPrefix: 'reset',
});

export async function throttleResetPassword(email: string) {
    try {
        const result = await resetLimiter.consume(email, 1);
        if (result.remainingPoints <= 0) {
            return true;
        }

        return false;
    } catch (err) {
        return true;
    }
}