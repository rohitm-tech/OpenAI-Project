import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'developer';
  content: string;
  type: 'text' | 'image' | 'audio';
  metadata?: {
    imageUrl?: string;
    audioUrl?: string;
    fileId?: string;
  };
  timestamp: Date;
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'developer'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'audio'],
      default: 'text',
    },
    metadata: {
      imageUrl: String,
      audioUrl: String,
      fileId: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Conversation',
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    model: {
      type: String,
      default: 'gpt-4o',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ConversationSchema.index({ userId: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
