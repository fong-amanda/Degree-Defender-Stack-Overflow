import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { DatabaseMessage, Message } from './message';
import { DatabaseUser } from './user';

/**
 * Extends the raw Message with an extra `user` field for
 * populated user details (populated from `msgFrom`).
 * - `user`: populated user details, including `_id` and `username`, or `null` if no user is found.
 */
export interface MessageInGroupChat extends DatabaseMessage {
  user: Pick<DatabaseUser, '_id' | 'username'> | null;
}

/**
 * Represents a Chat with participants and messages (unpopulated).
 * - `participants`: Array of usernames or ObjectIds representing the chat participants.
 * - `messages`: Array of `Message` objects.
 */
export interface GroupChat {
  creator: string;
  participants: string[];
  messages: Message[];
  name: string;
  communityId: string;
  // public?: boolean;
}

/**
 * Represents a Chat stored in the database.
 * - `_id`: Unique identifier for the chat.
 * - `participants`: Array of ObjectIds representing the chat participants.
 * - `messages`: Array of ObjectIds referencing messages in the chat.
 * - `createdAt`: Timestamp for when the chat was created (set by Mongoose).
 * - `updatedAt`: Timestamp for when the chat was last updated (set by Mongoose).
 */
export interface DatabaseGroupChat extends Omit<GroupChat, 'messages'> {
  _id: ObjectId;
  messages: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a fully populated Chat from the database.
 * - `messages`: Array of `MessageInGroupChat` objects, each populated with user details.
 */
export interface PopulatedDatabaseGroupChat extends Omit<DatabaseGroupChat, 'messages'> {
  messages: MessageInGroupChat[];
}

/**
 * Express request for creating a chat.
 * - `body`: The chat object to be created, including participants and messages.
 */
export interface CreateGroupChatRequest extends Request {
  body: {
    participants: string[]; // Assuming participants are still provided as usernames in the request
    messages: Omit<Message, 'type'>[]; // Omit 'type' if not needed
  };
}

/**
 * Custom request type for routes that require a `chatId` in the params.
 * - `params`: Contains the `chatId` of the chat to be accessed.
 */
export interface GroupChatIdRequest extends Request {
  params: {
    chatId: string;
  };
}

/**
 * Express request for adding a message to a group chat.
 * - `body`: Contains the message to be added to the chat.
 * - `chatId` is passed in the route params.
 */
export interface AddMessageRequestToGroupChat extends GroupChatIdRequest {
  body: Omit<Message, 'type'>; // Omit 'type' if not needed
}

/**
 * Express request for adding a participant to a chat.
 * - `body`: Contains the `username` of the participant to be added.
 * - `chatId` is passed in the route params.
 */
export interface AddParticipantRequestGroup extends GroupChatIdRequest {
  body: {
    username: string;
  };
}

/**
 * Express request for fetching a chat based on the participants' username.
 * - `params`: Contains the `username` of the participant to look up the chat.
 */
export interface GetGroupChatByParticipantsRequest extends Request {
  params: {
    username: string;
  };
}

/**
 * A type representing the possible responses for a Chat operation.
 * - Either a `DatabaseGroupChat` object or an error message.
 */
export type GroupChatResponse = DatabaseGroupChat | { error: string };
