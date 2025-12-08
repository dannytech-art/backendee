import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all news
router.get('/', async (req, res: Response) => {
  try {
    const { countryId, priority } = req.query;
    
    let query = supabase.from('news').select('*');
    
    if (countryId) {
      query = query.eq('country_id', countryId as string);
    }
    
    if (priority) {
      query = query.eq('priority', priority as string);
    }

    const { data: newsList, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    // Fetch tags and hashtags for each news item
    const newsWithMetadata = await Promise.all(
      (newsList || []).map(async (item) => {
        const { data: tags } = await supabase
          .from('news_tags')
          .select('tag')
          .eq('news_id', item.id);
        
        const { data: hashtags } = await supabase
          .from('news_hashtags')
          .select('hashtag')
          .eq('news_id', item.id);

        return {
          ...item,
          tags: (tags || []).map(t => t.tag),
          hashtags: (hashtags || []).map(h => h.hashtag),
        };
      })
    );

    res.json(newsWithMetadata);
  } catch (error: any) {
    console.error('Get news error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch news' });
  }
});

// Get news by ID
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { data: newsItem, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !newsItem) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Fetch tags and hashtags
    const { data: tags } = await supabase
      .from('news_tags')
      .select('tag')
      .eq('news_id', id);
    
    const { data: hashtags } = await supabase
      .from('news_hashtags')
      .select('hashtag')
      .eq('news_id', id);

    res.json({
      ...newsItem,
      tags: (tags || []).map(t => t.tag),
      hashtags: (hashtags || []).map(h => h.hashtag),
    });
  } catch (error: any) {
    console.error('Get news error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch news' });
  }
});

// Create news (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { countryId, electionId, title, content, image, priority, tags, hashtags } = req.body;

    if (!countryId || !title || !content) {
      return res.status(400).json({ error: 'Country ID, title, and content are required' });
    }

    // Verify country exists
    const { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('id', countryId)
      .single();

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    const newsId = `n${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNews = {
      id: newsId,
      country_id: countryId,
      election_id: electionId || null,
      title,
      content,
      image: image || null,
      priority: priority || 'general',
    };

    const { data, error } = await supabase
      .from('news')
      .insert(newNews)
      .select()
      .single();

    if (error) throw error;

    // Insert tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await supabase.from('news_tags').insert(
        tags.map((tag: string) => ({ news_id: newsId, tag }))
      );
    }

    // Insert hashtags
    if (hashtags && Array.isArray(hashtags) && hashtags.length > 0) {
      await supabase.from('news_hashtags').insert(
        hashtags.map((hashtag: string) => ({ news_id: newsId, hashtag }))
      );
    }

    res.status(201).json({
      ...data,
      tags: tags || [],
      hashtags: hashtags || [],
    });
  } catch (error: any) {
    console.error('Create news error:', error);
    res.status(500).json({ error: error.message || 'Failed to create news' });
  }
});

// Update news (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { countryId, electionId, title, content, image, priority, tags, hashtags } = req.body;

    const { data: existing } = await supabase
      .from('news')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'News not found' });
    }

    const updates: any = {};
    if (countryId) updates.country_id = countryId;
    if (electionId !== undefined) updates.election_id = electionId;
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (image !== undefined) updates.image = image;
    if (priority) updates.priority = priority;

    const { data, error } = await supabase
      .from('news')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update tags
    if (tags && Array.isArray(tags)) {
      await supabase.from('news_tags').delete().eq('news_id', id);
      if (tags.length > 0) {
        await supabase.from('news_tags').insert(
          tags.map((tag: string) => ({ news_id: id, tag }))
        );
      }
    }

    // Update hashtags
    if (hashtags && Array.isArray(hashtags)) {
      await supabase.from('news_hashtags').delete().eq('news_id', id);
      if (hashtags.length > 0) {
        await supabase.from('news_hashtags').insert(
          hashtags.map((hashtag: string) => ({ news_id: id, hashtag }))
        );
      }
    }

    const { data: updatedTags } = await supabase
      .from('news_tags')
      .select('tag')
      .eq('news_id', id);
    
    const { data: updatedHashtags } = await supabase
      .from('news_hashtags')
      .select('hashtag')
      .eq('news_id', id);

    res.json({
      ...data,
      tags: (updatedTags || []).map(t => t.tag),
      hashtags: (updatedHashtags || []).map(h => h.hashtag),
    });
  } catch (error: any) {
    console.error('Update news error:', error);
    res.status(500).json({ error: error.message || 'Failed to update news' });
  }
});

// Delete news (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('news')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'News not found' });
    }

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'News deleted successfully' });
  } catch (error: any) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete news' });
  }
});

export default router;
