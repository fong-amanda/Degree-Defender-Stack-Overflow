import mongoose from 'mongoose';
import UserModel from '../../models/users.model';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
  singUpWithSSO,
  loginUserWithSSO,
  updateUserWins,
  updateAcceptedNotes,
  updateRejectedNotes,
} from '../../services/user.service';
import { SafeDatabaseUser, User, UserCredentials } from '../../types/types';
import { user, safeUser } from '../mockData.models';
import verifyGoogleToken from '../../services/googleAuth.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

jest.mock('../../services/googleAuth.service');
const mockedVerifyGoogleToken = verifyGoogleToken as jest.MockedFunction<typeof verifyGoogleToken>;

describe('User Service Tests', () => {
  // Reset mocks before each test suite
  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
  });

  // Reset mocks after each test suite
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Clean up after all tests
  afterAll(() => {
    jest.clearAllMocks();
    mockingoose.resetAll();
  });

  describe('saveUser', () => {
    it('should return the saved user', async () => {
      mockingoose(UserModel).toReturn(user, 'create');

      const savedUser = (await saveUser(user)) as SafeDatabaseUser;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toEqual(user.username);
      expect(savedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should return an error if user creation fails', async () => {
      const spy = jest.spyOn(UserModel, 'create').mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await saveUser(user);

      expect('error' in result).toBe(true);

      spy.mockRestore();
    });
    it('should throw an error if user creation result is falsy', async () => {
      // Mock UserModel.create to return null, which should trigger the error
      const createSpy = jest.spyOn(UserModel, 'create').mockResolvedValueOnce('' as never);

      const result = await saveUser(user);

      // Verify the error was returned
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Failed to create user');
      }

      // Clean up the spy
      createSpy.mockRestore();
    });
    it('should return an error if result is null when creating user', async () => {
      const spy = jest
        .spyOn(UserModel, 'create')
        .mockImplementationOnce(() => Promise.reject(new Error('Failed to create user')));

      const result = await saveUser(user);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Failed to create user');
      }

      spy.mockRestore();
    });

    it('should throw an error if error when saving to database', async () => {
      const spy = jest
        .spyOn(UserModel, 'create')
        .mockRejectedValueOnce(new Error('Error saving document'));

      const saveError = await saveUser(user);

      expect('error' in saveError).toBe(true);

      spy.mockRestore();
    });
  });

  describe('getUserByUsername', () => {
    it('should return the matching user', async () => {
      mockingoose(UserModel).toReturn(safeUser, 'findOne');

      const retrievedUser = (await getUserByUsername(user.username)) as SafeDatabaseUser;

      expect(retrievedUser.username).toEqual(user.username);
      expect(retrievedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should throw an error if the user is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const getUserError = await getUserByUsername(user.username);

      expect('error' in getUserError).toBe(true);
    });

    it('should throw an error if there is an error while searching the database', async () => {
      mockingoose(UserModel).toReturn(new Error('Error finding document'), 'findOne');

      const getUserError = await getUserByUsername(user.username);

      expect('error' in getUserError).toBe(true);
    });
  });

  describe('getUsersList', () => {
    it('should return the users', async () => {
      mockingoose(UserModel).toReturn([safeUser], 'find');

      const retrievedUsers = (await getUsersList()) as SafeDatabaseUser[];

      expect(retrievedUsers[0].username).toEqual(safeUser.username);
      expect(retrievedUsers[0].dateJoined).toEqual(safeUser.dateJoined);
    });

    it('should throw an error if the users cannot be found', async () => {
      mockingoose(UserModel).toReturn(null, 'find');

      const getUsersError = await getUsersList();

      expect('error' in getUsersError).toBe(true);
    });

    it('should throw an error if there is an error while searching the database', async () => {
      mockingoose(UserModel).toReturn(new Error('Error finding document'), 'find');

      const getUsersError = await getUsersList();

      expect('error' in getUsersError).toBe(true);
    });
  });

  describe('loginUser', () => {
    it('should return an error if the user is banned', async () => {
      const bannedUser = {
        ...safeUser,
        isBanned: true,
      };

      mockingoose(UserModel).toReturn(bannedUser, 'findOne');

      const credentials: UserCredentials = {
        username: user.username,
        password: user.password,
      };

      const result = await loginUser(credentials);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('This account is banned from Degree Defender!');
      }
    });

    it('should return the user if authentication succeeds', async () => {
      mockingoose(UserModel).toReturn(safeUser, 'findOne');

      const credentials: UserCredentials = {
        username: user.username,
        password: user.password,
      };

      const loggedInUser = (await loginUser(credentials)) as SafeDatabaseUser;

      expect(loggedInUser.username).toEqual(user.username);
      expect(loggedInUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should return the user if the password fails', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const credentials: UserCredentials = {
        username: user.username,
        password: 'wrongPassword',
      };

      const loginError = await loginUser(credentials);

      expect('error' in loginError).toBe(true);
    });

    it('should return the user is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const credentials: UserCredentials = {
        username: 'wrongUsername',
        password: user.password,
      };

      const loginError = await loginUser(credentials);

      expect('error' in loginError).toBe(true);
    });
  });

  describe('deleteUserByUsername', () => {
    it('should return the deleted user when deleted succesfully', async () => {
      mockingoose(UserModel).toReturn(safeUser, 'findOneAndDelete');

      const deletedUser = (await deleteUserByUsername(user.username)) as SafeDatabaseUser;

      expect(deletedUser.username).toEqual(user.username);
      expect(deletedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should throw an error if the username is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOneAndDelete');

      const deletedError = await deleteUserByUsername(user.username);

      expect('error' in deletedError).toBe(true);
    });

    it('should throw an error if a database error while deleting', async () => {
      mockingoose(UserModel).toReturn(new Error('Error deleting object'), 'findOneAndDelete');

      const deletedError = await deleteUserByUsername(user.username);

      expect('error' in deletedError).toBe(true);
    });
  });

  describe('updateUser', () => {
    const updatedUser: User = {
      ...user,
      password: 'newPassword',
    };

    const safeUpdatedUser: SafeDatabaseUser = {
      _id: new mongoose.Types.ObjectId(),
      username: user.username,
      dateJoined: user.dateJoined,
      isModerator: user.isModerator,
      acceptedNotes: user.acceptedNotes,
      rejectedNotes: user.rejectedNotes,
      nimGameWins: user.nimGameWins,
      isBanned: user.isBanned,
    };

    const updates: Partial<User> = {
      password: 'newPassword',
    };

    it('should return the updated user when updated succesfully', async () => {
      mockingoose(UserModel).toReturn(safeUpdatedUser, 'findOneAndUpdate');

      const result = (await updateUser(user.username, updates)) as SafeDatabaseUser;

      expect(result.username).toEqual(user.username);
      expect(result.username).toEqual(updatedUser.username);
      expect(result.dateJoined).toEqual(user.dateJoined);
      expect(result.dateJoined).toEqual(updatedUser.dateJoined);
    });

    it('should throw an error if the username is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

      const updatedError = await updateUser(user.username, updates);

      expect('error' in updatedError).toBe(true);
    });

    it('should throw an error if a database error while deleting', async () => {
      mockingoose(UserModel).toReturn(new Error('Error updating object'), 'findOneAndUpdate');

      const updatedError = await updateUser(user.username, updates);

      expect('error' in updatedError).toBe(true);
    });

    it('should update the biography if the user is found', async () => {
      const newBio = 'This is a new biography';
      // Make a new partial updates object just for biography
      const biographyUpdates: Partial<User> = { biography: newBio };

      // Mock the DB to return a safe user (i.e., no password in results)
      mockingoose(UserModel).toReturn(
        { ...safeUpdatedUser, biography: newBio },
        'findOneAndUpdate',
      );

      const result = await updateUser(user.username, biographyUpdates);

      // Check that the result is a SafeUser and the biography got updated
      if ('username' in result) {
        expect(result.biography).toEqual(newBio);
      } else {
        throw new Error('Expected a safe user, got an error object.');
      }
    });

    it('should return an error if biography update fails because user not found', async () => {
      // Simulate user not found
      mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

      const newBio = 'No user found test';
      const biographyUpdates: Partial<User> = { biography: newBio };
      const updatedError = await updateUser(user.username, biographyUpdates);

      expect('error' in updatedError).toBe(true);
    });
  });

  describe('SSO Authentication', () => {
    const mockGoogleToken = 'mock-google-token';
    const mockVerifiedUser = {
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      picture: undefined,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('singUpWithSSO', () => {
      it('should create a new user with SSO when token is valid and user does not exist', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce(mockVerifiedUser);
        mockingoose(UserModel).toReturn(null, 'findOne');
        const expectedUser = {
          ...user,
          username: mockVerifiedUser.email,
          password: 'sso-placeholder',
        };
        mockingoose(UserModel).toReturn(expectedUser, 'create');
        const result = await singUpWithSSO(mockGoogleToken);
        expect('error' in result).toBe(false);
        if (!('error' in result)) {
          expect(result.username).toEqual(mockVerifiedUser.email);
        }
        expect(mockedVerifyGoogleToken).toHaveBeenCalledWith(mockGoogleToken);
      });

      it('should return an error if Google token verification fails', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce({
          email: undefined,
          email_verified: false,
          name: undefined,
          picture: undefined,
        });
        const result = await singUpWithSSO(mockGoogleToken);
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('Invalid or unverified Google account');
        }
      });

      it('should return an error if user already exists', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce(mockVerifiedUser);
        mockingoose(UserModel).toReturn(safeUser, 'findOne');
        const result = await singUpWithSSO(mockGoogleToken);
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('User already exists');
        }
      });
    });

    describe('loginUserWithSSO', () => {
      it('should return the user if token is valid and user exists', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce(mockVerifiedUser);
        mockingoose(UserModel).toReturn(safeUser, 'findOne');
        const result = await loginUserWithSSO(mockGoogleToken);
        expect('error' in result).toBe(false);
        if (!('error' in result)) {
          expect(result.username).toEqual(safeUser.username);
        }
        expect(mockedVerifyGoogleToken).toHaveBeenCalledWith(mockGoogleToken);
      });

      it('should return an error if Google token verification fails', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce({
          email: undefined,
          email_verified: false,
          name: undefined,
          picture: undefined,
        });
        const result = await loginUserWithSSO(mockGoogleToken);
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('Invalid or unverified Google account');
        }
      });

      it('should return an error if user does not exist', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce(mockVerifiedUser);
        mockingoose(UserModel).toReturn(null, 'findOne');
        const result = await loginUserWithSSO(mockGoogleToken);
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('User not found');
        }
      });

      it('should return an error if user is banned', async () => {
        mockedVerifyGoogleToken.mockResolvedValueOnce(mockVerifiedUser);
        const bannedUser = { ...safeUser, isBanned: true };
        mockingoose(UserModel).toReturn(bannedUser, 'findOne');
        const result = await loginUserWithSSO(mockGoogleToken);
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('This account is banned');
        }
      });
    });
  });

  describe('updateUserWins', () => {
    it('should increment nimGameWins and return the updated user', async () => {
      const userWithIncrementedWins = {
        ...safeUser,
        nimGameWins: safeUser.nimGameWins + 1,
      };

      mockingoose(UserModel).toReturn(userWithIncrementedWins, 'findOneAndUpdate');

      const result = await updateUserWins(user.username);

      // Check that we got back the updated user
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.username).toEqual(user.username);
        expect(result.nimGameWins).toEqual(safeUser.nimGameWins + 1);
      }
    });

    it('should return an error if the user is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

      const result = await updateUserWins(user.username);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Error updating user wins');
      }
    });
  });

  describe('updateAcceptedNotes', () => {
    it('should return an error if the user is not found', async () => {
      // Mock the database to return null (user not found)
      mockingoose(UserModel).toReturn(null, 'findByIdAndUpdate');

      const userId = '507f1f77bcf86cd799439011'; // Any valid ObjectId
      const result = await updateAcceptedNotes(userId);

      // Check that we got an error response
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('User not found');
      }
    });

    it('should return the updated user on successful increment of acceptedNotes', async () => {
      const userWithIncrementedNotes = {
        ...safeUser,
        acceptedNotes: safeUser.acceptedNotes + 1,
      };

      // Reset mockingoose to avoid interference
      mockingoose.resetAll();

      mockingoose(UserModel).toReturn(userWithIncrementedNotes, 'findOneAndUpdate');

      const userId = safeUser._id.toString();

      const result = await updateAcceptedNotes(userId);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('username', userWithIncrementedNotes.username);
      expect(result).toHaveProperty('acceptedNotes', userWithIncrementedNotes.acceptedNotes);
    });
  });

  describe('updateRejectedNotes', () => {
    it('should return an error if the user is not found', async () => {
      mockingoose(UserModel).toReturn(null, 'findByIdAndUpdate');

      const userId = '507f1f77bcf86cd799439011';
      const result = await updateRejectedNotes(userId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('User not found');
      }
    });

    it('should return the updated user on successful increment of rejectedNotes', async () => {
      const userWithIncrementedNotes = {
        ...safeUser,
        rejectedNotes: safeUser.rejectedNotes + 1,
      };

      // Mock the select method that gets chained after findByIdAndUpdate
      const selectMock = jest.fn().mockResolvedValue(userWithIncrementedNotes);

      // Mock the findByIdAndUpdate method to return an object with a select method
      const findByIdAndUpdateMock = jest
        .spyOn(UserModel, 'findByIdAndUpdate')
        .mockReturnValue({ select: selectMock } as never);

      const userId = safeUser._id.toString();
      const result = await updateRejectedNotes(userId);

      // Verify the method was called with correct parameters
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        userId,
        { $inc: { rejectedNotes: 1 } },
        { new: true },
      );

      // Verify select was called (assuming your service code calls it)
      expect(selectMock).toHaveBeenCalledWith('-password');

      // Verify the result matches expected
      expect(result).toEqual(userWithIncrementedNotes);

      // Clean up the mock to prevent memory leaks
      findByIdAndUpdateMock.mockRestore();
    });
  });
});
