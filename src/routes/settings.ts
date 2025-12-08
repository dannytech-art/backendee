import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all settings
router.get('/', async (req, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*');

    if (error) throw error;

    const settingsMap: Record<string, string> = {};
    (data || []).forEach(setting => {
      settingsMap[setting.setting_key] = setting.setting_value || '';
    });

    res.json(settingsMap);
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch settings' });
  }
});

// Get setting by key
router.get('/:key', async (req, res: Response) => {
  try {
    const { key } = req.params;
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('setting_key', key)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: data.setting_key, value: data.setting_value });
  } catch (error: any) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch setting' });
  }
});

// Update setting (Admin only)
router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const { data: existing } = await supabase
      .from('platform_settings')
      .select('id')
      .eq('setting_key', key)
      .single();

    if (!existing) {
      // Create new setting
      const { data, error } = await supabase
        .from('platform_settings')
        .insert({
          setting_key: key,
          setting_value: value,
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ key: data.setting_key, value: data.setting_value });
    } else {
      // Update existing setting
      const { data, error } = await supabase
        .from('platform_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)
        .select()
        .single();

      if (error) throw error;
      res.json({ key: data.setting_key, value: data.setting_value });
    }
  } catch (error: any) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: error.message || 'Failed to update setting' });
  }
});

// Delete setting (Admin only)
router.delete('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;

    const { error } = await supabase
      .from('platform_settings')
      .delete()
      .eq('setting_key', key);

    if (error) throw error;
    res.json({ message: 'Setting deleted successfully' });
  } catch (error: any) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete setting' });
  }
});

export default router;
