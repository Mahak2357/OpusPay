const connectDB = require('./config/db');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'OpusPay Financial Engine is running'
  });
});

// ================= API ROUTES =================
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});