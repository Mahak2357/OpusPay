const windows = new Map();

const rateLimit = ({ windowMs, max, key = (req) => req.ip }) => (req, res, next) => {
  const now = Date.now();
  const identifier = key(req);
  const entry = windows.get(identifier);
  const active = !entry || entry.resetAt <= now ? { count: 0, resetAt: now + windowMs } : entry;
  active.count += 1;
  windows.set(identifier, active);

  res.set('RateLimit-Limit', String(max));
  res.set('RateLimit-Remaining', String(Math.max(max - active.count, 0)));
  if (active.count > max) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
  return next();
};

module.exports = { rateLimit };
