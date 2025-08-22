import express, { Request, Response } from 'express';

import {
  FakeSOSocket,
  CreateChatRequest,
  PopulatedDatabaseGroupChat,
  AddMessageRequestToGroupChat,
  GroupChatIdRequest,
} from '../types/types';
import {
  createCommunity,
  getCommunities,
  joinCommunity,
  getCommunityByName,
  saveGroupChatMessage,
  addMessageToGroupChat,
  saveSingleGroupMessage,
  getGroupChatsByCommunityId,
  isUserInGroupChat,
  getGroupChatById,
  createPoll,
  voteOnPoll,
  deleteMessageFromGroupChat,
  removeParticipantFromGroupChat,
  getTopNimWinners,
  banMemberFromCommunity,
  updatePasswordVisibility,
} from '../services/communitygroup.service';
import { populateDocument } from '../utils/database.util';
import CommunityModel from '../models/communitygroup.model';
import GroupChatModel from '../models/groupchat.model';
import PollModel from '../models/poll.model';

const communityGroupController = (socket: FakeSOSocket) => {
  const router = express.Router();
  /**
   * Creates a new community with the provided details and responds with the created community or an error message.
   * @param req The request object containing the community data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the community is created.
   * @throws {Error} Throws an error if the community creation fails.
   */
  const createCommunityRoute = async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        isPrivate = false,
        members = [],
        admin,
        password,
        leaderboardEnabled = true,
        pollsEnabled = true,
        showPassword = false,
        blacklist = [],
      } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).send('Community name, description, or admin is required');
      }

      const newCommunity = await createCommunity({
        name,
        description,
        isPrivate,
        members,
        admin, // Include admin field in the request
        password,
        pollsEnabled,
        leaderboardEnabled,
        showPassword,
        blacklist,
      });

      if ('error' in newCommunity) {
        throw new Error(newCommunity.error);
      }

      // Send back the new community as the response
      return res.status(200).json(newCommunity);
    } catch (error) {
      return res.status(500).send({ error: `${(error as Error).message || error}` });
    }
  };
  /**
   * Retrieves all communities and responds with the list of communities or an error message.
   * @param req The request object.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the communities are retrieved.
   * @throws {Error} Throws an error if the retrieval fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const getCommunitiesRoute = async (req: Request, res: Response) => {
    try {
      const communities = await getCommunities();
      res.status(200).json(communities);
    } catch (error) {
      res.status(500).send({ error: `Service error: ${(error as Error).message || error}` });
    }
  };
  /**
   * Retrieves a community by its name and responds with the community details or an error message.
   * @param req The request object containing the community name.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the community is retrieved.
   * @throws {Error} Throws an error if the retrieval fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const getCommunityByNameRoute = async (req: Request, res: Response) => {
    const { name } = req.params;
    try {
      const community = await getCommunityByName(name);
      if ('error' in community) {
        throw new Error(community.error);
      }
      res.status(200).json(community);
    } catch (error) {
      res.status(500).send({ error: `Service error: ${(error as Error).message || error}` });
    }
  };
  /**
   * Joins a community with the provided name and username, and responds with the status or an error message.
   * @param req The request object containing the community name and username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the user joins the community.
   * @throws {Error} Throws an error if the join operation fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const joinCommunityRoute = async (req: Request, res: Response) => {
    const { communityName, username } =
      req.body && req.body.communityName && req.body.username
        ? req.body
        : { communityName: '', username: '' }; // Default values for destructuring assignment

    try {
      if (!communityName || !username) throw new Error('Invalid request');
      const status = await joinCommunity(communityName, username);
      if ('error' in status) {
        throw new Error(status.error);
      }
      res.status(200).json(status);
    } catch (error) {
      res.status(500).send(`Error when joining community: ${(error as Error).message}`);
    }
  };

  /**
   * Retrieves group chats by community name and responds with the list of group chats or an error message.
   * @param req The request object containing the community name.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the group chats are retrieved.
   * @throws {Error} Throws an error if the retrieval fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const getGroupChatsByCommunityNameRoute = async (req: Request, res: Response) => {
    const { communityName } = req.params;
    try {
      const community = await CommunityModel.findOne({ name: communityName });
      if (!community) {
        return res.status(404).json({ error: 'COMMUNITY not found' });
      }
      const groupChats = await getGroupChatsByCommunityId(community._id.toString());
      return res.status(200).json(groupChats);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  };

  /**
   * Deletes a message from a group chat and responds with the updated chat or an error message.
   * @param req The request object containing the chat ID, creator name, and message ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is deleted.
   * @throws {Error} Throws an error if the deletion fails.
   * @throws {Error} Throws an error if the chat is not found.
   */
  const deleteMessageFromGroupChatRoute = async (req: Request, res: Response): Promise<void> => {
    const { chatId } = req.params;
    const { creatorName, messageId } = req.body;

    try {
      if (!chatId || !messageId || !creatorName) {
        res.status(400).json({ error: 'Missing chatId, messageId, or creatorName' });
        return;
      }

      const updatedChat = await deleteMessageFromGroupChat(chatId, messageId, creatorName);

      if ('error' in updatedChat) {
        // Return 400 for service-level errors, preventing further response
        res.status(400).json({ error: updatedChat.error });
        return;
      }

      res.status(200).json(updatedChat);
    } catch (error) {
      res.status(500).json({ error: `Error deleting message: ${(error as Error).message}` });
    }
  };
  /**
   * Removes a participant from a group chat and responds with the updated chat or an error message.
   * @param req The request object containing the chat ID, creator name, and participant name.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is removed.
   * @throws {Error} Throws an error if the removal fails.
   * @throws {Error} Throws an error if the chat is not found.
   */
  const removeParticipantFromGroupChatRoute = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { participantName, creatorName } = req.body;

    try {
      if (!chatId || !participantName || !creatorName) {
        return res.status(400).json({ error: 'Missing chatId, participantName, or creatorName' });
      }

      const updatedChat = await removeParticipantFromGroupChat(
        chatId,
        participantName,
        creatorName,
      );

      if ('error' in updatedChat) {
        return res.status(400).json({ error: updatedChat.error });
      }

      return res.status(200).json(updatedChat);
    } catch (error) {
      return res
        .status(500)
        .json({ error: `Error removing participant: ${(error as Error).message}` });
    }
  };
  /**
   * Retrieves a chat by its ID, optionally populating participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getGroupChatRoute = async (req: GroupChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;
    // console.log('HIIIIchatId:', chatId);
    try {
      const foundGroupChat = await getGroupChatById(chatId);
      // console.log('foundGroupChat:', foundGroupChat);

      if ('error' in foundGroupChat) {
        throw new Error(foundGroupChat.error);
      }

      const populatedGroupChat = await populateDocument(foundGroupChat._id.toString(), 'groupchat');
      // console.log('populatedGroupChat:', populatedGroupChat);
      if ('error' in populatedGroupChat) {
        throw new Error(populatedGroupChat.error);
      }

      res.json(populatedGroupChat);
    } catch (err: unknown) {
      res.status(500).send(`BRUHHH Error retrieving GROUP chat: ${(err as Error).message}`);
    }
  };
  /**
   * Validates that the request body contains all required fields for creating a chat.
   * @param req The incoming request containing chat data.
   * @returns `true` if the body contains valid chat fields; otherwise, `false`.
   * @throws {Error} Throws an error if the request body is invalid.
   */
  const isCreateChatRequestValid = (req: CreateChatRequest): boolean => {
    const { participants, messages } = req.body;
    return !!participants && Array.isArray(participants) && participants.length > 0 && !!messages;
  };

  /**
   * Creates a new chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createGroupChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    if (!req.body || !isCreateChatRequestValid(req)) {
      res.status(400).send('Invalid chat creation request');
      return;
    }
    const { communityName } = req.params;

    const { participants, messages, name } = req.body;
    const formattedMessages = messages.map(m => ({
      ...m,
      type: 'group' as 'direct' | 'global' | 'group',
    }));

    try {
      const community = await CommunityModel.findOne({ name: communityName });
      if (!community) {
        res.status(404).send(`Community '${communityName}' not foundddddd`);
        return;
      }
      const communityId = community._id.toHexString();
      const savedChat = await saveGroupChatMessage({
        participants,
        messages: formattedMessages,
        name,
        communityId,
        creator: participants[0],
      });
      if ('error' in savedChat) {
        throw new Error(savedChat.error);
      }

      const populatedChat = await populateDocument(savedChat._id.toString(), 'groupchat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseGroupChat,
        type: 'created',
      });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a chat: ${(err as Error).message}`);
    }
  };
  /**
   * Validates that the request body contains all required fields for adding a message to a chat.
   * @param req The incoming request containing message data.
   * @returns `true` if the body contains valid message fields; otherwise, `false`.
   * @throws {Error} Throws an error if the request body is invalid.
   */
  const isAddMessageRequestValid = (req: AddMessageRequestToGroupChat): boolean => {
    const { chatId } = req.params;
    const { msg, msgFrom } = req.body;
    return !!chatId && !!msg && !!msgFrom;
  };

  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToGroupChatRoute = async (
    req: AddMessageRequestToGroupChat,
    res: Response,
  ): Promise<void> => {
    if (!req.body || !isAddMessageRequestValid(req)) {
      res.status(400).send('Missing chatId, msg, or msgFrom');
      return;
    }

    const { chatId } = req.params;
    const { msg, msgFrom, msgDateTime } = req.body;
    // console.log('Updated chat:', chatId);

    try {
      // Create a new message in the DB
      const newMessage = await saveSingleGroupMessage({
        msg,
        msgFrom,
        msgDateTime,
        type: 'group',
      });

      if ('error' in newMessage) {
        throw new Error(newMessage.error);
      }

      // Associate the message with the chat
      const updatedChat = await addMessageToGroupChat(chatId, newMessage._id.toString());

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }
      // console.log('Updated chat:', updatedChat);
      // Enrich the updated chat for the response
      const populatedChat = await populateDocument(updatedChat._id.toString(), 'groupchat');

      socket.to(chatId).emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseGroupChat,
        type: 'newMessage',
      });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding a message to chattttttt: ${(err as Error).message}`);
    }
  };
  /**
   * Adds a participant to a chat.
   * @param req The request object containing the participant data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToGroupChatRoute = async (
    req: GroupChatIdRequest,
    res: Response,
  ): Promise<void> => {
    const { chatId } = req.params;
    const { username } = req.body;
    // console.log('chatId:', chatId);
    // console.log('username:', username);
    try {
      if (!chatId || !username) {
        res.status(400).send('Missing chatId or username');
        return;
      }
      const groupChat = await GroupChatModel.findById(chatId);
      if (!groupChat) {
        res.status(404).send('Group chat not found');
        return;
      }
      if (groupChat.participants.includes(username)) {
        res.status(400).send('You are already a participant');
        return;
      }
      groupChat.participants.push(username);
      await groupChat.save();
      const populatedGroupChat = await populateDocument(groupChat._id.toString(), 'groupchat');
      socket.to(chatId).emit('chatUpdate', {
        chat: populatedGroupChat as PopulatedDatabaseGroupChat,
        type: 'newParticipant',
      });
      res.json(populatedGroupChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding a participant to chat: ${(err as Error).message}`);
    }
  };
  /**
   * Checks if a user is a participant in a group chat.
   * @param req The request object containing the chat ID and username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the check is complete.
   * @throws {Error} Throws an error if the check fails.
   */
  const isUserInGroupChatRoute = async (req: GroupChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;
    const { username } = req.body;

    try {
      if (!chatId || !username) {
        res.status(400).json({ error: 'Missing chatId or username' });
        return;
      }

      const isParticipant = await isUserInGroupChat(chatId, username);

      res.status(200).json({ isParticipant });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Error checking user in group chat: ${(error as Error).message}` });
    }
  };
  /**
   * Creates a new poll with the provided details and responds with the created poll or an error message.
   * @param req The request object containing the poll data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the poll is created.
   * @throws {Error} Throws an error if the poll creation fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const createPollRoute = async (req: Request, res: Response) => {
    try {
      const { question, choices } = req.body;
      const { communityName } = req.params;

      if (!question || !choices || choices.length < 2 || !communityName) {
        res.status(400).json({
          error:
            'Invalid poll data. Ensure question, choices, communityName, and createdBy are provided.',
        });
        return;
      }

      const community = await CommunityModel.findOne({ name: communityName });
      if (!community) {
        res.status(404).send(`Community '${communityName}' not found`);
        return;
      }

      const communityId = community._id.toHexString();

      const newPoll = await createPoll({
        question,
        choices: choices.map((c: { text: string; votes: number }) => ({
          choice: c.text,
          votes: c.votes,
        })),
        voters: [],
        communityId,
      });

      if ('error' in newPoll) {
        throw new Error(newPoll.error);
      }

      res.status(200).json(newPoll);
    } catch (error) {
      res.status(500).send({ error: `Service error: ${(error as Error).message || error}` });
    }
  };
  /**
   * Retrieves polls by community name and responds with the list of polls or an error message.
   * @param req The request object containing the community name.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the polls are retrieved.
   * @throws {Error} Throws an error if the poll retrieval fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const getPollsByCommunityNameRoute = async (req: Request, res: Response) => {
    const { communityName } = req.params;
    try {
      // Find the community by its name
      const community = await CommunityModel.findOne({ name: communityName });
      if (!community) {
        return res.status(404).json({ error: 'COMMUNITY not found' });
      }
      // Use the community ID to fetch group chats
      const polls = await PollModel.find({ communityId: community._id });
      return res.status(200).json(polls);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  };
  /**
   * Votes on a poll with the provided details and responds with the updated poll or an error message.
   * @param req The request object containing the poll data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the vote is recorded.
   * @throws {Error} Throws an error if the vote fails.
   */
  const voteOnPollRoute = async (req: Request, res: Response) => {
    try {
      const { pollId, choiceIndex, username } = req.body;

      if (!pollId || choiceIndex === undefined || !username) {
        return res.status(400).json({ error: 'Missing pollId, choiceIndex, or username' });
      }

      const poll = await PollModel.findById(pollId);
      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      if (poll.voters.includes(username)) {
        return res.status(400).json({ error: 'User has already voted in this poll' });
      }

      if (choiceIndex < 0 || choiceIndex >= poll.choices.length) {
        return res.status(400).json({ error: 'Invalid choice index' });
      }
      const result = await voteOnPoll(pollId, username, poll.choices[choiceIndex].choice);

      if (
        !result ||
        typeof result !== 'object' ||
        !('choices' in result) ||
        !('voters' in result)
      ) {
        return res.status(400).json({ error: 'Invalid poll response' });
      }

      return res.status(200).json({ message: 'Vote recorded successfully', poll: result });
    } catch (error) {
      return res.status(500).json({ error: `Service error: ${(error as Error).message || error}` });
    }
  };
  /**
   * Adds a member to a community with the provided details and responds with the status or an error message.
   * @param req The request object containing the community name and username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the member is added.
   * @throws {Error} Throws an error if the member addition fails.
   * @throws {Error} Throws an error if the community is not found.
   */
  const addMemberToCommunityRoute = async (req: Request, res: Response) => {
    try {
      const { communityName } = req.params;
      // console.log('communityName:', communityName);
      const { username } = req.body;
      // console.log('username:', username);

      if (!communityName || !username) {
        res.status(400).send('Community name and username are required');
        return;
      }

      const status = await joinCommunity(communityName, username);
      if ('error' in status) {
        throw new Error(status.error);
      }
      res.status(200).json(status);
    } catch (error) {
      res.status(500).send(`Error when adding member to community: ${(error as Error).message}`);
    }
  };
  const banMemberFromCommunityRoute = async (req: Request, res: Response) => {
    try {
      const { communityName } = req.params;
      // console.log('communityName:', communityName);
      const { username } = req.body;
      // console.log('username:', username);

      if (!communityName || !username) {
        res.status(400).send('Community name and username are required');
        return;
      }

      const status = await banMemberFromCommunity(communityName, username);
      if ('error' in status) {
        throw new Error(status.error);
      }
      res.status(200).json(status);
    } catch (error) {
      res.status(500).send(`Error when banning member from community: ${(error as Error).message}`);
    }
  };

  const updatePasswordVisibilityRoute = async (req: Request, res: Response) => {
    try {
      const { communityName } = req.params;
      // console.log('communityName:', communityName);
      const { showPassword } = req.body;
      // console.log('showPassword:', showPassword);

      if (!communityName || typeof showPassword !== 'boolean') {
        res.status(400).send('Community name and password visibility are required');
        return;
      }

      const status = await updatePasswordVisibility(communityName, showPassword);
      if ('error' in status) {
        throw new Error(status.error);
      }
      res.status(200).json(status);
    } catch (error) {
      res
        .status(500)
        .send(`Error when updating community password visibility: ${(error as Error).message}`);
    }
  };
  /**
   * Retrieves the top Nim winners from the database and responds with the list or an error message.
   * @param req The request object containing the community name.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the winners are retrieved.
   * @throws {Error} Throws an error if the retrieval fails.
   */
  const getTopNimWinnersRoute = async (req: Request, res: Response): Promise<void> => {
    const { communityName } = req.params;

    try {
      const community = await CommunityModel.findOne({ name: communityName });

      if (!community || !community.members || community.members.length === 0) {
        res.status(404).json({ error: 'Community not found or has no members' });
        return;
      }

      // Get all winners
      const allNimWinners = await getTopNimWinners();
      if ('error' in allNimWinners) {
        throw new Error(allNimWinners.error);
      }

      // Filter winners to only include community members
      const communityWinners = allNimWinners.filter(winner =>
        community.members.includes(winner.username),
      );

      // Sort by win count (in case the filtering changed the order)
      const sortedCommunityWinners = communityWinners.sort((a, b) => b.nimWins - a.nimWins);

      res.status(200).json(sortedCommunityWinners);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Error retrieving top Nim winners: ${(error as Error).message}` });
    }
  };

  router.post('/createCommunity', createCommunityRoute);
  router.post('/joinCommunity', joinCommunityRoute);
  router.get('/getCommunities', getCommunitiesRoute);
  router.get('/getCommunityByName/:name', getCommunityByNameRoute);
  router.post('/createGroupChat/:communityName', createGroupChatRoute);
  router.get('/getGroupChatsByCommunity/:communityName', getGroupChatsByCommunityNameRoute);
  router.post('/addMessageToGroupChat/:chatId', addMessageToGroupChatRoute);
  router.get('/getGroupChat/:chatId', getGroupChatRoute);
  router.post('/addParticipantToGroupChat/:chatId', addParticipantToGroupChatRoute);
  router.post('/isUserInGroupChat/:chatId', isUserInGroupChatRoute);
  router.post('/createPoll/:communityName', createPollRoute);
  router.get('/getPollsByCommunity/:communityName', getPollsByCommunityNameRoute);
  router.post('/voteOnPoll', voteOnPollRoute);
  router.post('/deleteMessageFromGroupChat/:chatId/', deleteMessageFromGroupChatRoute);
  router.post('/removeParticipantFromGroupChat/:chatId', removeParticipantFromGroupChatRoute);
  router.post('/addMemberToCommunity/:communityName', addMemberToCommunityRoute);
  router.get('/getTopNimWinners/:communityName', getTopNimWinnersRoute);
  router.post('/banMemberFromCommunity/:communityName', banMemberFromCommunityRoute);
  router.post('/updatePasswordVisibility/:communityName', updatePasswordVisibilityRoute);

  return router;
};
export default communityGroupController;
