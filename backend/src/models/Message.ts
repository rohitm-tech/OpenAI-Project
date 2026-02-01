import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'developer';
  content: string;
  type: 'text' | 'image' | 'audio' | 'generated-image';
  metadata?: {
    imageUrl?: string;
    audioUrl?: string;
    fileId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
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
      enum: ['text', 'image', 'audio', 'generated-image'],
      default: 'text',
    },
    metadata: {
      imageUrl: String,
      audioUrl: String,
      fileId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
