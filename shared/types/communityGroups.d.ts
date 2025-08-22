import { DatabaseUser } from './user';

/**
 * Type representing the unique identifier for a community.
 */
export type CommunityID = string;

/**
 * Interface representing the base structure of a community.
 * - `id`: The unique identifier for the community.
 * - `name`: The name of the community.
 * - `description`: A brief description of the community.
 * - `members`: An array of user IDs representing the members of the community.
 * - `isPrivate`: A boolean indicating if the community is private.
 * - `password`: The password for the community, if applicable.
 * - `members`: An array of user objects representing the members of the community.
 * - 'blacklist': An array of user objects representing the blacklisted members of the community.
 */
export interface Community {
  name: string;
  description: string;
  isPrivate: boolean;
  password?: string;
  members: User[];
  admin: string;
  pollsEnabled: boolean;
  leaderboardEnabled: boolean;
  showPassword: boolean;
  blacklist: User[];
}

/**
 * Interface representing the details of a community, including extended information:
 * - `createdAt`: The date and time when the community was created.
 * - `admin`: The ID of the user who administers the community.
 * - `isJoined`: A boolean indicating if the current user has joined the community.
 */
export interface CommunityDetails extends Community {
  createdAt: string;
  isJoined: boolean;
  communityId: string;
}
export interface CommunityGroupDatabase extends Omit<CommunityDetails, 'members'> {
  members: ObjectId[];
}

export interface PopulatedCommunityGroup extends Omit<CommunityGroupDatabase, 'members'> {
  members: DatabaseUser[];
}
/**
 * Interface extending the request body for adding a community.
 * - `name`: The name of the community.
 * - `description`: A brief description of the community.
 * - `admin`: The ID of the user who will administer the community.
 */

export interface CreateCommunityRequest extends Request {
  body: {
    name: string;
    description: string;
    admin: string;
    isPrivate: boolean;
    password?: string;
    pollsEnabled: boolean;
    leaderboardEnabled: boolean;
    showPassword: boolean;
    members: User[];
    blacklist: User[];
  };
}

/**
 * Interface representing response data for a community-related operation.
 * - Either a `CommunityDetails` object or an error message.
 */
export type CommunityResponse = CommunityDetails | { error: string };
