import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../database/connection';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, pin } = req.body;

    if (!name || !email || !pin) {
      return res.status(400).json({ error: 'Name, email, and PIN are required' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      id: userId,
      name,
      email,
      phone: phone || null,
      pin_hash: pinHash,
      is_admin: false,
    };

    const { error } = await supabase.from('users').insert(newUser);

    if (error) {
      throw error;
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production-dev-only';
    if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production-dev-only') {
      console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
    }
    const token = jwt.sign(
      { userId: newUser.id, isAdmin: false },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        isAdmin: newUser.is_admin,
      },
      token,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ error: 'Email and PIN are required' });
    }

    // Find user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.pin_hash) {
      console.error(`User ${email} has no PIN hash`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isValid) {
      console.log(`Invalid PIN for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production-dev-only';
    if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production-dev-only') {
      console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
    }
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isAdmin: user.is_admin,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Failed to login' });
  }
});

export default router;
