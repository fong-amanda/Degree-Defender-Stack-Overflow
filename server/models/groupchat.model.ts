import mongoose, { Model } from 'mongoose';
import { DatabaseGroupChat } from '../types/types';
import groupChatSchema from './schema/groupChat.schema';

/**
 * Mongoose model for the Group Chat collection.
 */
const GroupChatModel: Model<DatabaseGroupChat> = mongoose.model<DatabaseGroupChat>(
  'GroupChat',
  groupChatSchema,
);

export default GroupChatModel;
