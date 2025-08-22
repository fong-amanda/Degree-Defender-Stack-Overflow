import { ObjectId } from 'mongodb';
import { Request } from 'express';

/**
 * Represents a Poll with a question, choices, and associated community.
 * - `question`: The poll question.
 * - `choices`: Array of choices for the poll.
 * - `communityId`: The ID of the community to which the poll belongs.
 * - `expiresAt`: The expiration date of the poll.
 * - `voters`: Array of user IDs who have voted.
 */
export interface Poll {
  question: string;
  choices: { choice: string; votes: number }[];
  communityId: string;
  voters: string[];
}

/**
 * Represents a Poll stored in the database.
 * - `_id`: Unique identifier for the poll.
 * - `createdAt`: Timestamp when the poll was created.
 * - `updatedAt`: Timestamp when the poll was last updated.
 */
export interface DatabasePoll extends Poll {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
/**
 * Represents a fully populated Poll from the database.
 */
export interface PopulatedDatabasePoll extends DatabasePoll {}

/**
 * Express request for creating a poll.
 * - `body`: The poll object to be created, including the question, choices, and expiration date.
 */
export interface CreatePollRequest extends Request {
  body: {
    question: string;
    choices: string[];
    communityId: string;
    expiresAt: Date;
  };
}

/**
 * Custom request type for routes that require a `pollId` in the params.
 * - `params`: Contains the `pollId` of the poll to be accessed.
 */
export interface PollIdRequest extends Request {
  params: {
    pollId: string;
  };
}

/**
 * Express request for voting on a poll.
 * - `params`: Contains the `pollId` of the poll being voted on.
 * - `body`: Contains the choice the user is voting for and the user ID.
 */
export interface VoteOnPollRequest extends PollIdRequest {
  body: {
    userId: string;
    choice: string;
  };
}

/**
 * A type representing the possible responses for a Poll operation.
 * - Either a `DatabasePoll` object or an error message.
 */
export type PollResponse = DatabasePoll | { error: string };
