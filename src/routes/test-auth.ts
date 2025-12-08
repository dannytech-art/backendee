import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../database/connection';

const router = Router();

// Test endpoint to verify user exists and check PIN
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ error: 'Email and PIN are required' });
    }

    // Find user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, pin_hash, is_admin')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (fetchError) {
      return res.json({
        found: false,
        error: fetchError.message,
        message: 'User not found in database',
      });
    }

    if (!user) {
      return res.json({
        found: false,
        message: 'User not found',
      });
    }

    // Check if PIN hash exists
    if (!user.pin_hash) {
      return res.json({
        found: true,
        hasPinHash: false,
        message: 'User exists but has no PIN hash. Run: pnpm setup:users',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Test PIN
    const isValid = await bcrypt.compare(pin, user.pin_hash);

    return res.json({
      found: true,
      hasPinHash: true,
      pinValid: isValid,
      message: isValid
        ? 'User found and PIN is correct!'
        : 'User found but PIN is incorrect',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin,
      },
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return res.status(500).json({ error: error.message || 'Test failed' });
  }
});

export default router;

