import mongoose, { Model } from 'mongoose';
import communityNoteSchema from './schema/communitynote.schema';
import { DatabaseCommunityNote } from '../types/types';

/**
 * Mongoose model for the `CommunityNote` collection.
 *
 * This model uses the `DatabaseCommunityNote` interface and the `communityNoteSchema`,
 * representing the `CommunityNote` documents stored in MongoDB.
 *
 * @type {Model<DatabaseCommunityNote>}
 */
const CommunityNoteModel: Model<DatabaseCommunityNote> = mongoose.model<DatabaseCommunityNote>(
  'CommunityNote',
  communityNoteSchema,
);

export default CommunityNoteModel;
