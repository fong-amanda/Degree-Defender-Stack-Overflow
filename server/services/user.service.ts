import UserModel from '../models/users.model';
import {
  DatabaseUser,
  SafeDatabaseUser,
  User,
  UserCredentials,
  UserResponse,
  UsersResponse,
} from '../types/types';
import verifyGoogleToken from './googleAuth.service';

/**
 * Saves a new user to the database.
 *
 * @param {User} user - The user object to be saved, containing user details like username, password, etc.
 * @returns {Promise<UserResponse>} - Resolves with the saved user object (without the password) or an error message.
 */
export const saveUser = async (user: User): Promise<UserResponse> => {
  try {
    const result: DatabaseUser = await UserModel.create(user);

    if (!result) {
      throw Error('Failed to create user');
    }

    // Remove password field from returned object
    const safeUser: SafeDatabaseUser = {
      _id: result._id,
      username: result.username,
      dateJoined: result.dateJoined,
      biography: result.biography,
      isModerator: result.isModerator,
      acceptedNotes: result.acceptedNotes,
      rejectedNotes: result.rejectedNotes,
      nimGameWins: result.nimGameWins,
      isBanned: result.isBanned,
    };

    return safeUser;
  } catch (error) {
    return { error: `Error occurred when saving user: ${error}` };
  }
};

/**
 * Retrieves a user from the database by their username.
 *
 * @param {string} username - The username of the user to find.
 * @returns {Promise<UserResponse>} - Resolves with the found user object (without the password) or an error message.
 */
export const getUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({ username }).select('-password');

    if (!user) {
      throw Error('User not found');
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Retrieves all users from the database.
 * Users documents are returned in the order in which they were created, oldest to newest.
 *
 * @returns {Promise<UsersResponse>} - Resolves with the found user objects (without the passwords) or an error message.
 */
export const getUsersList = async (): Promise<UsersResponse> => {
  try {
    const users: SafeDatabaseUser[] = await UserModel.find().select('-password');

    if (!users) {
      throw Error('Users could not be retrieved');
    }

    return users;
  } catch (error) {
    return { error: `Error occurred when finding users: ${error}` };
  }
};

/**
 * Authenticates a user by verifying their username and password.
 *
 * @param {UserCredentials} loginCredentials - An object containing the username and password.
 * @returns {Promise<UserResponse>} - Resolves with the authenticated user object (without the password) or an error message.
 */
export const loginUser = async (loginCredentials: UserCredentials): Promise<UserResponse> => {
  const { username, password } = loginCredentials;

  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({ username, password }).select(
      '-password',
    );

    if (!user) {
      throw Error('Authentication failed');
    }

    if (user.isBanned) {
      // checking if user is banned
      return { error: 'This account is banned from Degree Defender!' };
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when authenticating user: ${error}` };
  }
};

/**
 * Deletes a user from the database by their username.
 *
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<UserResponse>} - Resolves with the deleted user object (without the password) or an error message.
 */
export const deleteUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const deletedUser: SafeDatabaseUser | null = await UserModel.findOneAndDelete({
      username,
    }).select('-password');

    if (!deletedUser) {
      throw Error('Error deleting user');
    }

    return deletedUser;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Updates user information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUser = async (
  username: string,
  updates: Partial<User>,
): Promise<UserResponse> => {
  try {
    const updatedUser: SafeDatabaseUser | null = await UserModel.findOneAndUpdate(
      { username },
      { $set: updates },
      { new: true },
    ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating user');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating user: ${error}` };
  }
};

/**
 * Sing up a new user with SSO (Google).
 * @param googleToken the token from Google
 * @returns {Promise<UserResponse>} - Resolves with the safe user object or an error message.
 */
export const singUpWithSSO = async (googleToken: string): Promise<UserResponse> => {
  // Verify the token and extract user info from Google
  const verifiedGoogleUser = await verifyGoogleToken(googleToken);
  if (!verifiedGoogleUser?.email || !verifiedGoogleUser.email_verified) {
    return { error: 'Invalid or unverified Google account' };
  }

  // Check if a user already exists with that email
  const { email } = verifiedGoogleUser;
  const userAlreadyExists = await getUserByUsername(email);
  if (userAlreadyExists && !('error' in userAlreadyExists)) {
    return { error: 'User already exists. Please log in instead.' };
  }

  // Create a new user object
  const newUser: User = {
    username: email,
    password: 'sso-placeholder',
    dateJoined: new Date(),
    biography: '',
    isModerator: false,
    acceptedNotes: 0,
    rejectedNotes: 0,
    nimGameWins: 0,
    isBanned: false,
  };

  // Save the user and return a safe user object
  const safeUser = await saveUser(newUser);
  return safeUser;
};

/**
 * login a user with SSO (Google).
 * @param googleToken the token from Google
 * @returns {Promise<UserResponse>} - Resolves with the safe user object or an error message.
 */
export const loginUserWithSSO = async (googleToken: string): Promise<UserResponse> => {
  const verifiedGoogleUser = await verifyGoogleToken(googleToken);
  if (!verifiedGoogleUser?.email || !verifiedGoogleUser.email_verified) {
    return { error: 'Invalid or unverified Google account' };
  }

  const user = await getUserByUsername(verifiedGoogleUser.email);
  if (!user || 'error' in user) {
    return { error: 'User not found. Please sign up first.' };
  }

  if (user.isBanned) {
    // checking if user is banned
    return { error: 'This account is banned from Degree Defender!' };
  }

  return user;
};

/**
 * Updates user wins in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUserWins = async (username: string): Promise<UserResponse> => {
  const updatedUser = await UserModel.findOneAndUpdate(
    { username },
    { $inc: { nimGameWins: 1 } },
    { new: true },
  ).select('-password');
  if (!updatedUser) {
    return { error: 'Error updating user wins' };
  }
  return updatedUser;
};

/**
 * Updates user accepted notes in the database.
 *
 * @param {string} userId - The userId of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateAcceptedNotes = async (userId: string): Promise<UserResponse> => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { acceptedNotes: 1 } },
    { new: true },
  ).select('-password');

  if (!updatedUser) {
    return { error: 'User not found' };
  }

  return updatedUser;
};

/**
 * Updates user accepted notes in the database.
 *
 * @param {string} userId - The userId of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateRejectedNotes = async (userId: string): Promise<UserResponse> => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { rejectedNotes: 1 } },
    { new: true },
  ).select('-password');

  if (!updatedUser) {
    return { error: 'User not found' };
  }

  return updatedUser;
};
