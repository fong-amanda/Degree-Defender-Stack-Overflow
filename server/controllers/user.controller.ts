import express, { Request, Response, Router } from 'express';
import {
  UserRequest,
  User,
  UserCredentials,
  UserByUsernameRequest,
  FakeSOSocket,
  UpdateBiographyRequest,
  SSORequest,
  UpdateModeratorRequest,
  UpdateBanStatusRequest,
} from '../types/types';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
  singUpWithSSO,
  loginUserWithSSO,
  updateAcceptedNotes,
  updateRejectedNotes,
} from '../services/user.service';

const userController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Validates that the request body contains all required fields for a user.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUserBodyValid = (req: UserRequest): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username !== '' &&
    req.body.password !== undefined &&
    req.body.password !== '';

  /**
   * Validates that the request body contains all required fields to update a biography.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUpdateBiographyBodyValid = (req: UpdateBiographyRequest): boolean =>
    req.body !== undefined &&
    req.body.username !== undefined &&
    req.body.username.trim() !== '' &&
    req.body.biography !== undefined;

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username, email, and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    if (!isUserBodyValid(req)) {
      res.status(400).send('Invalid user body');
      return;
    }

    const requestUser = req.body;

    const user: User = {
      ...requestUser,
      dateJoined: new Date(),
      biography: requestUser.biography ?? '',
      isModerator: requestUser.isModerator ?? false,
      acceptedNotes: 0,
      rejectedNotes: 0,
      nimGameWins: 0,
      isBanned: false,
    };

    try {
      const result = await saveUser(user);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('userUpdate', {
        user: result,
        type: 'created',
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when saving user: ${error}`);
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      if (!isUserBodyValid(req)) {
        res.status(400).send('Invalid user body');
        return;
      }

      const loginCredentials: UserCredentials = {
        username: req.body.username,
        password: req.body.password,
      };

      const user = await loginUser(loginCredentials);

      if ('error' in user) {
        throw Error(user.error);
      }

      if (user?.isBanned) {
        res.status(403).send('Login failed: This account is banned from Degree Defender!');
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send('Login failed.');
    }
  };

  /**
   * Handles user login via Google SSO.
   * @param req the request containing the Google token in the body.
   * @param res the response, either returning the user or an error.
   * @returns the promise resolving to void.
   */
  const userSSOLogin = async (req: SSORequest, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      // validate that the request body contains the token
      if (!req.body.token) {
        res.status(400).send('Invalid request body');
        return;
      }

      const user = await loginUserWithSSO(token);
      if ('error' in user) {
        res.status(400).send(user.error);
        return;
      }

      if (user?.isBanned) {
        res.status(403).send('Login failed: This account is banned from Degree Defender!');
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send('Google SSO login failed');
    }
  };

  /**
   * Handles user signup via Google SSO.
   * @param req the request containing the Google token in the body.
   * @param res the response, either returning the created user or an error.
   * @returns a promise resolving to void.
   */
  const userSSOSignup = async (req: SSORequest, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      // validate that the request body contains the token
      if (!req.body.token) {
        res.status(400).send('Invalid request body');
        return;
      }

      const user = await singUpWithSSO(token);
      if ('error' in user) {
        res.status(400).send(user.error);
        return;
      }

      socket.emit('userUpdate', {
        user,
        type: 'created',
      });

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send('SSO signup failed');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const user = await getUserByUsername(username);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send(`Error when getting user by username: ${error}`);
    }
  };

  /**
   * Retrieves all users from the database.
   * @param res The response, either returning the users or an error.
   * @returns A promise resolving to void.
   */
  const getUsers = async (_: Request, res: Response): Promise<void> => {
    try {
      const users = await getUsersList();

      if ('error' in users) {
        throw Error(users.error);
      }

      res.status(200).json(users);
    } catch (error) {
      res.status(500).send(`Error when getting users: ${error}`);
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either confirming deletion or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const deletedUser = await deleteUserByUsername(username);

      if ('error' in deletedUser) {
        throw Error(deletedUser.error);
      }

      socket.emit('userUpdate', {
        user: deletedUser,
        type: 'deleted',
      });
      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(500).send(`Error when deleting user by username: ${error}`);
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      if (!isUserBodyValid(req)) {
        res.status(400).send('Invalid user body');
        return;
      }

      const updatedUser = await updateUser(req.body.username, { password: req.body.password });

      if ('error' in updatedUser) {
        throw Error(updatedUser.error);
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user password: ${error}`);
    }
  };

  /**
   * Updates a user's biography.
   * @param req The request containing the username and biography in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateBiography = async (req: UpdateBiographyRequest, res: Response): Promise<void> => {
    try {
      if (!isUpdateBiographyBodyValid(req)) {
        res.status(400).send('Invalid user body');
        return;
      }

      // Validate that request has username and biography
      const { username, biography } = req.body;

      // Call the same updateUser(...) service used by resetPassword
      const updatedUser = await updateUser(username, { biography });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user biography: ${error}`);
    }
  };

  /**
   * Updates a user's moderator status.
   * @param req The request containing the username and moderator status in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateModeratorStatus = async (
    req: UpdateModeratorRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { username, isModerator } = req.body;

      const updatedUser = await updateUser(username, { isModerator });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating moderator status: ${error}`);
    }
  };

  /**
   * Updates a user's ban status.
   * @param req The request containing the username and ban status in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateBanStatus = async (req: UpdateBanStatusRequest, res: Response): Promise<void> => {
    try {
      const { username, isBanned } = req.body;

      const updatedUser = await updateUser(username, { isBanned });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user ban status: ${error}`);
    }
  };

  /**
   * Updates a user's total accepted notes.
   * @param req The request containing the user id in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const handleUpdateAcceptedNotes = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;

      const updatedUser = await updateAcceptedNotes(userId);

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating accepted notes: ${error}`);
    }
  };

  /**
   * Updates a user's total rejected notes.
   * @param req The request containing the user id in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const handleUpdateRejectedNotes = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;

      const updatedUser = await updateRejectedNotes(userId);

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating rejected notes: ${error}`);
    }
  };

  // Define routes for the user-related operations.
  router.post('/signup', createUser);
  router.post('/login', userLogin);
  router.post('/sso-login', userSSOLogin);
  router.post('/sso-signup', userSSOSignup);
  router.patch('/resetPassword', resetPassword);
  router.get('/getUser/:username', getUser);
  router.get('/getUsers', getUsers);
  router.delete('/deleteUser/:username', deleteUser);
  router.patch('/updateBiography', updateBiography);
  router.patch('/updateModeratorStatus', updateModeratorStatus);
  router.patch('/updateAcceptedNotes', handleUpdateAcceptedNotes);
  router.patch('/updateRejectedNotes', handleUpdateRejectedNotes);
  router.patch('/updateUserBanStatus', updateBanStatus);
  return router;
};

export default userController;
