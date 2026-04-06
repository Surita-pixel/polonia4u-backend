import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import leadRoutes from './routes/leads';
import adminRoutes from './routes/admin';

const app = express();

// CONFIGURACIÓN DE CORS
app.use(cors({
  // En producción, cambia '*' por la URL real de tu frontend en Vercel
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en puerto ${PORT}`);
});