import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as communityService from '../../services/communitygroup.service';
import { CommunityDetails, PollResponse } from '../../types/types';
import CommunityModel from '../../models/communitygroup.model';
import * as databaseUtil from '../../utils/database.util';
import GroupChatModel from '../../models/groupchat.model';
import PollModel from '../../models/poll.model';

const createCommunitySpy = jest.spyOn(communityService, 'createCommunity');
describe('Community Controller', () => {
  describe('POST /community/createCommunity', () => {
    it('should create a new community successfully', async () => {
      const validCommunityPayload = {
        name: 'Tech Enthusiasts',
        description: 'A community for technology lovers.',
        admin: 'user1',
      };

      const communityResponse: CommunityDetails = {
        communityId: new mongoose.Types.ObjectId().toString(),
        name: 'Tech Enthusiasts',
        description: 'A community for technology lovers.',
        members: [],
        createdAt: new Date().toISOString(),
        admin: 'user1',
        isJoined: true,
        isPrivate: false,
        password: '',
        pollsEnabled: false,
        leaderboardEnabled: false,
        showPassword: false,
        blacklist: [],
      };

      createCommunitySpy.mockResolvedValue(communityResponse);

      const response = await supertest(app)
        .post('/community/createCommunity')
        .send(validCommunityPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(communityResponse);

      expect(createCommunitySpy).toHaveBeenCalledWith({
        name: 'Tech Enthusiasts',
        description: 'A community for technology lovers.',
        isPrivate: false,
        members: [],
        admin: 'user1',
        blacklist: [],
        pollsEnabled: true,
        leaderboardEnabled: true,
        showPassword: false,
      });
    });

    it('should return 400 if name is missing', async () => {
      const invalidPayload = {
        description: 'A community for technology lovers.',
        admin: 'user1',
      };

      const response = await supertest(app).post('/community/createCommunity').send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name, description, or admin is required');
    });

    it('should return 500 on service error', async () => {
      createCommunitySpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).post('/community/createCommunity').send({
        name: 'Tech Enthusiasts',
        description: 'A community for technology lovers.',
        admin: 'user1',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Service error' });
    });
    it('should return 500 with error object if service throws an error', async () => {
      const errorMessage = 'Database connection error';
      const communityData = {
        name: 'Test Community',
        description: 'A test community',
        admin: 'testAdmin',
      };

      // Mock the createCommunity function to throw an error
      createCommunitySpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app).post('/community/createCommunity').send(communityData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: errorMessage });
      expect(createCommunitySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: communityData.name,
          description: communityData.description,
          admin: communityData.admin,
        }),
      );
    });
  });
  describe('GET /community/getCommunities', () => {
    const getCommunitiesSpy = jest.spyOn(communityService, 'getCommunities');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch all communities successfully', async () => {
      const mockCommunities = [
        {
          _id: new mongoose.Types.ObjectId(),
          communityId: new mongoose.Types.ObjectId().toString(),
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          isPrivate: false,
          members: ['user1', 'user2', 'user3'],
          isJoined: false,
          admin: 'user1',
          createdAt: new Date().toISOString(),
          password: '',
          showPassword: false,
          pollsEnabled: false,
          leaderboardEnabled: false,
          blacklist: [],
        },
        {
          _id: new mongoose.Types.ObjectId(),
          communityId: new mongoose.Types.ObjectId().toString(),
          name: 'Art Community',
          description: 'A community for art lovers',
          isPrivate: false,
          members: ['user2', 'user4'],
          isJoined: true,
          admin: 'user2',
          createdAt: new Date().toISOString(),
          password: '',
          showPassword: false,
          pollsEnabled: false,
          leaderboardEnabled: false,
          blacklist: [],
        },
      ];

      getCommunitiesSpy.mockResolvedValueOnce(mockCommunities);
      const response = await supertest(app).get('/community/getCommunities');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject([
        {
          communityId: expect.any(String),
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          isPrivate: false,
          members: ['user1', 'user2', 'user3'],
          isJoined: false,
          admin: 'user1',
          showPassword: false,
          pollsEnabled: false,
          leaderboardEnabled: false,
          blacklist: [],
        },
        {
          communityId: expect.any(String),
          name: 'Art Community',
          description: 'A community for art lovers',
          isPrivate: false,
          members: ['user2', 'user4'],
          isJoined: true,
          admin: 'user2',
          showPassword: false,
          pollsEnabled: false,
          leaderboardEnabled: false,
          blacklist: [],
        },
      ]);

      expect(getCommunitiesSpy).toHaveBeenCalled();
    });
    it('should handle non-Error object exceptions', async () => {
      // Mock service to throw a string instead of an Error object
      const errorString = 'String error without Error object';
      getCommunitiesSpy.mockImplementationOnce(() => {
        throw errorString;
      });

      const response = await supertest(app).get('/community/getCommunities');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain(errorString);
      expect(getCommunitiesSpy).toHaveBeenCalled();
    });

    it('should return 500 if service returns an error object', async () => {
      const errorMsg = 'Failed to fetch communities';
      const serviceError = new Error(errorMsg);

      getCommunitiesSpy.mockImplementationOnce(() => {
        throw serviceError;
      });

      const response = await supertest(app).get('/community/getCommunities');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain(errorMsg);
      expect(getCommunitiesSpy).toHaveBeenCalled();
    });

    it('should return 500 if service throws an error', async () => {
      getCommunitiesSpy.mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });

      const response = await supertest(app).get('/community/getCommunities');
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Database connection error');
      expect(getCommunitiesSpy).toHaveBeenCalled();
    });

    it('should handle empty array result from service', async () => {
      getCommunitiesSpy.mockResolvedValueOnce([]);

      const response = await supertest(app).get('/community/getCommunities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(getCommunitiesSpy).toHaveBeenCalled();
    });
  });
  describe('GET /community/getCommunityByName/:name', () => {
    const getCommunityByNameSpy = jest.spyOn(communityService, 'getCommunityByName');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully get a community by name', async () => {
      const communityName = 'Tech Community';

      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        communityId: new mongoose.Types.ObjectId().toString(),
        name: communityName,
        description: 'A community for tech enthusiasts',
        isPrivate: false,
        members: ['user1', 'user2', 'user3'],
        isJoined: true,
        admin: 'user1',
        password: '',
        createdAt: new Date().toISOString(),
        showPassword: false,
        pollsEnabled: false,
        leaderboardEnabled: false,
        blacklist: [],
      };

      getCommunityByNameSpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app).get(`/community/getCommunityByName/${communityName}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: communityName,
        description: 'A community for tech enthusiasts',
        members: ['user1', 'user2', 'user3'],
      });
      expect(getCommunityByNameSpy).toHaveBeenCalledWith(communityName);
    });

    it('should return 500 if community is not found', async () => {
      const nonExistentCommunity = 'NonExistentCommunity';
      const errorMessage = 'Community not found';

      getCommunityByNameSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app).get(
        `/community/getCommunityByName/${nonExistentCommunity}`,
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.stringContaining(errorMessage),
      });
      expect(getCommunityByNameSpy).toHaveBeenCalledWith(nonExistentCommunity);
    });

    it('should return 500 if service throws an error', async () => {
      const communityName = 'Tech Community';
      const errorMessage = 'Database connection error';

      getCommunityByNameSpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app).get(`/community/getCommunityByName/${communityName}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.stringContaining(errorMessage),
      });
      expect(getCommunityByNameSpy).toHaveBeenCalledWith(communityName);
    });
    it('should return 500 with error object if service throws an Error object', async () => {
      const communityName = 'NonExistentCommunity';
      const errorMessage = 'Community not found';

      // Mock the service to throw an Error object
      getCommunityByNameSpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app).get(`/community/getCommunityByName/${communityName}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: `Service error: ${errorMessage}` });
      expect(getCommunityByNameSpy).toHaveBeenCalledWith(communityName);
    });

    it('should return 500 with error object if service returns an error object', async () => {
      const communityName = 'NonExistentCommunity';
      const errorMessage = 'Community not found';

      // Mock the service to return an object with an error property
      getCommunityByNameSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app).get(`/community/getCommunityByName/${communityName}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: `Service error: ${errorMessage}` });
      expect(getCommunityByNameSpy).toHaveBeenCalledWith(communityName);
    });

    it('should return 500 with error object if service throws a non-Error object', async () => {
      const communityName = 'NonExistentCommunity';
      const errorString = 'String error without Error object';

      // Mock the service to throw a string instead of an Error object
      getCommunityByNameSpy.mockImplementationOnce(() => {
        throw errorString;
      });

      const response = await supertest(app).get(`/community/getCommunityByName/${communityName}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: `Service error: ${errorString}` });
      expect(getCommunityByNameSpy).toHaveBeenCalledWith(communityName);
    });
  });
  describe('POST /community/joinCommunity', () => {
    const joinCommunitySpy = jest.spyOn(communityService, 'joinCommunity');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully join a community', async () => {
      const communityName = 'Tech Community';
      const username = 'testUser';

      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        communityId: new mongoose.Types.ObjectId().toString(),
        name: communityName,
        description: 'A community for tech enthusiasts',
        isPrivate: false,
        members: ['existingUser', username],
        isJoined: true,
        admin: 'existingUser',
        password: '',
        createdAt: new Date().toISOString(),
        showPassword: false,
        pollsEnabled: false,
        leaderboardEnabled: false,
        blacklist: [],
      };

      joinCommunitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .post('/community/joinCommunity')
        .send({ communityName, username });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: communityName,
        members: expect.arrayContaining([username]),
      });
      expect(joinCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });

    it('should return 500 if communityName is missing', async () => {
      const response = await supertest(app)
        .post('/community/joinCommunity')
        .send({ username: 'testUser' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when joining community: Invalid request');
      expect(joinCommunitySpy).not.toHaveBeenCalled();
    });

    it('should return 500 if username is missing', async () => {
      const response = await supertest(app)
        .post('/community/joinCommunity')
        .send({ communityName: 'Tech Community' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when joining community: Invalid request');
      expect(joinCommunitySpy).not.toHaveBeenCalled();
    });

    it('should return 500 if the request body is empty', async () => {
      const response = await supertest(app).post('/community/joinCommunity').send({});

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when joining community: Invalid request');
      expect(joinCommunitySpy).not.toHaveBeenCalled();
    });

    it('should return 500 if service returns an error object', async () => {
      const communityName = 'NonExistentCommunity';
      const username = 'testUser';
      const errorMessage = 'Community not found';

      joinCommunitySpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post('/community/joinCommunity')
        .send({ communityName, username });

      expect(response.status).toBe(500);
      expect(response.text).toContain(`Error when joining community: ${errorMessage}`);
      expect(joinCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });

    it('should return 500 if service throws an error', async () => {
      const communityName = 'Tech Community';
      const username = 'testUser';
      const errorMessage = 'Database connection error';

      joinCommunitySpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app)
        .post('/community/joinCommunity')
        .send({ communityName, username });

      expect(response.status).toBe(500);
      expect(response.text).toContain(`Error when joining community: ${errorMessage}`);
      expect(joinCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });
  });
  describe('GET /community/getGroupChatsByCommunity/:communityName', () => {
    const getGroupChatsByCommunityIdSpy = jest.spyOn(
      communityService,
      'getGroupChatsByCommunityId',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch group chats for a community successfully', async () => {
      const communityName = 'Tech Enthusiasts';
      const communityId = new mongoose.Types.ObjectId().toString();

      const mockDateObj = new Date();

      const mockGroupChats = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'General Chat',
          participants: ['user1', 'user2'],
          messages: [],
          creator: 'user1',
          communityId,
          createdAt: mockDateObj,
          updatedAt: mockDateObj,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Tech Talk',
          participants: ['user1', 'user3'],
          messages: [],
          creator: 'user1',
          communityId,
          createdAt: mockDateObj,
          updatedAt: mockDateObj,
        },
      ];

      getGroupChatsByCommunityIdSpy.mockResolvedValueOnce(mockGroupChats);

      const mockCommunity = {
        _id: communityId,
        name: communityName,
        description: 'A community for tech enthusiasts',
        isPrivate: false,
        members: ['user1', 'user2', 'user3'],
      };

      jest.spyOn(CommunityModel, 'findOne').mockResolvedValueOnce(mockCommunity);
      getGroupChatsByCommunityIdSpy.mockResolvedValueOnce(mockGroupChats);

      const response = await supertest(app).get(
        `/community/getGroupChatsByCommunity/${communityName}`,
      );

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject([
        {
          name: 'General Chat',
          participants: ['user1', 'user2'],
          creator: 'user1',
          communityId,
        },
        {
          name: 'Tech Talk',
          participants: ['user1', 'user3'],
          creator: 'user1',
          communityId,
        },
      ]);

      expect(getGroupChatsByCommunityIdSpy).toHaveBeenCalledWith(communityId);
    });

    it('should return 404 if community is not found', async () => {
      const nonExistentCommunity = 'NonExistentCommunity';

      jest.spyOn(CommunityModel, 'findOne').mockResolvedValueOnce(null);
      const response = await supertest(app).get(
        `/community/getGroupChatsByCommunity/${nonExistentCommunity}`,
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'COMMUNITY not found' });
      expect(getGroupChatsByCommunityIdSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if an error occurs during community lookup', async () => {
      const communityName = 'Tech Enthusiasts';

      jest.spyOn(CommunityModel, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });

      const response = await supertest(app).get(
        `/community/getGroupChatsByCommunity/${communityName}`,
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database connection error' });
      expect(getGroupChatsByCommunityIdSpy).not.toHaveBeenCalled();
    });
  });
  describe('POST /community/deleteMessageFromGroupChat/:chatId', () => {
    const deleteMessageFromGroupChatSpy = jest.spyOn(
      communityService,
      'deleteMessageFromGroupChat',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully delete a message from a group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'admin123';

      const mockUpdatedChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        name: 'Test Group Chat',
        participants: ['admin123', 'user1', 'user2'],
        messages: [new mongoose.Types.ObjectId()],
        creator: creatorName,
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      deleteMessageFromGroupChatSpy.mockResolvedValueOnce(mockUpdatedChat);

      const response = await supertest(app)
        .post(`/community/deleteMessageFromGroupChat/${chatId}`)
        .send({ creatorName, messageId });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: chatId,
        name: 'Test Group Chat',
        participants: ['admin123', 'user1', 'user2'],
        creator: creatorName,
      });
      expect(deleteMessageFromGroupChatSpy).toHaveBeenCalledWith(chatId, messageId, creatorName);
    });
    it('should return 400 if service returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'admin123';
      const errorMessage = 'Unauthorized deletion';

      deleteMessageFromGroupChatSpy.mockResolvedValueOnce({
        error: errorMessage,
      });

      const response = await supertest(app)
        .post(`/community/deleteMessageFromGroupChat/${chatId}`)
        .send({ creatorName, messageId });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: errorMessage,
      });
      expect(deleteMessageFromGroupChatSpy).toHaveBeenCalledWith(chatId, messageId, creatorName);
    });
    it('should return 400 if chatId is missing', async () => {
      const response = await supertest(app).post('/community/deleteMessageFromGroupChat/').send({
        creatorName: 'admin123',
        messageId: new mongoose.Types.ObjectId().toString(),
      });

      expect(response.status).toBe(404);
      expect(deleteMessageFromGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if messageId is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .post(`/community/deleteMessageFromGroupChat/${chatId}`)
        .send({ creatorName: 'admin123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing chatId, messageId, or creatorName',
      });
      expect(deleteMessageFromGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if creatorName is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .post(`/community/deleteMessageFromGroupChat/${chatId}`)
        .send({ messageId });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing chatId, messageId, or creatorName',
      });
      expect(deleteMessageFromGroupChatSpy).not.toHaveBeenCalled();
    });
    it('should return 500 if service throws an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'admin123';
      const errorMessage = 'Database connection error';

      deleteMessageFromGroupChatSpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app)
        .post(`/community/deleteMessageFromGroupChat/${chatId}`)
        .send({ creatorName, messageId });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: `Error deleting message: ${errorMessage}`,
      });
      expect(deleteMessageFromGroupChatSpy).toHaveBeenCalledWith(chatId, messageId, creatorName);
    });
  });
  describe('POST /community/removeParticipantFromGroupChat/:chatId', () => {
    const removeParticipantFromGroupChatSpy = jest.spyOn(
      communityService,
      'removeParticipantFromGroupChat',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should return 400 if service returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const participantName = 'user123';
      const creatorName = 'admin123';
      const errorMessage = 'Not authorized to remove participant';

      removeParticipantFromGroupChatSpy.mockResolvedValueOnce({
        error: errorMessage,
      });

      const response = await supertest(app)
        .post(`/community/removeParticipantFromGroupChat/${chatId}`)
        .send({ participantName, creatorName });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: errorMessage,
      });
      expect(removeParticipantFromGroupChatSpy).toHaveBeenCalledWith(
        chatId,
        participantName,
        creatorName,
      );
    });
    it('should successfully remove a participant from a group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const participantName = 'user123';
      const creatorName = 'admin123';

      const mockUpdatedChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        name: 'Test Group Chat',
        participants: ['admin123', 'user456'],
        messages: [new mongoose.Types.ObjectId()],
        creator: creatorName,
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      removeParticipantFromGroupChatSpy.mockResolvedValueOnce(mockUpdatedChat);

      const response = await supertest(app)
        .post(`/community/removeParticipantFromGroupChat/${chatId}`)
        .send({ participantName, creatorName });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: chatId,
        name: 'Test Group Chat',
        participants: ['admin123', 'user456'],
        creator: creatorName,
      });
      expect(removeParticipantFromGroupChatSpy).toHaveBeenCalledWith(
        chatId,
        participantName,
        creatorName,
      );
    });

    it('should return 400 if chatId is missing', async () => {
      const response = await supertest(app)
        .post('/community/removeParticipantFromGroupChat/')
        .send({
          participantName: 'user123',
          creatorName: 'admin123',
        });

      expect(response.status).toBe(404);
      expect(removeParticipantFromGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if participantName is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .post(`/community/removeParticipantFromGroupChat/${chatId}`)
        .send({ creatorName: 'admin123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing chatId, participantName, or creatorName',
      });
      expect(removeParticipantFromGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if creatorName is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .post(`/community/removeParticipantFromGroupChat/${chatId}`)
        .send({ participantName: 'user123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Missing chatId, participantName, or creatorName',
      });
      expect(removeParticipantFromGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if service throws an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const participantName = 'user123';
      const creatorName = 'admin123';
      const errorMessage = 'Database connection error';

      removeParticipantFromGroupChatSpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app)
        .post(`/community/removeParticipantFromGroupChat/${chatId}`)
        .send({ participantName, creatorName });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: `Error removing participant: ${errorMessage}`,
      });
      expect(removeParticipantFromGroupChatSpy).toHaveBeenCalledWith(
        chatId,
        participantName,
        creatorName,
      );
    });
  });
  describe('GET /community/getGroupChat/:chatId', () => {
    const getGroupChatByIdSpy = jest.spyOn(communityService, 'getGroupChatById');
    const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully retrieve a group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const mockFoundChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        name: 'Test Group Chat',
        participants: ['user1', 'user2', 'user3'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'user1',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getGroupChatByIdSpy.mockResolvedValueOnce(mockFoundChat);

      populateDocumentSpy.mockImplementation(() =>
        Promise.resolve({
          _id: mockFoundChat._id,
          name: mockFoundChat.name,
          participants: mockFoundChat.participants,
          messages: [
            {
              _id: new mongoose.Types.ObjectId(),
              msg: 'Hello everyone!',
              msgFrom: 'user1',
              msgDateTime: new Date(),
              type: 'group',
              user: { _id: new mongoose.Types.ObjectId(), username: 'user1' },
            },
          ],
          creator: mockFoundChat.creator,
          communityId: mockFoundChat.communityId,
          createdAt: mockFoundChat.createdAt,
          updatedAt: mockFoundChat.updatedAt,
        }),
      );

      const response = await supertest(app).get(`/community/getGroupChat/${chatId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: chatId,
        name: 'Test Group Chat',
        participants: ['user1', 'user2', 'user3'],
        creator: 'user1',
      });

      expect(response.body.messages[0]).toHaveProperty('msg', 'Hello everyone!');
      expect(response.body.messages[0]).toHaveProperty('user');

      expect(getGroupChatByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatId, 'groupchat');
    });

    it('should return 500 if group chat is not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const errorMessage = 'Group chat not found';

      getGroupChatByIdSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app).get(`/community/getGroupChat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain(`BRUHHH Error retrieving GROUP chat: ${errorMessage}`);
      expect(getGroupChatByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if population fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const errorMessage = 'Population failed';

      const mockFoundChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        name: 'Test Group Chat',
        participants: ['user1', 'user2', 'user3'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'user1',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getGroupChatByIdSpy.mockResolvedValueOnce(mockFoundChat);
      populateDocumentSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app).get(`/community/getGroupChat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain(`BRUHHH Error retrieving GROUP chat: ${errorMessage}`);
      expect(getGroupChatByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatId, 'groupchat');
    });

    it('should return 500 if getGroupChatById throws an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const errorMessage = 'Database connection error';

      getGroupChatByIdSpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app).get(`/community/getGroupChat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain(`BRUHHH Error retrieving GROUP chat: ${errorMessage}`);
      expect(getGroupChatByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if populateDocument throws an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const errorMessage = 'Population error';

      const mockFoundChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        name: 'Test Group Chat',
        participants: ['user1', 'user2', 'user3'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'user1',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getGroupChatByIdSpy.mockResolvedValueOnce(mockFoundChat);
      populateDocumentSpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app).get(`/community/getGroupChat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain(`BRUHHH Error retrieving GROUP chat: ${errorMessage}`);
      expect(getGroupChatByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatId, 'groupchat');
    });
  });
  describe('POST /community/addMessageToGroupChat/:chatId', () => {
    const saveSingleGroupMessageSpy = jest.spyOn(communityService, 'saveSingleGroupMessage');
    const addMessageToGroupChatSpy = jest.spyOn(communityService, 'addMessageToGroupChat');
    const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

    it('should add a message to group chat successfully', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload = {
        msg: 'Hello everyone!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
        type: 'group',
      };

      const serializedPayload = {
        ...messagePayload,
        msgDateTime: messagePayload.msgDateTime.toISOString(),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        msg: messagePayload.msg,
        msgFrom: messagePayload.msgFrom,
        msgDateTime: messagePayload.msgDateTime,
        type: 'group' as const,
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: 'user1',
        },
      };

      const chatResponse = {
        _id: chatId,
        participants: ['user1', 'user2'],
        messages: [messageResponse._id],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        creator: 'user1',
        name: 'Test Group Chat',
        communityId: 'community123',
      };

      const populatedChatResponse = {
        _id: chatId,
        participants: ['user1', 'user2'],
        messages: [messageResponse],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        creator: 'user1',
        name: 'Test Group Chat',
        communityId: 'community123',
      };

      saveSingleGroupMessageSpy.mockResolvedValue(messageResponse);
      addMessageToGroupChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChatResponse);

      const response = await supertest(app)
        .post(`/community/addMessageToGroupChat/${chatId}`)
        .send(messagePayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: populatedChatResponse._id.toString(),
        participants: populatedChatResponse.participants.map(participant => participant.toString()),
        messages: populatedChatResponse.messages.map(message => ({
          ...message,
          _id: message._id.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: populatedChatResponse.createdAt.toISOString(),
        updatedAt: populatedChatResponse.updatedAt.toISOString(),
      });

      expect(saveSingleGroupMessageSpy).toHaveBeenCalledWith(serializedPayload);
      expect(addMessageToGroupChatSpy).toHaveBeenCalledWith(
        chatId.toString(),
        messageResponse._id.toString(),
      );
      expect(populateDocumentSpy).toHaveBeenCalledWith(
        populatedChatResponse._id.toString(),
        'groupchat',
      );
    });
    it('should return 500 if addMessageToGroupChat returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        msg: messagePayload.msg,
        msgFrom: messagePayload.msgFrom,
        msgDateTime: messagePayload.msgDateTime,
        type: 'group' as const,
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: 'user1',
        },
      };
      saveSingleGroupMessageSpy.mockResolvedValueOnce(messageResponse);

      const errorMessage = 'Failed to add message to chat';
      addMessageToGroupChatSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/addMessageToGroupChat/${chatId}`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain(`Error adding a message to chattttttt: ${errorMessage}`);

      expect(saveSingleGroupMessageSpy).toHaveBeenCalledWith({
        ...messagePayload,
        msgDateTime: messagePayload.msgDateTime.toISOString(),
        type: 'group',
      });
      expect(addMessageToGroupChatSpy).toHaveBeenCalledWith(
        chatId.toString(),
        messageResponse._id.toString(),
      );
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });
    it('should return 400 if message data is invalid', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const invalidPayload = {};

      const response = await supertest(app)
        .post(`/community/addMessageToGroupChat/${chatId}`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.text).toBe('Missing chatId, msg, or msgFrom');

      expect(saveSingleGroupMessageSpy).not.toHaveBeenCalled();
      expect(addMessageToGroupChatSpy).not.toHaveBeenCalled();
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if message creation fails', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      saveSingleGroupMessageSpy.mockResolvedValue({ error: 'Failed to create message' });

      const response = await supertest(app)
        .post(`/community/addMessageToGroupChat/${chatId}`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chattttttt');
      expect(response.text).toContain('Failed to create message');

      expect(saveSingleGroupMessageSpy).toHaveBeenCalled();
      expect(addMessageToGroupChatSpy).not.toHaveBeenCalled();
    });
  });
  describe('POST /community/addParticipantToGroupChat/:chatId', () => {
    const findByIdSpy = jest.spyOn(GroupChatModel, 'findById');
    const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

    beforeEach(() => {
      jest.clearAllMocks();

      const socket = { to: jest.fn() };
      jest.spyOn(socket, 'to').mockReturnValue({
        emit: jest.fn(),
      });
    });

    it('should add a participant to an existing group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'newParticipant';

      const saveMock = jest.fn().mockResolvedValue(true);

      const mockGroupChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: ['user1', 'user2'],
        messages: [],
        creator: 'user1',
        name: 'Test Group Chat',
        communityId: 'community123',
        save: saveMock,
      };

      const mockPopulatedGroupChat = {
        _id: mockGroupChat._id,
        participants: [...mockGroupChat.participants, username],
        messages: [],
        creator: mockGroupChat.creator,
        name: mockGroupChat.name,
        communityId: mockGroupChat.communityId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findByIdSpy.mockResolvedValueOnce(mockGroupChat);
      populateDocumentSpy.mockResolvedValueOnce(mockPopulatedGroupChat);

      const response = await supertest(app)
        .post(`/community/addParticipantToGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: mockGroupChat._id.toString(),
        participants: expect.arrayContaining(['user1', 'user2', 'newParticipant']),
        name: 'Test Group Chat',
        communityId: 'community123',
      });

      expect(findByIdSpy).toHaveBeenCalledWith(chatId);
      expect(saveMock).toHaveBeenCalled();
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatId, 'groupchat');
    }, 30000);

    it('should return 400 if username is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .post(`/community/addParticipantToGroupChat/${chatId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Missing chatId or username');

      expect(findByIdSpy).not.toHaveBeenCalled();
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 404 if group chat is not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'newParticipant';

      findByIdSpy.mockResolvedValueOnce(null);

      const response = await supertest(app)
        .post(`/community/addParticipantToGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(404);
      expect(response.text).toBe('Group chat not found');

      expect(findByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if user is already a participant', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'existingUser';

      const saveMock = jest.fn().mockResolvedValue(true);

      const mockGroupChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: ['existingUser', 'user2'],
        messages: [],
        creator: 'user1',
        name: 'Test Group Chat',
        communityId: 'community123',
        save: saveMock,
      };

      findByIdSpy.mockResolvedValueOnce(mockGroupChat);

      const response = await supertest(app)
        .post(`/community/addParticipantToGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(400);
      expect(response.text).toBe('You are already a participant');

      expect(findByIdSpy).toHaveBeenCalledWith(chatId);
      expect(saveMock).not.toHaveBeenCalled();
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if an error occurs', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'newParticipant';

      findByIdSpy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app)
        .post(`/community/addParticipantToGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a participant to chat: Database error');

      expect(findByIdSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).not.toHaveBeenCalled();
    });
  });
  describe('POST /community/isUserInGroupChat/:chatId', () => {
    const isUserInGroupChatSpy = jest.spyOn(communityService, 'isUserInGroupChat');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return true if user is in the group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'existingUser';

      isUserInGroupChatSpy.mockResolvedValueOnce(true);

      const response = await supertest(app)
        .post(`/community/isUserInGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ isParticipant: true });

      expect(isUserInGroupChatSpy).toHaveBeenCalledWith(chatId, username);
    });

    it('should return false if user is not in the group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'nonMemberUser';

      isUserInGroupChatSpy.mockResolvedValueOnce(false);

      const response = await supertest(app)
        .post(`/community/isUserInGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ isParticipant: false });

      expect(isUserInGroupChatSpy).toHaveBeenCalledWith(chatId, username);
    });

    it('should return 400 if chatId is missing', async () => {
      const response = await supertest(app)
        .post('/community/isUserInGroupChat/')
        .send({ username: 'testUser' });

      expect(response.status).toBe(404);

      expect(isUserInGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if username is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app).post(`/community/isUserInGroupChat/${chatId}`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing chatId or username' });

      expect(isUserInGroupChatSpy).not.toHaveBeenCalled();
    });

    it('should return 500 if service throws an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'testUser';
      const errorMessage = 'Group chat not found';

      isUserInGroupChatSpy.mockRejectedValueOnce(new Error(errorMessage));

      const response = await supertest(app)
        .post(`/community/isUserInGroupChat/${chatId}`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: `Error checking user in group chat: ${errorMessage}`,
      });

      expect(isUserInGroupChatSpy).toHaveBeenCalledWith(chatId, username);
    });
  });
  describe('POST /community/createPoll/:communityName', () => {
    const findOneSpy = jest.spyOn(CommunityModel, 'findOne');
    const createPollSpy = jest.spyOn(communityService, 'createPoll');

    beforeEach(() => jest.clearAllMocks());

    it('should successfully create a poll', async () => {
      const communityId = new mongoose.Types.ObjectId().toString();

      findOneSpy.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(communityId),
        toHexString: () => communityId,
      });

      const mockPoll = {
        _id: new mongoose.Types.ObjectId(),
        question: 'Test question',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        communityId,
        voters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createPollSpy.mockResolvedValueOnce(mockPoll);

      const response = await supertest(app)
        .post('/community/createPoll/TestCommunity')
        .send({
          question: 'Test question',
          choices: [
            { text: 'Option 1', votes: 0 },
            { text: 'Option 2', votes: 0 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        question: 'Test question',
        choices: expect.arrayContaining([expect.objectContaining({ choice: 'Option 1' })]),
      });

      expect(findOneSpy).toHaveBeenCalledWith({ name: 'TestCommunity' });
      expect(createPollSpy).toHaveBeenCalledWith({
        question: 'Test question',
        choices: expect.arrayContaining([
          expect.objectContaining({ choice: 'Option 1', votes: 0 }),
        ]),
        voters: [],
        communityId,
      });
    });
    it('should return 500 if createPoll returns an error', async () => {
      const communityName = 'TestCommunity';
      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        name: communityName,
        toHexString: () => 'communityId',
      };

      findOneSpy.mockResolvedValueOnce(mockCommunity);

      const errorMessage = 'Failed to create poll';
      createPollSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/createPoll/${communityName}`)
        .send({
          question: 'Test question',
          choices: [
            { text: 'Option 1', votes: 0 },
            { text: 'Option 2', votes: 0 },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain(`Service error: ${errorMessage}`);

      expect(findOneSpy).toHaveBeenCalledWith({ name: communityName });
      expect(createPollSpy).toHaveBeenCalledWith({
        question: 'Test question',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: [],
        communityId: mockCommunity._id.toHexString(),
      });
    });
    it('should validate poll data', async () => {
      const response = await supertest(app)
        .post('/community/createPoll/TestCommunity')
        .send({ question: 'Test' });

      expect(response.status).toBe(400);
      expect(findOneSpy).not.toHaveBeenCalled();
    });

    it('should return 404 if community not found', async () => {
      findOneSpy.mockResolvedValueOnce(null);

      const response = await supertest(app)
        .post('/community/createPoll/NonExistent')
        .send({
          question: 'Test question',
          choices: [
            { text: 'Option 1', votes: 0 },
            { text: 'Option 2', votes: 0 },
          ],
        });

      expect(response.status).toBe(404);
      expect(createPollSpy).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      findOneSpy.mockResolvedValueOnce({
        _id: 'communityId',
        toHexString: () => 'communityId',
      });
      createPollSpy.mockResolvedValueOnce({ error: 'Service error' });

      const response = await supertest(app)
        .post('/community/createPoll/TestCommunity')
        .send({
          question: 'Test question',
          choices: [
            { text: 'Option 1', votes: 0 },
            { text: 'Option 2', votes: 0 },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Service error');
    });
    it('should return 500 with error object if service throws a non-Error object', async () => {
      const communityName = 'TestCommunity';
      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        name: communityName,
        toHexString: () => mockCommunity._id.toString(),
      };

      findOneSpy.mockResolvedValueOnce(mockCommunity);

      // Mock the createPoll service to throw a string instead of an Error object
      const errorString = 'Service error';
      createPollSpy.mockImplementationOnce(() => {
        throw errorString;
      });

      const response = await supertest(app)
        .post(`/community/createPoll/${communityName}`)
        .send({
          question: 'Test question',
          choices: [
            { text: 'Option 1', votes: 0 },
            { text: 'Option 2', votes: 0 },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: `Service error: Service error` });

      expect(findOneSpy).toHaveBeenCalledWith({ name: communityName });
      expect(createPollSpy).toHaveBeenCalledWith({
        question: 'Test question',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: [],
        communityId: mockCommunity._id.toHexString(),
      });
    });
    it('should return 500 with error message when service throws an error', async () => {
      const communityName = 'TestCommunity';

      // Mock the community
      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        toHexString() {
          return this._id.toString();
        },
      };

      // Reset all mocks to ensure clean state
      jest.resetAllMocks();

      findOneSpy.mockResolvedValueOnce(mockCommunity);

      // Mock the service to throw a specific error
      createPollSpy.mockImplementationOnce(() => {
        throw new Error('Test error message');
      });

      const response = await supertest(app)
        .post(`/community/createPoll/${communityName}`)
        .send({
          question: 'Test question',
          choices: [
            { text: 'Option 1', votes: 0 },
            { text: 'Option 2', votes: 0 },
          ],
        });

      expect(response.status).toBe(500);
      // Don't make assumptions about the exact error message format
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error).toContain('Service error');
      expect(createPollSpy).toHaveBeenCalled();
    });
    it('should handle service errors and return 500 status', async () => {
      // Increase timeout for this test
      jest.setTimeout(10000);

      try {
        // Setup mocks for voteOnPoll to throw error
        const pollId = new mongoose.Types.ObjectId();
        const mockPoll = {
          _id: pollId,
          question: 'Test Question',
          choices: [{ choice: 'Option 1', votes: 0 }],
          voters: [],
        };

        // Mock PollModel.findById to return a valid poll
        jest.spyOn(PollModel, 'findById').mockResolvedValue(mockPoll);

        // Mock voteOnPoll to throw an error
        jest.spyOn(communityService, 'voteOnPoll').mockImplementation(() => {
          throw new Error('Test service error');
        });

        // Make request
        const response = await supertest(app).post('/community/voteOnPoll').send({
          pollId: pollId.toString(),
          choiceIndex: 0,
          username: 'testUser',
        });

        // Assert response
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        throw error;
      } finally {
        // Reset timeout
        jest.setTimeout(5000);
      }
    }, 10000); // Add timeout to the test itself
  });
  describe('GET /community/getPollsByCommunity/:communityName', () => {
    const findOneSpy = jest.spyOn(CommunityModel, 'findOne');
    const findPollsSpy = jest.spyOn(PollModel, 'find');

    beforeEach(() => jest.clearAllMocks());

    it('should fetch polls for a community', async () => {
      const communityId = new mongoose.Types.ObjectId();
      findOneSpy.mockResolvedValueOnce({ _id: communityId });
      findPollsSpy.mockResolvedValueOnce([{ question: 'Test poll' }]);

      const response = await supertest(app).get('/community/getPollsByCommunity/TestCommunity');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ question: 'Test poll' }]);
      expect(findPollsSpy).toHaveBeenCalledWith({ communityId });
    });

    it('should return 404 if community not found', async () => {
      findOneSpy.mockResolvedValueOnce(null);
      const response = await supertest(app).get('/community/getPollsByCommunity/NonExistent');

      expect(response.status).toBe(404);
      expect(findPollsSpy).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      findOneSpy.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      const response = await supertest(app).get('/community/getPollsByCommunity/TestCommunity');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
  describe('POST /community/voteOnPoll', () => {
    const voteOnPollSpy = jest.spyOn(communityService, 'voteOnPoll');

    beforeEach(() => jest.clearAllMocks());

    it('should successfully vote on a poll', async () => {
      const pollId = new mongoose.Types.ObjectId().toString();
      const communityId = new mongoose.Types.ObjectId().toString();
      const currentDate = new Date();

      const mockPoll = {
        _id: pollId,
        question: 'Test Poll',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: [],
        communityId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(mockPoll);

      const updatedPoll: PollResponse = {
        _id: new mongoose.Types.ObjectId(pollId),
        question: 'Test Poll',
        choices: [
          { choice: 'Option 1', votes: 1 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: ['testUser'],
        communityId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      voteOnPollSpy.mockResolvedValueOnce(updatedPoll);

      const response = await supertest(app).post('/community/voteOnPoll').send({
        pollId,
        choiceIndex: 0,
        username: 'testUser',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Vote recorded successfully');

      expect(response.body.poll).toEqual(
        expect.objectContaining({
          question: 'Test Poll',
          choices: [
            { choice: 'Option 1', votes: 1 },
            { choice: 'Option 2', votes: 0 },
          ],
          voters: ['testUser'],
          communityId: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });

    it('should return 404 if poll is not found', async () => {
      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(null);

      const response = await supertest(app).post('/community/voteOnPoll').send({
        pollId: new mongoose.Types.ObjectId().toString(),
        choiceIndex: 0,
        username: 'testUser',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Poll not found');
    });

    it('should return 400 if user has already voted', async () => {
      const pollId = new mongoose.Types.ObjectId().toString();
      const communityId = new mongoose.Types.ObjectId().toString();
      const currentDate = new Date();

      const mockPoll = {
        _id: pollId,
        question: 'Test Poll',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: ['testUser'],
        communityId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(mockPoll);

      const response = await supertest(app).post('/community/voteOnPoll').send({
        pollId,
        choiceIndex: 0,
        username: 'testUser',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User has already voted in this poll');
    });
    it('should return 400 if vote result is invalid', async () => {
      const pollId = new mongoose.Types.ObjectId().toString();
      const communityId = new mongoose.Types.ObjectId().toString();
      const currentDate = new Date();

      const mockPoll = {
        _id: pollId,
        question: 'Test Poll',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: [],
        communityId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(mockPoll);

      const invalidResponse = {
        randomProperty: 'value',
      } as unknown as PollResponse;

      voteOnPollSpy.mockResolvedValueOnce(invalidResponse);

      const response = await supertest(app).post('/community/voteOnPoll').send({
        pollId,
        choiceIndex: 0,
        username: 'testUser',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid poll response');
    });

    it('should return 400 if choice index is invalid', async () => {
      const pollId = new mongoose.Types.ObjectId().toString();
      const communityId = new mongoose.Types.ObjectId().toString();
      const currentDate = new Date();

      const mockPoll = {
        _id: pollId,
        question: 'Test Poll',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: [],
        communityId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(mockPoll);

      const response = await supertest(app).post('/community/voteOnPoll').send({
        pollId,
        choiceIndex: 2,
        username: 'testUser',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid choice index');
    });

    it('should handle service errors', async () => {
      const pollId = new mongoose.Types.ObjectId().toString();
      const communityId = new mongoose.Types.ObjectId().toString();
      const currentDate = new Date();

      const mockPoll = {
        _id: pollId,
        question: 'Test Poll',
        choices: [
          { choice: 'Option 1', votes: 0 },
          { choice: 'Option 2', votes: 0 },
        ],
        voters: [],
        communityId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(mockPoll);
      voteOnPollSpy.mockRejectedValueOnce(new Error('Service error'));

      const response = await supertest(app).post('/community/voteOnPoll').send({
        pollId,
        choiceIndex: 0,
        username: 'testUser',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Service error');
    });
    it('should return 400 if required fields are missing', async () => {
      const response = await supertest(app).post('/community/voteOnPoll').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing pollId, choiceIndex, or username');
    });
  });

  describe('POST /community/addMemberToCommunity/:communityName', () => {
    const joinCommunitySpy = jest.spyOn(communityService, 'joinCommunity');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully add a member to a community', async () => {
      const communityName = 'Test Community';
      const username = 'newUser';

      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        communityId: new mongoose.Types.ObjectId().toString(),
        name: communityName,
        members: [username],
        description: 'A test community',
        isPrivate: false,
        admin: 'admin123',
        createdAt: new Date().toISOString(),
        isJoined: true,
        showPassword: false,
        pollsEnabled: false,
        leaderboardEnabled: false,
        blacklist: [],
      };

      joinCommunitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .post(`/community/addMemberToCommunity/${communityName}`)
        .send({ username });

      expect(response.status).toBe(200);

      const expectedCommunity = {
        ...mockCommunity,
        _id: mockCommunity._id.toString(),
      };

      expect(response.body).toMatchObject(expectedCommunity);
      expect(joinCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });

    it('should return 400 if community name is missing', async () => {
      const response = await supertest(app)
        .post('/community/addMemberToCommunity/')
        .send({ username: 'newUser' });

      expect(response.status).toBe(404);
    });

    it('should return 400 if username is missing', async () => {
      const communityName = 'Test Community';
      const response = await supertest(app)
        .post(`/community/addMemberToCommunity/${communityName}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name and username are required');
    });

    it('should return 500 if service returns an error', async () => {
      const communityName = 'Test Community';
      const username = 'newUser';
      const errorMessage = 'Community not found';

      joinCommunitySpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/addMemberToCommunity/${communityName}`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toContain(`Error when adding member to community: ${errorMessage}`);
    });

    it('should handle unexpected service errors', async () => {
      const communityName = 'Test Community';
      const username = 'newUser';

      joinCommunitySpy.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const response = await supertest(app)
        .post(`/community/addMemberToCommunity/${communityName}`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when adding member to community: Unexpected error');
    });
  });
  describe('POST /community/banMemberFromCommunity/:communityName', () => {
    const banMemberFromCommunitySpy = jest.spyOn(communityService, 'banMemberFromCommunity');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully ban a member from a community', async () => {
      const communityName = 'Tech Community';
      const username = 'memberToBan';

      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        communityId: new mongoose.Types.ObjectId().toString(),
        name: communityName,
        description: 'A community for tech enthusiasts',
        isPrivate: false,
        members: ['admin', 'otherMember'],
        blacklist: [username],
        admin: 'admin',
        password: '',
        createdAt: new Date().toISOString(),
        showPassword: false,
        pollsEnabled: false,
        leaderboardEnabled: false,
        isJoined: false,
      };

      banMemberFromCommunitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .post(`/community/banMemberFromCommunity/${communityName}`)
        .send({ username });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: communityName,
        blacklist: expect.arrayContaining([username]),
      });
      expect(banMemberFromCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });

    it('should return 400 if communityName is missing from params', async () => {
      const response = await supertest(app)
        .post('/community/banMemberFromCommunity/')
        .send({ username: 'memberToBan' });

      expect(response.status).toBe(404); // Route not found
      expect(banMemberFromCommunitySpy).not.toHaveBeenCalled();
    });

    it('should return 400 if username is missing from body', async () => {
      const communityName = 'Tech Community';

      const response = await supertest(app)
        .post(`/community/banMemberFromCommunity/${communityName}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name and username are required');
      expect(banMemberFromCommunitySpy).not.toHaveBeenCalled();
    });

    it('should return 500 if service returns an error object', async () => {
      const communityName = 'Tech Community';
      const username = 'memberToBan';
      const errorMessage = 'User is not a member of the community';

      banMemberFromCommunitySpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/banMemberFromCommunity/${communityName}`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toBe(`Error when banning member from community: ${errorMessage}`);
      expect(banMemberFromCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });

    it('should return 500 if service throws an error', async () => {
      const communityName = 'Tech Community';
      const username = 'memberToBan';
      const errorMessage = 'Database connection error';

      banMemberFromCommunitySpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app)
        .post(`/community/banMemberFromCommunity/${communityName}`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toBe(`Error when banning member from community: ${errorMessage}`);
      expect(banMemberFromCommunitySpy).toHaveBeenCalledWith(communityName, username);
    });

    it('should return 400 if both communityName and username are missing', async () => {
      const response = await supertest(app).post('/community/banMemberFromCommunity/').send({});

      expect(response.status).toBe(404); // Route not found
      expect(banMemberFromCommunitySpy).not.toHaveBeenCalled();
    });

    it('should return 400 if sending empty request body to valid route', async () => {
      const communityName = 'Tech Community';

      const response = await supertest(app)
        .post(`/community/banMemberFromCommunity/${communityName}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name and username are required');
      expect(banMemberFromCommunitySpy).not.toHaveBeenCalled();
    });
  });
  describe('POST /community/updatePasswordVisibility/:communityName', () => {
    const updatePasswordVisibilitySpy = jest.spyOn(communityService, 'updatePasswordVisibility');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully update password visibility for a community', async () => {
      const communityName = 'Tech Community';
      const showPassword = true;

      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        communityId: new mongoose.Types.ObjectId().toString(),
        name: communityName,
        description: 'A community for tech enthusiasts',
        isPrivate: true,
        members: ['admin', 'member1', 'member2'],
        blacklist: [],
        admin: 'admin',
        password: 'password123',
        createdAt: new Date().toISOString(),
        showPassword,
        pollsEnabled: false,
        leaderboardEnabled: false,
        isJoined: false,
      };

      updatePasswordVisibilitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({ showPassword });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: communityName,
        showPassword,
      });
      expect(updatePasswordVisibilitySpy).toHaveBeenCalledWith(communityName, showPassword);
    });

    it('should successfully update password visibility to false for a community', async () => {
      const communityName = 'Tech Community';
      const showPassword = false;

      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        communityId: new mongoose.Types.ObjectId().toString(),
        name: communityName,
        description: 'A community for tech enthusiasts',
        isPrivate: true,
        members: ['admin', 'member1', 'member2'],
        blacklist: [],
        admin: 'admin',
        password: 'password123',
        createdAt: new Date().toISOString(),
        showPassword,
        pollsEnabled: false,
        leaderboardEnabled: false,
        isJoined: false,
      };

      updatePasswordVisibilitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({ showPassword });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: communityName,
        showPassword,
      });
      expect(updatePasswordVisibilitySpy).toHaveBeenCalledWith(communityName, showPassword);
    });

    it('should return 400 if communityName is missing from params', async () => {
      const response = await supertest(app)
        .post('/community/updatePasswordVisibility/')
        .send({ showPassword: true });

      expect(response.status).toBe(404); // Route not found
      expect(updatePasswordVisibilitySpy).not.toHaveBeenCalled();
    });

    it('should return 400 if showPassword is missing from body', async () => {
      const communityName = 'Tech Community';

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name and password visibility are required');
      expect(updatePasswordVisibilitySpy).not.toHaveBeenCalled();
    });

    it('should return 400 if showPassword is not a boolean', async () => {
      const communityName = 'Tech Community';

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({ showPassword: 'true' }); // String instead of boolean

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name and password visibility are required');
      expect(updatePasswordVisibilitySpy).not.toHaveBeenCalled();
    });

    it('should return 500 if service returns an error object', async () => {
      const communityName = 'Tech Community';
      const showPassword = true;
      const errorMessage = 'Community not found';

      updatePasswordVisibilitySpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({ showPassword });

      expect(response.status).toBe(500);
      expect(response.text).toBe(
        `Error when updating community password visibility: ${errorMessage}`,
      );
      expect(updatePasswordVisibilitySpy).toHaveBeenCalledWith(communityName, showPassword);
    });

    it('should return 500 if service throws an error', async () => {
      const communityName = 'Tech Community';
      const showPassword = true;
      const errorMessage = 'Database connection error';

      updatePasswordVisibilitySpy.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({ showPassword });

      expect(response.status).toBe(500);
      expect(response.text).toBe(
        `Error when updating community password visibility: ${errorMessage}`,
      );
      expect(updatePasswordVisibilitySpy).toHaveBeenCalledWith(communityName, showPassword);
    });

    it('should return 400 if sending empty request body to valid route', async () => {
      const communityName = 'Tech Community';

      const response = await supertest(app)
        .post(`/community/updatePasswordVisibility/${communityName}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community name and password visibility are required');
      expect(updatePasswordVisibilitySpy).not.toHaveBeenCalled();
    });
  });
  describe('GET /community/getTopNimWinners/:communityName', () => {
    const getTopNimWinnersSpy = jest.spyOn(communityService, 'getTopNimWinners');
    const findOneSpy = jest.spyOn(CommunityModel, 'findOne');

    beforeEach(() => jest.clearAllMocks());

    it('should successfully retrieve top Nim winners', async () => {
      const communityName = 'Test Community';
      const mockCommunity = { name: communityName, members: ['user1', 'user2'] };
      const mockWinners = [
        { username: 'user1', nimWins: 5 },
        { username: 'user2', nimWins: 3 },
      ];

      findOneSpy.mockResolvedValueOnce(mockCommunity);
      getTopNimWinnersSpy.mockResolvedValueOnce(mockWinners);

      const response = await supertest(app).get(`/community/getTopNimWinners/${communityName}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWinners);
    });

    it('should return 404 if community is not found', async () => {
      findOneSpy.mockResolvedValueOnce(null);

      const response = await supertest(app).get('/community/getTopNimWinners/NonExistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Community not found or has no members' });
    });

    it('should handle service errors', async () => {
      const communityName = 'Test Community';
      const mockCommunity = { name: communityName, members: ['user1'] };

      findOneSpy.mockResolvedValueOnce(mockCommunity);
      getTopNimWinnersSpy.mockResolvedValueOnce({ error: 'Service error' });

      const response = await supertest(app).get(`/community/getTopNimWinners/${communityName}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Error retrieving top Nim winners');
    });
  });
  describe('POST /community/createGroupChat/:communityName', () => {
    const findOneSpy = jest.spyOn(CommunityModel, 'findOne');
    const saveGroupChatMessageSpy = jest.spyOn(communityService, 'saveGroupChatMessage');
    const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

    beforeEach(() => jest.clearAllMocks());

    it('should successfully create a group chat', async () => {
      const communityName = 'TestCommunity';
      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        name: communityName,
        toHexString: () => 'communityId',
      };

      findOneSpy.mockResolvedValueOnce(mockCommunity);

      const mockGroupChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'user1',
        name: 'Test Group Chat',
        communityId: 'communityId',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveGroupChatMessageSpy.mockResolvedValueOnce(mockGroupChat);

      populateDocumentSpy.mockResolvedValueOnce({
        ...mockGroupChat,
        messages: [
          {
            _id: mockGroupChat.messages[0],
            msg: 'Hello!',
            msgFrom: 'user1',
            type: 'group',
            user: null,
            msgDateTime: new Date(),
          },
        ],
      });

      const response = await supertest(app)
        .post(`/community/createGroupChat/${communityName}`)
        .send({
          participants: ['user1', 'user2'],
          messages: [{ msg: 'Hello!', msgFrom: 'user1' }],
          name: 'Test Group Chat',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: mockGroupChat._id.toString(),
        participants: mockGroupChat.participants,
        messages: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Hello!',
            msgFrom: 'user1',
          }),
        ]),
        creator: mockGroupChat.creator,
        name: mockGroupChat.name,
        communityId: mockGroupChat.communityId,
      });

      expect(findOneSpy).toHaveBeenCalledWith({ name: communityName });
      expect(saveGroupChatMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: ['user1', 'user2'],
          messages: expect.arrayContaining([
            expect.objectContaining({
              msg: 'Hello!',
              msgFrom: 'user1',
            }),
          ]),
          name: 'Test Group Chat',
          communityId: mockCommunity._id.toHexString(),
        }),
      );
    }, 10000);

    it('should return 400 if request is invalid', async () => {
      const response = await supertest(app)
        .post('/community/createGroupChat/TestCommunity')
        .send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid chat creation request');
    });

    it('should return 404 if community does not exist', async () => {
      findOneSpy.mockResolvedValueOnce(null);

      const response = await supertest(app)
        .post('/community/createGroupChat/NonExistentCommunity')
        .send({
          participants: ['user1', 'user2'],
          messages: [{ msg: 'Hello!', msgFrom: 'user1' }],
          name: 'Test Group Chat',
        });

      expect(response.status).toBe(404);
      expect(response.text).toContain('not found');
    });
    it('should return 500 if saveGroupChatMessage returns an error', async () => {
      const communityName = 'TestCommunity';
      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        name: communityName,
        toHexString: () => 'communityId',
      };

      findOneSpy.mockResolvedValueOnce(mockCommunity);

      const errorMessage = 'Failed to save group chat';
      saveGroupChatMessageSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/createGroupChat/${communityName}`)
        .send({
          participants: ['user1', 'user2'],
          messages: [{ msg: 'Hello!', msgFrom: 'user1' }],
          name: 'Test Group Chat',
        });

      expect(response.status).toBe(500);
      expect(response.text).toContain(`Error creating a chat: ${errorMessage}`);
      expect(findOneSpy).toHaveBeenCalledWith({ name: communityName });

      expect(saveGroupChatMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: expect.arrayContaining(['user1', 'user2']),
          messages: expect.arrayContaining([
            expect.objectContaining({
              msg: 'Hello!',
              msgFrom: 'user1',
              type: 'group',
            }),
          ]),
          name: 'Test Group Chat',
          communityId: expect.any(String),
          creator: 'user1',
        }),
      );
    });
    it('should return 500 if populateDocument returns an error', async () => {
      const communityName = 'TestCommunity';
      const mockCommunity = {
        _id: new mongoose.Types.ObjectId(),
        name: communityName,
        toHexString: () => 'communityId',
      };

      findOneSpy.mockResolvedValueOnce(mockCommunity);

      const mockSavedChat = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Group Chat',
        participants: ['admin123', 'user1', 'user2'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'admin123',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveGroupChatMessageSpy.mockResolvedValueOnce(mockSavedChat);

      const errorMessage = 'Failed to populate document';
      populateDocumentSpy.mockResolvedValueOnce({ error: errorMessage });

      const response = await supertest(app)
        .post(`/community/createGroupChat/${communityName}`)
        .send({
          participants: ['user1', 'user2'],
          messages: [{ msg: 'Hello!', msgFrom: 'user1' }],
          name: 'Test Group Chat',
        });

      expect(response.status).toBe(500);
      expect(response.text).toContain(`Error creating a chat: ${errorMessage}`);
      expect(findOneSpy).toHaveBeenCalledWith({ name: communityName });
      expect(saveGroupChatMessageSpy).toHaveBeenCalled();
      expect(populateDocumentSpy).toHaveBeenCalledWith(mockSavedChat._id.toString(), 'groupchat');
    });

    it('should handle service errors', async () => {
      findOneSpy.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Community',
        toHexString: () => 'communityId',
      });

      saveGroupChatMessageSpy.mockImplementationOnce(() => {
        throw new Error('Service error');
      });

      const response = await supertest(app)
        .post('/community/createGroupChat/TestCommunity')
        .send({
          participants: ['user1', 'user2'],
          messages: [{ msg: 'Hello everyone!', msgFrom: 'user1' }],
          name: 'Test Group Chat',
        });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a chat');
    });
  });
});
