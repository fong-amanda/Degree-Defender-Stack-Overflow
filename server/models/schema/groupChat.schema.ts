import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Group Chat collection.
 *
 * This schema defines the structure of comment used in chat in the database
 * Each comment includes the following fields:
 * - `participants`: The content of the comment.
 * - `messages`: The content of the comment.
 * - `name`: The name of the group chat.
 */
const groupChatSchema = new Schema(
  {
    creator: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    name: {
      type: String,
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
  },
  {
    collection: 'GroupChat',
    timestamps: true,
  },
);

export default groupChatSchema;
