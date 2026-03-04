import { Ratelimit } from "npm:@upstash/ratelimit@2.0.8";
import { Redis } from "npm:@upstash/redis@1.36.3";

export class RateLimiter {
    private fallbackMap = new Map<string, number[]>();
    private windowMs: number;
    private maxRequests: number;
    private ratelimit: Ratelimit | null = null;

    constructor(windowMs: number = 60000, maxRequests: number = 5) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
        const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

        if (url && token) {
            const redis = new Redis({ url, token });
            const windowSecs = Math.floor(windowMs / 1000);
            this.ratelimit = new Ratelimit({
                redis: redis,
                limiter: Ratelimit.slidingWindow(maxRequests, `${windowSecs} s`),
            });
        }
    }

    async check(identifier: string): Promise<boolean> {
        if (this.ratelimit) {
            try {
                const { success } = await this.ratelimit.limit(identifier);
                return success;
            } catch (error) {
                console.error("Upstash rate limit error:", error);
                // Fallback on error
            }
        }

        // Fallback to memory
        const now = Date.now();
        const userRequests = this.fallbackMap.get(identifier) || [];
        const recentRequests = userRequests.filter((time) => now - time < this.windowMs);

        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.fallbackMap.set(identifier, recentRequests);
        return true;
    }
}
