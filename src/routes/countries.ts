import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all countries
router.get('/', async (req, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch countries' });
  }
});

// Get country by ID
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Get country error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch country' });
  }
});

// Create country (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, flag, code } = req.body;

    if (!name || !flag || !code) {
      return res.status(400).json({ error: 'Name, flag, and code are required' });
    }

    const countryId = `country_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCountry = {
      id: countryId,
      name,
      flag,
      code: code.toUpperCase(),
    };

    const { data, error } = await supabase
      .from('countries')
      .insert(newCountry)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Create country error:', error);
    res.status(500).json({ error: error.message || 'Failed to create country' });
  }
});

// Update country (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, flag, code } = req.body;

    console.log('Updating country with data:', { id, name, flag, code });

    const { data: existing } = await supabase
      .from('countries')
      .select('id, name, flag, code')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Country not found' });
    }

    // Build updates object - always update all fields (use provided or existing)
    const updates: any = {};
    
    // Name - use provided value or retain existing
    if (name !== undefined && name !== null && name.trim()) {
      updates.name = name.trim();
    } else if (name !== undefined) {
      // Empty string provided, use existing
      updates.name = existing.name;
    } else {
      // Not provided, use existing
      updates.name = existing.name;
    }
    
    // Flag - use provided value or retain existing
    if (flag !== undefined && flag !== null && flag.trim()) {
      updates.flag = flag.trim();
    } else if (flag !== undefined) {
      // Empty string provided, use existing
      updates.flag = existing.flag;
    } else {
      // Not provided, use existing
      updates.flag = existing.flag;
    }
    
    // Code - use provided value or retain existing
    if (code !== undefined && code !== null && code.trim()) {
      updates.code = code.toUpperCase().trim();
    } else if (code !== undefined) {
      // Empty string provided, use existing
      updates.code = existing.code;
    } else {
      // Not provided, use existing
      updates.code = existing.code;
    }

    console.log('Request body:', { name, flag, code });
    console.log('Existing country:', existing);
    console.log('Applying updates:', updates);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('countries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    console.log('Country updated successfully:', data);
    res.json(data);
  } catch (error: any) {
    console.error('Update country error:', error);
    res.status(500).json({ error: error.message || 'Failed to update country' });
  }
});

// Delete country (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('countries')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Country not found' });
    }

    const { error } = await supabase
      .from('countries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Country deleted successfully' });
  } catch (error: any) {
    console.error('Delete country error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete country' });
  }
});

// Get elections for a country
router.get('/:id/elections', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('country_id', id)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get country elections error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch elections' });
  }
});

export default router;
