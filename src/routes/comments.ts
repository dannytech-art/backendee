import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get comments for news
router.get('/news/:newsId', async (req, res: Response) => {
  try {
    const { newsId } = req.params;
    const { includeReplies = 'true' } = req.query;

    // Get top-level comments
    const { data: topLevelComments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey(id, name, avatar)
      `)
      .eq('news_id', newsId)
      .is('parent_comment_id', null)
      .order('timestamp', { ascending: false });

    if (commentsError) throw commentsError;

    // Get likes and reactions for each comment
    const commentsWithMetadata = await Promise.all(
      (topLevelComments || []).map(async (comment: any) => {
        const user = comment.users || {};
        
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('user_id')
          .eq('comment_id', comment.id);

        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('user_id, emoji')
          .eq('comment_id', comment.id);

        const reactionsMap: Record<string, string[]> = {};
        (reactions || []).forEach((reaction: any) => {
          if (!reactionsMap[reaction.emoji]) {
            reactionsMap[reaction.emoji] = [];
          }
          reactionsMap[reaction.emoji].push(reaction.user_id);
        });

        let replies: any[] = [];
        if (includeReplies === 'true') {
          const { data: replyList } = await supabase
            .from('comments')
            .select(`
              *,
              users!comments_user_id_fkey(id, name, avatar)
            `)
            .eq('parent_comment_id', comment.id)
            .order('timestamp', { ascending: false });

          replies = await Promise.all(
            (replyList || []).map(async (reply: any) => {
              const replyUser = reply.users || {};
              const { data: replyLikes } = await supabase
                .from('comment_likes')
                .select('user_id')
                .eq('comment_id', reply.id);

              const { data: replyReactions } = await supabase
                .from('comment_reactions')
                .select('user_id, emoji')
                .eq('comment_id', reply.id);

              const replyReactionsMap: Record<string, string[]> = {};
              (replyReactions || []).forEach((reaction: any) => {
                if (!replyReactionsMap[reaction.emoji]) {
                  replyReactionsMap[reaction.emoji] = [];
                }
                replyReactionsMap[reaction.emoji].push(reaction.user_id);
              });

              return {
                ...reply,
                user_name: replyUser.name || 'Unknown',
                user_avatar: replyUser.avatar,
                liked_by: (replyLikes || []).map((l: any) => l.user_id),
                reactions: replyReactionsMap,
                replies: [],
              };
            })
          );
        }

        return {
          ...comment,
          user_name: user.name || 'Unknown',
          user_avatar: user.avatar,
          liked_by: (likes || []).map((l: any) => l.user_id),
          reactions: reactionsMap,
          replies,
        };
      })
    );

    res.json(commentsWithMetadata);
  } catch (error: any) {
    console.error('Get news comments error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch comments' });
  }
});

// Get comments for an election
router.get('/election/:electionId', async (req, res: Response) => {
  try {
    const { electionId } = req.params;
    const { includeReplies = 'true' } = req.query;

    // Get top-level comments
    const { data: topLevelComments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey(id, name, avatar)
      `)
      .eq('election_id', electionId)
      .is('parent_comment_id', null)
      .order('timestamp', { ascending: false });

    if (commentsError) throw commentsError;

    // Get likes and reactions for each comment
    const commentsWithMetadata = await Promise.all(
      (topLevelComments || []).map(async (comment: any) => {
        const user = comment.users || {};
        
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('user_id')
          .eq('comment_id', comment.id);

        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('user_id, emoji')
          .eq('comment_id', comment.id);

        const reactionsMap: Record<string, string[]> = {};
        (reactions || []).forEach((reaction: any) => {
          if (!reactionsMap[reaction.emoji]) {
            reactionsMap[reaction.emoji] = [];
          }
          reactionsMap[reaction.emoji].push(reaction.user_id);
        });

        let replies: any[] = [];
        if (includeReplies === 'true') {
          const { data: replyList } = await supabase
            .from('comments')
            .select(`
              *,
              users!comments_user_id_fkey(id, name, avatar)
            `)
            .eq('parent_comment_id', comment.id)
            .order('timestamp', { ascending: false });

          replies = await Promise.all(
            (replyList || []).map(async (reply: any) => {
              const replyUser = reply.users || {};
              
              const { data: replyLikes } = await supabase
                .from('comment_likes')
                .select('user_id')
                .eq('comment_id', reply.id);

              const { data: replyReactions } = await supabase
                .from('comment_reactions')
                .select('user_id, emoji')
                .eq('comment_id', reply.id);

              const replyReactionsMap: Record<string, string[]> = {};
              (replyReactions || []).forEach((reaction: any) => {
                if (!replyReactionsMap[reaction.emoji]) {
                  replyReactionsMap[reaction.emoji] = [];
                }
                replyReactionsMap[reaction.emoji].push(reaction.user_id);
              });

              return {
                ...reply,
                user_name: replyUser.name || 'Unknown',
                user_avatar: replyUser.avatar,
                liked_by: (replyLikes || []).map((l: any) => l.user_id),
                reactions: replyReactionsMap,
                replies: [],
              };
            })
          );
        }

        return {
          ...comment,
          user_name: user.name || 'Unknown',
          user_avatar: user.avatar,
          liked_by: (likes || []).map((l: any) => l.user_id),
          reactions: reactionsMap,
          replies,
        };
      })
    );

    res.json(commentsWithMetadata);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { electionId, newsId, parentCommentId, content } = req.body;
    const userId = req.userId!;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Must have either electionId or newsId
    if (!electionId && !newsId) {
      return res.status(400).json({ error: 'Either Election ID or News ID is required' });
    }

    // Verify election exists if provided
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

    // Verify news exists if provided
    if (newsId) {
      const { data: news } = await supabase
        .from('news')
        .select('id')
        .eq('id', newsId)
        .single();

      if (!news) {
        return res.status(404).json({ error: 'News not found' });
      }
    }

    const commentId = `cm${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newComment = {
      id: commentId,
      election_id: electionId || null,
      news_id: newsId || null,
      user_id: userId,
      parent_comment_id: parentCommentId || null,
      content: content.trim(),
      likes: 0,
      flagged: false,
      approved: true,
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(newComment)
      .select()
      .single();

    if (error) throw error;

    // Fetch user info
    const { data: user } = await supabase
      .from('users')
      .select('name, avatar')
      .eq('id', userId)
      .single();

    res.status(201).json({
      ...data,
      user_name: user?.name || 'Unknown',
      user_avatar: user?.avatar,
      liked_by: [],
      reactions: {},
      replies: [],
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: error.message || 'Failed to create comment' });
  }
});

// Like/Unlike comment
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', id)
        .eq('user_id', userId);
      
      // Decrement likes count
      const { data: comment } = await supabase
        .from('comments')
        .select('likes')
        .eq('id', id)
        .single();
      
      if (comment) {
        await supabase
          .from('comments')
          .update({ likes: Math.max(0, comment.likes - 1) })
          .eq('id', id);
      }
    } else {
      // Like
      await supabase
        .from('comment_likes')
        .insert({ comment_id: id, user_id: userId });
      
      // Increment likes count
      const { data: comment } = await supabase
        .from('comments')
        .select('likes')
        .eq('id', id)
        .single();
      
      if (comment) {
        await supabase
          .from('comments')
          .update({ likes: comment.likes + 1 })
          .eq('id', id);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: error.message || 'Failed to like comment' });
  }
});

// Add reaction to comment
router.post('/:id/reaction', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.userId!;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Check if reaction exists
    const { data: existingReaction } = await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', id)
        .eq('user_id', userId)
        .eq('emoji', emoji);
    } else {
      // Add reaction
      await supabase
        .from('comment_reactions')
        .insert({ comment_id: id, user_id: userId, emoji });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: error.message || 'Failed to add reaction' });
  }
});

// Update comment (Admin or owner)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, approved, flagged } = req.body;
    const userId = req.userId!;
    const isAdmin = req.isAdmin!;

    const { data: comment } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only owner or admin can update
    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates: any = {};
    if (content && comment.user_id === userId) updates.content = content;
    if (approved !== undefined && isAdmin) updates.approved = approved;
    if (flagged !== undefined && isAdmin) updates.flagged = flagged;

    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: error.message || 'Failed to update comment' });
  }
});

// Delete comment (Admin or owner)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const isAdmin = req.isAdmin!;

    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only owner or admin can delete
    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete comment' });
  }
});

// Get all comments for moderation (Admin only)
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { filter } = req.query;

    let query = supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey(id, name, avatar)
      `);

    if (filter === 'pending') {
      query = query.eq('approved', false);
    } else if (filter === 'approved') {
      query = query.eq('approved', true);
    } else if (filter === 'flagged') {
      query = query.eq('flagged', true);
    }

    const { data: commentsList, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    res.json((commentsList || []).map((comment: any) => ({
      ...comment,
      user_name: comment.users?.name || 'Unknown',
      user_avatar: comment.users?.avatar,
    })));
  } catch (error: any) {
    console.error('Get all comments error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch comments' });
  }
});

// Get comment stats (Admin only)
router.get('/admin/stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get total comments
    const { count: totalCount, error: totalError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get pending comments (not approved)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false);

    if (pendingError) throw pendingError;

    res.json({
      totalComments: totalCount || 0,
      pendingComments: pendingCount || 0,
    });
  } catch (error: any) {
    console.error('Get comment stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch comment stats' });
  }
});

// Get recent activity (Admin only)
router.get('/admin/activity', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent votes
    const { data: recentVotes, error: votesError } = await supabase
      .from('votes')
      .select(`
        id,
        timestamp,
        users!votes_user_id_fkey(name),
        candidates!votes_candidate_id_fkey(name),
        elections!votes_election_id_fkey(description)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (votesError) throw votesError;

    // Get recent comments
    const { data: recentComments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        timestamp,
        content,
        users!comments_user_id_fkey(name),
        elections!comments_election_id_fkey(description)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (commentsError) throw commentsError;

    // Get recent news
    const { data: recentNews, error: newsError } = await supabase
      .from('news')
      .select('id, title, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (newsError) throw newsError;

    // Combine and sort by timestamp
    const activities: any[] = [
      ...(recentVotes || []).map((vote: any) => ({
        type: 'vote',
        id: vote.id,
        timestamp: vote.timestamp,
        message: `${vote.users?.name || 'User'} cast a vote for ${vote.candidates?.name || 'candidate'} in ${vote.elections?.description || 'election'}`,
        user: vote.users?.name,
      })),
      ...(recentComments || []).map((comment: any) => ({
        type: 'comment',
        id: comment.id,
        timestamp: comment.timestamp,
        message: `${comment.users?.name || 'User'} posted a comment on ${comment.elections?.description || 'election'}`,
        user: comment.users?.name,
        content: comment.content.substring(0, 100),
      })),
      ...(recentNews || []).map((news: any) => ({
        type: 'news',
        id: news.id,
        timestamp: news.timestamp,
        message: `News article published: ${news.title}`,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);

    res.json(activities);
  } catch (error: any) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch recent activity' });
  }
});

export default router;
