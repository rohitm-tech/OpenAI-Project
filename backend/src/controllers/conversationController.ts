import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Conversation } from '../models/Conversation';

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
    const conversations = await Conversation.find({
      userId: req.userId,
    })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt model messages')
      .limit(50);

    res.json({
      success: true,
      data: conversations,
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

    const message = {
      role,
      content,
      type: type || 'text',
      metadata,
      timestamp: new Date(),
    };

    conversation.messages.push(message);

    // Auto-generate title from first user message if still default
    if (conversation.title === 'New Conversation' && role === 'user') {
      conversation.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

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

    const newMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      type: msg.type || 'text',
      metadata: msg.metadata,
      timestamp: new Date(),
    }));

    conversation.messages.push(...newMessages);

    // Auto-generate title from first user message if still default
    if (conversation.title === 'New Conversation') {
      const firstUserMsg = newMessages.find((m: any) => m.role === 'user');
      if (firstUserMsg) {
        conversation.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
      }
    }

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
