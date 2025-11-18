// server/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js'; 

// Import Routes ทั้งหมด
import wasteRoutes from './src/routes/wasteRoutes.js'; 
import communityRoutes from './src/routes/communityRoutes.js'; 
import userRoutes from './src/routes/userRoutes.js'; 
import authRoutes from './src/routes/authRoutes.js'; 
import bookingRoutes from './src/routes/bookingRoutes.js'; 
import fertilizerRoutes from './src/routes/fertilizerRoutes.js'; 
import matchingRoutes from './src/routes/matchingRoutes.js'; 
import farmRoutes from './src/routes/farmRoutes.js'; 
import productRoutes from './src/routes/productRoutes.js'; 
import chatRoutes from './src/routes/chatRoutes.js'; 

// Routes ใหม่จาก API (ตามรูป)
import analyzeRoutes from './src/routes/analyzeRoutes.js';
import marketRoutes from './src/routes/marketRoutes.js';
import visualizationRoutes from './src/routes/visualizationRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

// Route ใหม่สำหรับ Notification
import notificationRoutes from './src/routes/notificationRoutes.js';


const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Increase body size limit to handle base64 images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Waste-Cycle API is running',
    timestamp: new Date().toISOString()
  });
});

// ---------------------------------
// 🚀 API Routes (เชื่อมต่อทั้งหมด)
// ---------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// (API เดิม)
app.use('/api/wastes', wasteRoutes); // (ตัวนี้อาจจะ link ไปที่ productRoutes)
app.use('/api/products', productRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fertilizer', fertilizerRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/farms', farmRoutes); 
app.use('/api/chat', chatRoutes); 

// (API ใหม่ตามรูป)
app.use('/api/analyze', analyzeRoutes);       // API-18
app.use('/api/market', marketRoutes);         // API-19, 20
app.use('/api/visualization', visualizationRoutes); // API-21
app.use('/api/admin', adminRoutes);           // API-22, 23, 24, 25

// (API ใหม่สำหรับแจ้งเตือน)
app.use('/api/notifications', notificationRoutes);


// 404 handler (ถ้าไม่เจอ Route ไหนเลย)
app.use(notFound);

// Error handling middleware (ตัวจัดการ Error กลาง)
app.use(errorHandler);

// Helper function to check and kill process on port
const killProcessOnPort = (port) => {
  try {
    const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`⚠️  Killed existing process (PID: ${pid}) on port ${port}`);
      return true;
    }
  } catch (error) {
    // No process found on port
    return false;
  }
  return false;
};

// Check and kill process on port before starting (in development)
const checkPortBeforeStart = () => {
  const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  const shouldAutoKill = process.env.AUTO_KILL_PORT === 'true' || 
                        (isDevelopment && process.env.AUTO_KILL_PORT !== 'false');
  
  if (shouldAutoKill) {
    const killed = killProcessOnPort(PORT);
    if (killed) {
      // Wait a bit for port to be released
      return new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return Promise.resolve();
};

// Start server with retry logic for port conflicts
const startServer = async () => {
  // Check port before starting in development
  await checkPortBeforeStart();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Waste-Cycle Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Using Firebase Auth (MOCK_AUTH mode has been removed)`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      
      // Auto-kill in development mode or if explicitly enabled
      const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      const shouldAutoKill = process.env.AUTO_KILL_PORT === 'true' || 
                            (isDevelopment && process.env.AUTO_KILL_PORT !== 'false');
      
      if (shouldAutoKill) {
        console.log(`🔄 Attempting to kill existing process...`);
        const killed = killProcessOnPort(PORT);
        if (killed) {
          console.log(`⏳ Retrying server startup in 2 seconds...`);
          setTimeout(async () => {
            await startServer();
          }, 2000);
          return;
        } else {
          console.error(`   Could not kill process on port ${PORT}`);
        }
      }
      
      console.error(`   Please stop the existing server or use a different port.`);
      console.error(`   To kill existing process: lsof -ti:${PORT} | xargs kill -9`);
      if (!shouldAutoKill) {
        console.error(`   Or set AUTO_KILL_PORT=true in .env to auto-kill on port conflict`);
      }
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  return server;
};

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
