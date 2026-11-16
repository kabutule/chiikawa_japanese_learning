// 아주 단순한 IP 별 요청 제한 (메모리, 서버 1대 기준). AI 호출 비용 폭주 방지용.
export function rateLimit({ windowMs, max }) {
  const hits = new Map(); // ip -> [timestamps]

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, times] of hits) {
      const recent = times.filter((t) => t > cutoff);
      if (recent.length) hits.set(ip, recent);
      else hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const times = (hits.get(req.ip) ?? []).filter((t) => t > now - windowMs);
    if (times.length >= max) {
      return res.status(429).json({ error: "너무 빨리 제출하고 있어요. 잠시 후 다시 시도해 주세요." });
    }
    times.push(now);
    hits.set(req.ip, times);
    next();
  };
}
