import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Comment collection.
 *
 * This schema defines the structure of comment used in questions and answers in the database.
 * Each comment includes the following fields:
 * - `text`: The content of the comment.
 * - `commentBy`: The username of the user who commented.
 * - `commentDateTime`: The date and time when the comment was posted.
 */
const communitySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    members: {
      type: [String],
      default: [],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: '',
      required: false,
    },
    admin: {
      type: String,
      default: '',
      required: true,
    },
    pollsEnabled: {
      type: Boolean,
      default: true,
    },
    leaderboardEnabled: {
      type: Boolean,
      default: true,
    },
    showPassword: {
      type: Boolean,
      default: false,
    },
    blacklist: {
      type: [String],
      default: [],
    },
  },
  { collection: 'Community' },
);

export default communitySchema;
