// server/src/middleware/rateLimitMiddleware.js

// Simple in-memory rate limiter
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export const rateLimitMiddleware = (req, res, next) => {
  const identifier = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // ดึงข้อมูลการ request ของ IP นี้
  let userData = requestCounts.get(identifier);
  
  if (!userData) {
    userData = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  // Reset ถ้าหมดเวลา
  if (now > userData.resetTime) {
    userData = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  // เพิ่มจำนวน request
  userData.count++;
  requestCounts.set(identifier, userData);
  
  // ตรวจสอบว่าเกิน limit หรือไม่
  if (userData.count > MAX_REQUESTS) {
    const resetIn = Math.ceil((userData.resetTime - now) / 1000);
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${resetIn} seconds`,
      retryAfter: resetIn
    });
  }
  
  // เพิ่ม headers สำหรับแจ้งข้อมูล rate limit
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - userData.count);
  res.setHeader('X-RateLimit-Reset', new Date(userData.resetTime).toISOString());
  
  next();
};

// ทำความสะอาดข้อมูลเก่าทุก 5 นาที
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime + WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);