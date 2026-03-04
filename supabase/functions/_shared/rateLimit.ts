export class RateLimiter {
    private requests = new Map<string, number[]>();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 5) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    check(identifier: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];
        const recentRequests = userRequests.filter((time) => now - time < this.windowMs);

        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);
        return true;
    }
}
