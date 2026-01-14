import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

const prisma = new PrismaClient();
const app = express();
const PORT = 3001;
const JWT_SECRET = 'your_super_secret_key_123';

app.use(cors());
app.use(express.json());

// --- Midlbar ---
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- Auth ---

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { email, password: hashedPassword }
    });
    res.json({ message: 'Admin created', adminId: admin.id });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists or database not updated' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) return res.status(400).json({ message: 'User not found' });

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// --- Users ---

app.get('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/api/users/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const newUser = await prisma.user.create({ data: { name, email } });
  res.json(newUser);
});

app.put('/api/users/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email }
    });
    res.json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found in database' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: Number(id) } });
  res.json({ message: 'User deleted' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});