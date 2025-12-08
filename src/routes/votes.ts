import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Cast a vote
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { electionId, candidateId } = req.body;
    const userId = req.userId!;

    if (!electionId || !candidateId) {
      return res.status(400).json({ error: 'Election ID and candidate ID are required' });
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

    // Verify candidate exists and belongs to election
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', candidateId)
      .eq('election_id', electionId)
      .single();

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found for this election' });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('election_id', electionId)
      .single();

    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted in this election' });
    }

    // Create vote
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newVote = {
      id: voteId,
      user_id: userId,
      election_id: electionId,
      candidate_id: candidateId,
    };

    const { data, error } = await supabase
      .from('votes')
      .insert(newVote)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Cast vote error:', error);
    res.status(500).json({ error: error.message || 'Failed to cast vote' });
  }
});

// Check if user has voted
router.get('/check/:electionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { electionId } = req.params;
    const userId = req.userId!;

    const { data: vote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('election_id', electionId)
      .single();

    res.json({ hasVoted: !!vote, vote: vote || null });
  } catch (error: any) {
    console.error('Check vote error:', error);
    res.status(500).json({ error: error.message || 'Failed to check vote status' });
  }
});

// Get user's votes
router.get('/user', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get user votes error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch votes' });
  }
});

// Get total vote count (Admin only)
router.get('/stats/total', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    res.json({ totalVotes: count || 0 });
  } catch (error: any) {
    console.error('Get total votes error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch vote count' });
  }
});

// Get all votes (Admin only) - for analytics
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data: votes, error } = await supabase
      .from('votes')
      .select(`
        *,
        users!votes_user_id_fkey(id, name),
        candidates!votes_candidate_id_fkey(id, name),
        elections!votes_election_id_fkey(id, description)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    res.json((votes || []).map((vote: any) => ({
      id: vote.id,
      userId: vote.user_id,
      userName: vote.users?.name || 'Unknown',
      electionId: vote.election_id,
      electionDescription: vote.elections?.description || 'Unknown',
      candidateId: vote.candidate_id,
      candidateName: vote.candidates?.name || 'Unknown',
      timestamp: vote.timestamp,
    })));
  } catch (error: any) {
    console.error('Get all votes error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch votes' });
  }
});

export default router;
