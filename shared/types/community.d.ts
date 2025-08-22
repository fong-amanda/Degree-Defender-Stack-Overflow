import { Request } from 'express';
import { ObjectId } from 'mongodb';

/**
 * Represents a community note.
 * - `_id`: Unique identifier for the community note.
 * - `noteText`: The content of the community note.
 * - `createdBy`: The author of the community note.
 * - `question`: The question associated with the community note.
 * - `createdDateTime`: The timestamp when the community note was created.
 * - `helpfulCount`: The number of times the note was marked as helpful.
 * - `notHelpfulCount`: The number of times the note was marked as not helpful.
 * - `status`: The status of the note (pending, approved, or rejected).
 * - `sources`: Optional sources or references for the community note.
 * - `votes`: An object containing arrays of user IDs who voted helpful or not helpful.
 * - `notHelpfulReasons`: An array of reasons for not helpful votes.
 */
export interface CommunityNote {
  _id: string;
  noteText: string;
  createdBy: string;
  question: string;
  createdDateTime: Date;
  helpfulCount: number;
  notHelpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  sources?: string;
  votes: {
    helpful: string[];
    notHelpful: string[];
  };
  notHelpfulReasons: string[];
  answerId: string;
}

/**
 * Represents a community note stored in the database.
 * - `_id`: Unique identifier for the community note.
 * - `noteText`: The content of the community note.
 * - `createdBy`: The author of the community note.
 * - `createdDateTime`: The timestamp when the community note was created.
 */
export interface DatabaseCommunityNote extends CommunityNote {
  _id: ObjectId;
}

/**
 * Interface extending the request body for adding a community note.
 * - `noteText`: The content of the community note.
 * - `createdBy`: The author of the community note.
 * - `question`: The question associated with the community note.
 * - `sources`: Optional sources or references for the community note.
 */
export interface AddCommunityNoteRequest extends Request {
  body: {
    noteText: string;
    createdBy: string;
    question: string;
    answerId: string;
    sources?: string;
  };
}

export interface UpdateNoteStatusRequest {
  body: {
    noteId: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

/**
 * Type represent ing possible responses for a Community Note-related operation.
 * - Either a `DatabaseCommunityNote` object or an error message.
 */
export type CommunityNoteResponse = DatabaseCommunityNote | { error: string };
