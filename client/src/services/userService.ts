import axios from 'axios';
import { UserCredentials, SafeDatabaseUser } from '../types/types';
import api from './config';

const USER_API_URL = `${process.env.REACT_APP_SERVER_URL}/user`;

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUsers = async (): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/getUsers`);
  if (res.status !== 200) {
    throw new Error('Error when fetching users');
  }
  return res.data;
};

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUserByUsername = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.get(`${USER_API_URL}/getUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Sends a POST request to create a new user account.
 *
 * @param user - The user credentials (username and password) for signup.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If an error occurs during the signup process.
 */
const createUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while signing up: ${error.response.data}`);
    } else {
      throw new Error('Error while signing up');
    }
  }
};

/**
 * Sends a POST request to authenticate a user.
 *
 * @param user - The user credentials (username and password) for login.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If an error occurs during the login process.
 */
const loginUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/login`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while logging in: ${error.response.data}`);
    } else {
      throw new Error('Error while logging in');
    }
  }
};

/**
 * Sends a POST request to log in a user via Google SSO token.
 *
 * @param googleToken - Google ID token
 * @returns {Promise<SafeDatabaseUser>}
 * @throws {Error} - If login fails
 */
const loginUserWithSSO = async (googleToken: string): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/sso-login`, { token: googleToken });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`There was an error trying to login with Google: ${error.response.data}`);
    } else {
      throw new Error('Unexpected error when trying to login with Google');
    }
  }
};

/**
 * Sends a POST request to register a user using Google SSO token.
 *
 * @param googleToken - The Google ID token from frontend
 * @returns {Promise<SafeDatabaseUser>} - The newly created user
 * @throws {Error} - If signup fails
 */
const signUpWithSSO = async (googleToken: string): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/sso-signup`, { token: googleToken });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`There was an error trying to sing up with Google : ${error.response.data}`);
    } else {
      throw new Error('Unexpected error while signing up with Google');
    }
  }
};

/**
 * Deletes a user by their username.
 * @param username - The unique username of the user
 * @returns A promise that resolves to the deleted user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const deleteUser = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.delete(`${USER_API_URL}/deleteUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting user');
  }
  return res.data;
};

/**
 * Resets the password for a user.
 * @param username - The unique username of the user
 * @param newPassword - The new password to be set for the user
 * @returns A promise that resolves to the updated user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const resetPassword = async (username: string, newPassword: string): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/resetPassword`, {
    username,
    password: newPassword,
  });
  if (res.status !== 200) {
    throw new Error('Error when resetting password');
  }
  return res.data;
};

/**
 * Updates the user's biography.
 * @param username The unique username of the user
 * @param newBiography The new biography to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBiography = async (
  username: string,
  newBiography: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateBiography`, {
    username,
    biography: newBiography,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating biography');
  }
  return res.data;
};

/**
 * Updates user moderator status
 * @param username The unique username of the user
 * @param newModeratorStatus The new moderator status.
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateModeratorStatus = async (
  username: string,
  newModeratorStatus: boolean,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateModeratorStatus`, {
    username,
    isModerator: newModeratorStatus,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating moderator status');
  }
  return res.data;
};

/**
 * Updates user ban status
 * @param username The unique username of the user
 * @param newBanStatus The new ban status.
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBanStatus = async (
  username: string,
  newBanStatus: boolean,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateUserBanStatus`, {
    username,
    isBanned: newBanStatus,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating user ban status');
  }
  return res.data;
};

/**
 * Updates the number of accepted notes for a user.
 * @param userId - The ID of the user to update.
 * @returns A promise that resolves when the status is updated successfully, or rejects with an error.
 */
const updateAcceptedNotesByUserID = async (userId: string): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateAcceptedNotes`, {
    userId,
  });

  if (res.status !== 200) {
    throw new Error('Error updating accepted notes');
  }

  return res.data;
};

/**
 * Updates the number of rejected notes for a user.
 * @param userId - The ID of the user to update.
 * @returns A promise that resolves when the status is updated successfully, or rejects with an error.
 */
const updateRejectedNotesByUserID = async (userId: string): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateRejectedNotes`, {
    userId,
  });

  if (res.status !== 200) {
    throw new Error('Error updating rejected notes');
  }

  return res.data;
};

export {
  getUsers,
  getUserByUsername,
  loginUser,
  createUser,
  deleteUser,
  resetPassword,
  updateBiography,
  loginUserWithSSO,
  signUpWithSSO,
  updateModeratorStatus,
  updateBanStatus,
  updateAcceptedNotesByUserID,
  updateRejectedNotesByUserID,
};
