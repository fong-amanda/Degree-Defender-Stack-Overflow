import { Schema } from 'mongoose';

/**
 * Mongoose schema for the CommunityNote collection.
 *
 * Fields:
 * - `createdBy`: The user who created the note (required, references the User collection).
 * - `noteText`: The content of the community note (required).
 * - `sources`: Additional sources or references for the note (default: empty string).
 * - `question`: The question associated with the note (required, references the Question collection).
 * - `createdDateTime`: Timestamp of when the note was created (default: current date and time).
 * - `helpfulCount`: Number of helpful votes (default: 0).
 * - `notHelpfulCount`: Number of not helpful votes (default: 0).
 * - `status`: The status of the note (default: 'pending', can be 'pending', 'approved', or 'rejected').
 * - `votes`: An object containing arrays of user IDs who voted helpful or not helpful (default: empty arrays).
 * - `notHelpfulReasons`: An array of reasons for not helpful votes (default: empty array).
 */
const communityNoteSchema = new Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  noteText: {
    type: String,
    required: true,
  },
  sources: {
    type: String,
    default: '',
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  answerId: {
    type: Schema.Types.ObjectId,
    ref: 'Answer',
    required: true,
  },
  createdDateTime: {
    type: Date,
    default: Date.now,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  notHelpfulCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  votes: {
    helpful: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    notHelpful: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  notHelpfulReasons: {
    type: [String],
    default: [],
  },
});

export default communityNoteSchema;
