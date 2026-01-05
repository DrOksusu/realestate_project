import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import tenantRoutes from './routes/tenant.routes';
import leaseRoutes from './routes/lease.routes';
import rentPaymentRoutes from './routes/rentPayment.routes';
import expenseRoutes from './routes/expense.routes';
import valuationRoutes from './routes/valuation.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
const corsOptions = {
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/rent-payments', rentPaymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/valuations', valuationRoutes);

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Realestate API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      tenants: '/api/tenants',
      leases: '/api/leases',
      rentPayments: '/api/rent-payments',
      expenses: '/api/expenses',
      valuations: '/api/valuations',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
