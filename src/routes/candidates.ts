import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all candidates
router.get('/', async (req, res: Response) => {
  try {
    const { electionId } = req.query;
    
    let query = supabase.from('candidates').select('*');
    
    if (electionId) {
      query = query.eq('election_id', electionId as string);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Get candidate error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch candidate' });
  }
});

// Create candidate (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { electionId, name, party, image, bio, color } = req.body;
    
    console.log('Creating candidate with data:', { electionId, name, party, color });

    if (!electionId || !name || !party || !color) {
      return res.status(400).json({ error: 'Election ID, name, party, and color are required' });
    }

    // Verify election exists
    const { data: election } = await supabase
      .from('elections')
      .select('id')
      .eq('id', electionId)
      .single();

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Validate field lengths
    if (name && name.length > 500) {
      return res.status(400).json({ error: 'Name must be 500 characters or less' });
    }
    if (party && party.length > 500) {
      return res.status(400).json({ error: 'Party must be 500 characters or less' });
    }
    if (image && image.length > 2000) {
      return res.status(400).json({ error: 'Image URL must be 2000 characters or less' });
    }

    const candidateId = `c${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCandidate = {
      id: candidateId,
      election_id: electionId,
      name: name.trim(),
      party: party.trim(),
      image: image ? image.trim() : null,
      bio: bio ? bio.trim() : null,
      color,
    };

    const { data, error } = await supabase
      .from('candidates')
      .insert(newCandidate)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Create candidate error:', error);
    res.status(500).json({ error: error.message || 'Failed to create candidate' });
  }
});

// Update candidate (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { electionId, name, party, image, bio, color } = req.body;

    console.log('Updating candidate with data:', { id, electionId, name, party, color, image: image ? `${image.substring(0, 50)}...` : 'none' });

    // Get existing candidate data to retain values if not provided
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Validate required fields for update
    if (electionId) {
      const { data: election } = await supabase
        .from('elections')
        .select('id')
        .eq('id', electionId)
        .single();

      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
    }

    // Validate field lengths only if provided and not empty
    if (name !== undefined && name !== null && name.trim()) {
      if (name.trim().length > 500) {
        return res.status(400).json({ error: 'Name must be 500 characters or less' });
      }
    }
    if (party !== undefined && party !== null && party.trim()) {
      if (party.trim().length > 500) {
        return res.status(400).json({ error: 'Party must be 500 characters or less' });
      }
    }
    // Only validate image length if a NEW image is provided (not empty and different from existing)
    if (image !== undefined && image !== null) {
      const imageStr = typeof image === 'string' ? image.trim() : String(image).trim();
      const existingImageStr = existingCandidate.image ? String(existingCandidate.image).trim() : '';
      
      console.log('Image validation check:', {
        provided: imageStr.substring(0, 50) + '...',
        existing: existingImageStr.substring(0, 50) + '...',
        providedLength: imageStr.length,
        isSame: imageStr === existingImageStr,
        isEmpty: imageStr.length === 0
      });
      
      // Only validate if:
      // 1. Image is not empty
      // 2. Image is different from existing
      // 3. Image is actually a new value (not just whitespace differences)
      if (imageStr.length > 0 && imageStr !== existingImageStr) {
        // Base64 data URLs can be very long, so we allow up to 1MB (approximately 1,333,333 chars for base64)
        // But for regular URLs, we keep the 2000 char limit
        const isDataUrl = imageStr.startsWith('data:image/');
        const maxLength = isDataUrl ? 1500000 : 2000; // 1.5MB for base64, 2000 for URLs
        
        if (imageStr.length > maxLength) {
          console.error('Image URL too long:', imageStr.length, 'characters', isDataUrl ? '(base64)' : '(URL)');
          return res.status(400).json({ 
            error: isDataUrl 
              ? 'Image is too large. Please use a smaller image file.' 
              : 'Image URL must be 2000 characters or less' 
          });
        }
        console.log('Image validation passed - new image provided', isDataUrl ? '(base64)' : '(URL)', imageStr.length, 'chars');
      } else {
        console.log('Image validation skipped - same as existing or empty');
      }
    } else {
      console.log('Image validation skipped - not provided');
    }

    // Build updates - use provided values, retain existing if not provided
    const updates: any = {};
    
    // Election ID
    if (electionId !== undefined && electionId !== null) {
      updates.election_id = electionId;
    } else {
      updates.election_id = existingCandidate.election_id;
    }
    
    // Name - use provided value or retain existing
    if (name !== undefined && name !== null) {
      updates.name = name.trim() || existingCandidate.name;
    } else {
      updates.name = existingCandidate.name;
    }
    
    // Party - use provided value or retain existing
    if (party !== undefined && party !== null) {
      updates.party = party.trim() || existingCandidate.party;
    } else {
      updates.party = existingCandidate.party;
    }
    
    // Image - if provided (even if empty), use it; otherwise retain existing
    if (image !== undefined) {
      if (image === null || image === '' || (typeof image === 'string' && !image.trim())) {
        updates.image = existingCandidate.image; // Keep existing if empty
      } else {
        updates.image = typeof image === 'string' ? image.trim() : image;
      }
    } else {
      updates.image = existingCandidate.image; // Not provided, keep existing
    }
    
    // Bio - use provided value or retain existing
    if (bio !== undefined) {
      updates.bio = bio && bio.trim() ? bio.trim() : (bio === null ? null : existingCandidate.bio);
    } else {
      updates.bio = existingCandidate.bio;
    }
    
    // Color - use provided value or retain existing
    if (color !== undefined && color !== null) {
      updates.color = color;
    } else {
      updates.color = existingCandidate.color;
    }
    
    console.log('Final updates object:', updates);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Candidate updated successfully:', data);
    res.json(data);
  } catch (error: any) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: error.message || 'Failed to update candidate' });
  }
});

// Delete candidate (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error: any) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete candidate' });
  }
});

export default router;
