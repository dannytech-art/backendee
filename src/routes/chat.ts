import { Router, Response } from 'express';
import { supabase } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all chat rooms
router.get('/rooms', async (req, res: Response) => {
  try {
    const { type, entityId } = req.query;
    
    let query = supabase.from('chat_rooms').select('*');
    
    if (type) {
      query = query.eq('type', type as string);
    }
    
    if (entityId) {
      query = query.eq('entity_id', entityId as string);
    }

    const { data: rooms, error } = await query;

    if (error) throw error;

    // Fetch moderators for each room
    const roomsWithModerators = await Promise.all(
      (rooms || []).map(async (room) => {
        const { data: moderators } = await supabase
          .from('chat_moderators')
          .select('user_id')
          .eq('room_id', room.id);

        return {
          ...room,
          moderators: (moderators || []).map(m => m.user_id),
        };
      })
    );

    res.json(roomsWithModerators);
  } catch (error: any) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat rooms' });
  }
});

// Get chat room by ID
router.get('/rooms/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const { data: moderators } = await supabase
      .from('chat_moderators')
      .select('user_id')
      .eq('room_id', id);

    res.json({
      ...room,
      moderators: (moderators || []).map(m => m.user_id),
    });
  } catch (error: any) {
    console.error('Get chat room error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat room' });
  }
});

// Create chat room (Admin only)
router.post('/rooms', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { type, entityId, name, description, moderators } = req.body;

    if (!type || !entityId || !name) {
      return res.status(400).json({ error: 'Type, entity ID, and name are required' });
    }

    const roomId = `${type}_${entityId}`;
    
    // Check if room already exists
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (existingRoom) {
      return res.status(400).json({ error: 'Chat room already exists' });
    }

    const newRoom = {
      id: roomId,
      type,
      entity_id: entityId,
      name,
      description: description || null,
      active_users: 0,
    };

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert(newRoom)
      .select()
      .single();

    if (error) throw error;

    // Add moderators if provided
    if (moderators && Array.isArray(moderators) && moderators.length > 0) {
      await supabase.from('chat_moderators').insert(
        moderators.map((userId: string) => ({ room_id: roomId, user_id: userId }))
      );
    }

    res.status(201).json({
      ...data,
      moderators: moderators || [],
    });
  } catch (error: any) {
    console.error('Create chat room error:', error);
    res.status(500).json({ error: error.message || 'Failed to create chat room' });
  }
});

// Update chat room (Admin only)
router.put('/rooms/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, moderators } = req.body;

    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('chat_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update moderators
    if (moderators && Array.isArray(moderators)) {
      await supabase.from('chat_moderators').delete().eq('room_id', id);
      if (moderators.length > 0) {
        await supabase.from('chat_moderators').insert(
          moderators.map((userId: string) => ({ room_id: id, user_id: userId }))
        );
      }
    }

    const { data: updatedModerators } = await supabase
      .from('chat_moderators')
      .select('user_id')
      .eq('room_id', id);

    res.json({
      ...data,
      moderators: (updatedModerators || []).map(m => m.user_id),
    });
  } catch (error: any) {
    console.error('Update chat room error:', error);
    res.status(500).json({ error: error.message || 'Failed to update chat room' });
  }
});

// Delete chat room (Admin only)
router.delete('/rooms/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Chat room deleted successfully' });
  } catch (error: any) {
    console.error('Delete chat room error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete chat room' });
  }
});

// Get messages for a room
router.get('/rooms/:roomId/messages', async (req, res: Response) => {
  try {
    const { roomId } = req.params;
    const { limit = '50' } = req.query;

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users!chat_messages_user_id_fkey(id, name, avatar)
      `)
      .eq('room_id', roomId)
      .eq('deleted', false)
      .order('timestamp', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json((messages || []).map((message: any) => ({
      ...message,
      user_name: message.users?.name || 'Unknown',
      user_avatar: message.users?.avatar,
      reactions: {}, // Reactions would need a separate table
    })));
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

// Send message
router.post('/rooms/:roomId/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.userId!;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Verify room exists
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage = {
      id: messageId,
      room_id: roomId,
      user_id: userId,
      content,
      flagged: false,
      deleted: false,
      is_pinned: false,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(newMessage)
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
      reactions: {},
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// Update message (Owner or Admin)
router.put('/messages/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, flagged, deleted, isPinned } = req.body;
    const userId = req.userId!;
    const isAdmin = req.isAdmin!;

    const { data: message } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updates: any = {};
    if (content && message.user_id === userId) updates.content = content;
    if (flagged !== undefined && isAdmin) updates.flagged = flagged;
    if (deleted !== undefined && (message.user_id === userId || isAdmin)) updates.deleted = deleted;
    if (isPinned !== undefined && isAdmin) updates.is_pinned = isPinned;

    const { data, error } = await supabase
      .from('chat_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Update message error:', error);
    res.status(500).json({ error: error.message || 'Failed to update message' });
  }
});

// Delete message (Owner or Admin)
router.delete('/messages/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const isAdmin = req.isAdmin!;

    const { data: message } = await supabase
      .from('chat_messages')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only owner or admin can delete
    if (message.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete message' });
  }
});

// Get flagged messages (Admin only)
router.get('/messages/flagged', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users!chat_messages_user_id_fkey(id, name, avatar)
      `)
      .eq('flagged', true)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    res.json((messages || []).map((message: any) => ({
      ...message,
      user_name: message.users?.name || 'Unknown',
      user_avatar: message.users?.avatar,
    })));
  } catch (error: any) {
    console.error('Get flagged messages error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch flagged messages' });
  }
});

export default router;
