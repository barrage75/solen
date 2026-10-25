import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../rateLimit";

describe("limite de requêtes", () => {
  it("bloque au-delà du maximum, puis libère l'adresse après la fenêtre", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000, maxTrackedIps: 100 });
    const results = [0, 1, 2, 3].map((t) => limiter.isLimited("1.2.3.4", t));
    expect(results).toEqual([false, false, false, true]);
    expect(limiter.isLimited("1.2.3.4", 2000)).toBe(false);
  });

  it("oublie les adresses inactives pour ne pas saturer la mémoire", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000, maxTrackedIps: 10 });
    for (let i = 0; i < 11; i++) limiter.isLimited(`10.0.0.${i}`, 0);
    expect(limiter.trackedIps()).toBe(11);
    // Après la fenêtre, la demande suivante purge les 11 adresses inactives et n'en garde qu'une.
    limiter.isLimited("10.0.1.1", 5000);
    expect(limiter.trackedIps()).toBe(1);
  });

  it("garde les adresses encore actives pendant la purge", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000, maxTrackedIps: 2 });
    limiter.isLimited("a", 0);
    limiter.isLimited("b", 900);
    limiter.isLimited("c", 950);
    limiter.isLimited("d", 1500);
    // « a » est inactive depuis plus d'une fenêtre ; « b » et « c » sont encore dans la fenêtre.
    expect(limiter.trackedIps()).toBe(3);
  });
});
