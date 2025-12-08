import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all elections
router.get('/', async (req, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get elections error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch elections' });
  }
});

// Get election by ID
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Election not found' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Get election error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch election' });
  }
});

// Create election (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { countryId, type, date, status, description } = req.body;

    if (!countryId || !type || !date || !description) {
      return res.status(400).json({ error: 'Country ID, type, date, and description are required' });
    }

    const electionId = `e${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newElection = {
      id: electionId,
      country_id: countryId,
      type,
      date,
      status: status || 'upcoming',
      description,
    };

    const { data, error } = await supabase
      .from('elections')
      .insert(newElection)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Create election error:', error);
    res.status(500).json({ error: error.message || 'Failed to create election' });
  }
});

// Update election (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { countryId, type, date, status, description } = req.body;

    const { data: existing } = await supabase
      .from('elections')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const updates: any = {};
    if (countryId) updates.country_id = countryId;
    if (type) updates.type = type;
    if (date) updates.date = date;
    if (status) updates.status = status;
    if (description) updates.description = description;

    const { data, error } = await supabase
      .from('elections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Update election error:', error);
    res.status(500).json({ error: error.message || 'Failed to update election' });
  }
});

// Delete election (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('elections')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const { error } = await supabase
      .from('elections')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Election deleted successfully' });
  } catch (error: any) {
    console.error('Delete election error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete election' });
  }
});

// Get vote statistics for an election
router.get('/:id/stats', async (req, res: Response) => {
  try {
    const { id } = req.params;

    // Get candidates for this election
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', id);

    if (candidatesError) throw candidatesError;

    // Get vote counts for each candidate
    const stats = await Promise.all(
      (candidates || []).map(async (candidate) => {
        const { count, error: votesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', candidate.id);

        if (votesError) throw votesError;

        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          party: candidate.party,
          color: candidate.color,
          votes: count || 0,
        };
      })
    );

    const totalVotes = stats.reduce((sum, stat) => sum + stat.votes, 0);

    const statsWithPercentage = stats.map(stat => ({
      ...stat,
      percentage: totalVotes > 0 ? (stat.votes / totalVotes) * 100 : 0,
    }));

    res.json(statsWithPercentage);
  } catch (error: any) {
    console.error('Get election stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch election statistics' });
  }
});

export default router;
