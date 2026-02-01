import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

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
