import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import leadRoutes from './routes/leads';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users'
import webhookRoutes from './routes/webhooks';
import paymentsRoutes from './routes/payments';
import contractsRoutes from './routes/contracts';

const app = express();

// CONFIGURACIÓN ÚNICA DE CORS (Elimina las otras dos)
app.use(cors({
  // Esto permite tanto local como la URL de producción sin importar la '/' final
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://poloniaforyou.vercel.app',
      'https://poloniaforyou.vercel.app/'
    ];
    
    // Si no hay origen (como Postman) o está en la lista, permitir
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Rutas
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', usersRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/contracts', contractsRoutes)
// El puerto debe ser Number para Render
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});