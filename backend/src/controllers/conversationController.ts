import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { title, model } = req.body;

    const conversation = new Conversation({
      userId: req.userId,
      title: title || 'New Conversation',
      model: model || 'gpt-5',
      messages: [],
    });

    await conversation.save();

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    
    let conversations;
    
    if (search && typeof search === 'string' && search.trim()) {
      // Search conversations by title or message content
      const searchRegex = new RegExp(search.trim(), 'i');
      
      // First, find conversations matching the title
      const conversationsByTitle = await Conversation.find({
        userId: req.userId,
        title: { $regex: searchRegex },
      })
        .select('_id')
        .lean();
      
      const conversationIdsByTitle = conversationsByTitle.map((c) => c._id);
      
      // Find conversations with messages matching the search
      const messages = await Message.find({
        content: { $regex: searchRegex },
      })
        .select('conversationId')
        .lean();
      
      const conversationIdsByMessage = messages.map((m) => m.conversationId);
      
      // Combine both sets of conversation IDs
      const allConversationIds = [...new Set([...conversationIdsByTitle, ...conversationIdsByMessage])];
      
      // Get all matching conversations that belong to the user
      conversations = await Conversation.find({
        userId: req.userId,
        _id: { $in: allConversationIds },
      })
        .sort({ updatedAt: -1 })
        .select('title createdAt updatedAt model')
        .limit(50);
    } else {
      // No search query, return all conversations
      conversations = await Conversation.find({
        userId: req.userId,
      })
        .sort({ updatedAt: -1 })
        .select('title createdAt updatedAt model')
        .limit(50);
    }

    // Get message counts and search previews for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const messageCount = await Message.countDocuments({
          conversationId: conv._id,
        });
        
        let searchPreview = null;
        if (search && typeof search === 'string' && search.trim()) {
          // Find the first message that matches the search
          const matchingMessage = await Message.findOne({
            conversationId: conv._id,
            content: { $regex: new RegExp(search.trim(), 'i') },
          })
            .sort({ createdAt: 1 })
            .select('content role')
            .lean();
          
          if (matchingMessage) {
            // Create a preview snippet (first 100 chars around the match)
            const content = matchingMessage.content;
            const searchLower = search.trim().toLowerCase();
            const contentLower = content.toLowerCase();
            const matchIndex = contentLower.indexOf(searchLower);
            
            if (matchIndex !== -1) {
              const start = Math.max(0, matchIndex - 30);
              const end = Math.min(content.length, matchIndex + search.length + 70);
              let preview = content.substring(start, end);
              
              if (start > 0) preview = '...' + preview;
              if (end < content.length) preview = preview + '...';
              
              searchPreview = {
                content: preview,
                role: matchingMessage.role,
              };
            } else {
              // Fallback: just show first 100 chars
              searchPreview = {
                content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                role: matchingMessage.role,
              };
            }
          }
        }
        
        return {
          ...conv.toObject(),
          messageCount,
          searchPreview,
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithCounts,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Get all messages for this conversation
    const messages = await Message.find({
      conversationId: id,
    })
      .sort({ createdAt: 1 })
      .select('role content type metadata createdAt')
      .lean();

    res.json({
      success: true,
      data: {
        ...conversation.toObject(),
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          type: msg.type,
          metadata: msg.metadata,
          timestamp: msg.createdAt,
        })),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { title },
      { new: true }
    );

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Delete all messages associated with this conversation
    await Message.deleteMany({ conversationId: id });

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const addMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, content, type, metadata } = req.body;

    const conversation = await Conversation.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Create message in Message collection
    const message = new Message({
      conversationId: id,
      role,
      content,
      type: type || 'text',
      metadata,
    });

    await message.save();

    // Auto-generate title from first user message if still default
    if (conversation.title === 'New Conversation' && role === 'user') {
      conversation.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await conversation.save();
    }

    // Update conversation's updatedAt timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      data: {
        ...conversation.toObject(),
        messages: [{
          role: message.role,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          timestamp: message.createdAt,
        }],
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const addMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { messages } = req.body;

    const conversation = await Conversation.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Create messages in Message collection
    const newMessages = messages.map((msg: any) => ({
      conversationId: id,
      role: msg.role,
      content: msg.content,
      type: msg.type || 'text',
      metadata: msg.metadata,
    }));

    const savedMessages = await Message.insertMany(newMessages);

    // Auto-generate title from first user message if still default
    if (conversation.title === 'New Conversation') {
      const firstUserMsg = messages.find((m: any) => m.role === 'user');
      if (firstUserMsg) {
        conversation.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        await conversation.save();
      }
    }

    // Update conversation's updatedAt timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      data: {
        ...conversation.toObject(),
        messages: savedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          type: msg.type,
          metadata: msg.metadata,
          timestamp: msg.createdAt,
        })),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
