import mongoose, { Model } from 'mongoose';
import { DatabasePoll } from '../types/types';
import pollSchema from './schema/poll.schema';

/**
 * Mongoose model for the Group Chat collection.
 */
const PollModel: Model<DatabasePoll> = mongoose.model<DatabasePoll>('Poll', pollSchema);

export default PollModel;
