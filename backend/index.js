// server/index.js
import dotenv from 'dotenv';
dotenv.config(); // <--- Line 1: Must be loaded before other imports

import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dns from 'dns';
import connectDB from './config/db.js';
import { seedSuperAdmin } from './config/seedSuperAdmin.js'; // Adjust path if located in utils/

// Routes
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import landlordRoutes from './routes/landlordRoutes.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

connectDB().then(async () => {
  await seedSuperAdmin();
});

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize Socket.io with credentials
const io = new Server(server, {
  cors: {
    origin: ['http://127.0.0.1:5173',
      process.env.CLIENT_URL,
      'https://habitatx-nine.vercel.app'
    ],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('[SOCKET CONNECTED]:', socket.id);
  socket.on('disconnect', () => {
    console.log('[SOCKET DISCONNECTED]:', socket.id);
  });
});

// Attach io instance to express app so controllers can access it
app.set('io', io);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173' , 'https://habitatx-nine.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/reviews', reviewRoutes);

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// Corrected: Start the HTTP server holding Socket.IO
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});