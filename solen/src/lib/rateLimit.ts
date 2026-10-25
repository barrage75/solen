// Limite de requêtes par adresse IP, gardée en mémoire du serveur.
// Sur un hébergeur sans serveur, chaque instance a sa propre mémoire : c'est une protection de base, pas une garantie.
export type RateLimitOptions = { max: number; windowMs: number; maxTrackedIps: number };

export const createRateLimiter = ({ max, windowMs, maxTrackedIps }: RateLimitOptions) => {
  const hits = new Map<string, number[]>();

  // Au-delà de maxTrackedIps adresses suivies, on oublie celles qui n'ont rien demandé pendant la fenêtre :
  // sinon la table grandit à chaque nouvelle adresse et finit par saturer la mémoire du serveur.
  const forgetIdleIps = (now: number) => {
    if (hits.size <= maxTrackedIps) return;
    for (const [ip, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(ip);
    }
  };

  return {
    // Enregistre une demande et renvoie true si l'adresse a dépassé la limite.
    isLimited(ip: string, now = Date.now()) {
      forgetIdleIps(now);
      const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(ip, recent);
      return recent.length > max;
    },
    trackedIps: () => hits.size,
  };
};
