export class RateLimiter {
    private requests = new Map<string, number[]>();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 5) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    check(ip: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(ip) || [];
        const recentRequests = userRequests.filter((time) => now - time < this.windowMs);

        if (recentRequests.length >= this.maxRequests) {
            return false; // Rate limit exceeded
        }

        recentRequests.push(now);
        this.requests.set(ip, recentRequests);
        return true; // Request allowed
    }
}
