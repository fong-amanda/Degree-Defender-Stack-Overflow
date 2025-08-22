import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeDatabaseUser, User } from '../../types/types';

const mockUser: User = {
  username: 'user1',
  password: 'password',
  dateJoined: new Date('2024-12-03'),
  isModerator: false,
  acceptedNotes: 0,
  rejectedNotes: 0,
  nimGameWins: 0,
  isBanned: false,
};

const mockSafeUser: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
  isModerator: false,
  acceptedNotes: 0,
  rejectedNotes: 0,
  nimGameWins: 0,
  isBanned: false,
};

const mockUserJSONResponse = {
  _id: mockSafeUser._id.toString(),
  username: 'user1',
  dateJoined: new Date('2024-12-03').toISOString(),
  isBanned: false,
  isModerator: false,
  acceptedNotes: 0,
  rejectedNotes: 0,
  nimGameWins: 0,
};

const saveUserSpy = jest.spyOn(util, 'saveUser');
const loginUserSpy = jest.spyOn(util, 'loginUser');
const updatedUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
const getUsersListSpy = jest.spyOn(util, 'getUsersList');
const deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');
const singUpWithSSOSpy = jest.spyOn(util, 'singUpWithSSO');
const loginUserWithSSOSpy = jest.spyOn(util, 'loginUserWithSSO');
const updateAcceptedNotesSpy = jest.spyOn(util, 'updateAcceptedNotes');
const updateRejectedNotesSpy = jest.spyOn(util, 'updateRejectedNotes');

describe('Test userController', () => {
  describe('POST /signup', () => {
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        acceptedNotes: 0,
        rejectedNotes: 0,
        username: mockUser.username,
        password: mockUser.password,
        biography: 'This is a test biography',
        isModerator: false,
        nimGameWins: 0,
        isBanned: false,
      };

      saveUserSpy.mockResolvedValueOnce({ ...mockSafeUser, biography: mockReqBody.biography });

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse, biography: mockReqBody.biography });
      expect(saveUserSpy).toHaveBeenCalledWith({
        ...mockReqBody,
        biography: mockReqBody.biography,
        dateJoined: expect.any(Date),
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce({ error: 'Error saving user' });

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      // console.log('check 1');

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);

      // console.log('check 2');

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      // console.log('check 3');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);

      // console.log('check 4');
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce({ error: 'Error authenticating user' });

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(500);
    });

    it('should return 403 when attempting to login with a banned account', async () => {
      // Create a banned user response that matches the UserResponse type
      const bannedUserResponse = {
        ...mockSafeUser, // Use your existing mockSafeUser which should be a UserResponse
        isBanned: true,
      };

      loginUserSpy.mockResolvedValueOnce(bannedUserResponse);

      const mockLoginCredentials = {
        username: mockUser.username,
        password: 'correctPassword',
      };

      const response = await supertest(app).post('/user/login').send(mockLoginCredentials);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Login failed: This account is banned from Degree Defender!');
      expect(loginUserSpy).toHaveBeenCalledWith({
        username: mockUser.username,
        password: 'correctPassword',
      });
    });
  });

  describe('POST /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, { password: 'newPassword' });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 for a database error while updating', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(`/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 500 if database error while searching username', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'Error finding user' });

      const response = await supertest(app).get(`/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(500);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).get('/user/getUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /getUsers', () => {
    it('should return the users from the database', async () => {
      getUsersListSpy.mockResolvedValueOnce([mockSafeUser]);

      const response = await supertest(app).get(`/user/getUsers`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockUserJSONResponse]);
      expect(getUsersListSpy).toHaveBeenCalled();
    });

    it('should return 500 if database error while finding users', async () => {
      getUsersListSpy.mockResolvedValueOnce({ error: 'Error finding users' });

      const response = await supertest(app).get(`/user/getUsers`);

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /deleteUser', () => {
    it('should return the deleted user given correct arguments', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).delete(`/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 500 if database error while searching username', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce({ error: 'Error deleting user' });

      const response = await supertest(app).delete(`/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(500);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).delete('/user/deleteUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /updateBiography', () => {
    it('should successfully update biography given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'This is my new bio',
      };

      // Mock a successful updateUser call
      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      // Ensure updateUser is called with the correct args
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        biography: 'This is my new bio',
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        biography: 'some new biography',
      };

      const response = await supertest(app).patch('/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        biography: 'a new bio',
      };

      const response = await supertest(app).patch('/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing biography field', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 500 if updateUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'Attempting update biography',
      };

      // Simulate a DB error
      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when updating user biography: Error: Error updating user',
      );
    });
  });
});

describe('POST /sso-signup', () => {
  it('should create a new user with SSO given a valid token', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    singUpWithSSOSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).post('/user/sso-signup').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(singUpWithSSOSpy).toHaveBeenCalledWith(mockReqBody.token);
  });

  it('should return 400 for request missing token', async () => {
    const mockReqBody = {};

    const response = await supertest(app).post('/user/sso-signup').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toEqual('Invalid request body');
  });

  it('should return 400 if user already exists', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    singUpWithSSOSpy.mockResolvedValueOnce({
      error: 'User already exists. Please log in instead.',
    });

    const response = await supertest(app).post('/user/sso-signup').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toEqual('User already exists. Please log in instead.');
  });

  it('should return 400 if Google token is invalid', async () => {
    const mockReqBody = {
      token: 'invalid-google-token',
    };

    singUpWithSSOSpy.mockResolvedValueOnce({ error: 'Invalid or unverified Google account' });

    const response = await supertest(app).post('/user/sso-signup').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toEqual('Invalid or unverified Google account');
  });

  it('should return 500 for a server error during SSO signup', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    singUpWithSSOSpy.mockRejectedValueOnce(new Error('Server error'));

    const response = await supertest(app).post('/user/sso-signup').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toEqual('SSO signup failed');
  });
});

describe('POST /sso-login', () => {
  it('should successfully login user with SSO given a valid token', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    loginUserWithSSOSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).post('/user/sso-login').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(loginUserWithSSOSpy).toHaveBeenCalledWith(mockReqBody.token);
  });

  it('should return 400 for request missing token', async () => {
    const mockReqBody = {};

    const response = await supertest(app).post('/user/sso-login').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toEqual('Invalid request body');
  });

  it('should return 400 if user not found', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    loginUserWithSSOSpy.mockResolvedValueOnce({ error: 'User not found. Please sign up first.' });

    const response = await supertest(app).post('/user/sso-login').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toEqual('User not found. Please sign up first.');
  });

  it('should return 400 if Google token is invalid', async () => {
    const mockReqBody = {
      token: 'invalid-google-token',
    };

    loginUserWithSSOSpy.mockResolvedValueOnce({ error: 'Invalid or unverified Google account' });

    const response = await supertest(app).post('/user/sso-login').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toEqual('Invalid or unverified Google account');
  });

  it('should return 403 if user is banned', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    const bannedUser = { ...mockSafeUser, isBanned: true };

    loginUserWithSSOSpy.mockResolvedValueOnce(bannedUser);

    const response = await supertest(app).post('/user/sso-login').send(mockReqBody);

    expect(response.status).toBe(403);
    expect(response.text).toEqual('Login failed: This account is banned from Degree Defender!');
  });

  it('should return 500 for a server error during SSO login', async () => {
    const mockReqBody = {
      token: 'valid-google-token',
    };

    loginUserWithSSOSpy.mockRejectedValueOnce(new Error('Server error'));

    const response = await supertest(app).post('/user/sso-login').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toEqual('Google SSO login failed');
  });
});

describe('PATCH /updateModeratorStatus', () => {
  it('should successfully update moderator status given correct arguments', async () => {
    const mockReqBody = {
      username: mockUser.username,
      isModerator: true,
    };

    updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).patch('/user/updateModeratorStatus').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
      isModerator: true,
    });
  });

  it('should return 500 if updateUser returns an error', async () => {
    const mockReqBody = {
      username: mockUser.username,
      isModerator: false,
    };

    // Simulate a DB error
    updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

    const response = await supertest(app).patch('/user/updateModeratorStatus').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain(
      'Error when updating moderator status: Error: Error updating user',
    );
  });
});

describe('PATCH /updateUserBanStatus', () => {
  // Reset all mocks before each test to prevent memory leaks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update ban status given correct arguments', async () => {
    const mockReqBody = {
      username: mockUser.username,
      isBanned: true,
    };

    // Mock a successful updateUser call
    updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).patch('/user/updateUserBanStatus').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    // Ensure updateUser is called with the correct args
    expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
      isBanned: true,
    });
  });

  it('should return 500 if updateUser returns an error', async () => {
    const mockReqBody = {
      username: mockUser.username,
      isBanned: true,
    };

    updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

    const response = await supertest(app).patch('/user/updateUserBanStatus').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain(
      'Error when updating user ban status: Error: Error updating user',
    );
  });
});

describe('PATCH /updateAcceptedNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update accepted notes given a valid userId', async () => {
    const mockUserId = 'user-123';
    const mockReqBody = {
      userId: mockUserId,
    };

    updateAcceptedNotesSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).patch('/user/updateAcceptedNotes').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(updateAcceptedNotesSpy).toHaveBeenCalledWith(mockUserId);
  });

  it('should return 500 if updateAcceptedNotes returns an error', async () => {
    const mockUserId = 'user-123';
    const mockReqBody = {
      userId: mockUserId,
    };

    // Simulate a DB error
    updateAcceptedNotesSpy.mockResolvedValueOnce({ error: 'Error updating accepted notes' });

    const response = await supertest(app).patch('/user/updateAcceptedNotes').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain(
      'Error when updating accepted notes: Error: Error updating accepted notes',
    );
  });
});

describe('PATCH /updateRejectedNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update rejected notes given a valid userId', async () => {
    const mockUserId = 'user-123';
    const mockReqBody = {
      userId: mockUserId,
    };

    updateRejectedNotesSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).patch('/user/updateRejectedNotes').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(updateRejectedNotesSpy).toHaveBeenCalledWith(mockUserId);
  });

  it('should return 500 if updateRejectedNotes returns an error', async () => {
    const mockUserId = 'user-123';
    const mockReqBody = {
      userId: mockUserId,
    };

    updateRejectedNotesSpy.mockResolvedValueOnce({ error: 'Error updating rejected notes' });

    const response = await supertest(app).patch('/user/updateRejectedNotes').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain(
      'Error when updating rejected notes: Error: Error updating rejected notes',
    );
  });
});
