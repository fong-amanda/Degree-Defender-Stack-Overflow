import mongoose, { Model } from 'mongoose';
import communitySchema from './schema/communitygroup.schema';
import { CommunityDetails } from '../types/types';

/**
 * Mongoose model for the `Comment` collection.
 *
 * This model is created using the `Comment` interface and the `commentSchema`, representing the
 * `Comment` collection in the MongoDB database, and provides an interface for interacting with
 * the stored comments.
 *
 * @type {Model<CommunityDetails>}
 */
const CommunityModel: Model<CommunityDetails> = mongoose.model<CommunityDetails>(
  'Community',
  communitySchema,
);
export default CommunityModel;
