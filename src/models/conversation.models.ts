import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  unreadCount: Map<string, number>; // userId -> count
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationModel extends Model<IConversation> {
  findOrCreate(userId1: string, userId2: string): Promise<IConversation>;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      content: {
        type: String,
      },
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
      },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only 2 participants (one-on-one chat)
ConversationSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Conversation must have exactly 2 participants"));
  }
  next();
});

// Create index for finding conversations by participants
ConversationSchema.index({ participants: 1 });

// Static method to find or create conversation
ConversationSchema.statics.findOrCreate = async function (
  userId1: string,
  userId2: string
) {
  // Find existing conversation
  let conversation = await this.findOne({
    participants: { $all: [userId1, userId2] },
  }).populate("participants", "name email avatar");

  // Create new conversation if doesn't exist
  if (!conversation) {
    conversation = await this.create({
      participants: [userId1, userId2],
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
    });
    conversation = await conversation.populate("participants", "name email avatar");
  }

  return conversation;
};

export default (mongoose.models.Conversation ||
  mongoose.model<IConversation, IConversationModel>("Conversation", ConversationSchema)) as IConversationModel;
