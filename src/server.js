const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io on HTTP Server
initSocket(server);

// Database Connection
connectDB();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'OpusPay Financial Engine is running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// Server Start (Listen on HTTP server instead of app)
server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});