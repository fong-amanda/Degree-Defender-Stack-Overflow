import mongoose from 'mongoose';
import CommunityModel from '../../models/communitygroup.model';
import UserModel from '../../models/users.model';
import {
  addMessageToGroupChat,
  addParticipantToGroupChat,
  banMemberFromCommunity,
  createCommunity,
  createGroupChat,
  createPoll,
  deleteMessageFromGroupChat,
  getCommunities,
  getCommunityByName,
  getGroupChatById,
  getGroupChatsByCommunityId,
  getPollsByCommunityId,
  getTopNimWinners,
  isUserInGroupChat,
  joinCommunity,
  removeParticipantFromGroupChat,
  saveGroupChatMessage,
  saveSingleGroupMessage,
  updatePasswordVisibility,
  voteOnPoll,
} from '../../services/communitygroup.service';
import {
  Community,
  DatabaseGroupChat,
  DatabasePoll,
  GroupChat,
  Message,
  Poll,
} from '../../types/types';
import MessageModel from '../../models/messages.model';
import GroupChatModel from '../../models/groupchat.model';
import { user } from '../mockData.models';
import PollModel from '../../models/poll.model';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

beforeEach(() => {
  mockingoose.resetAll();
});
afterEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  jest.restoreAllMocks();
});
const mockChatPayload: GroupChat = {
  participants: ['user1'],
  messages: [
    {
      msg: 'Hello!',
      msgFrom: 'user1',
      msgDateTime: new Date('2025-01-01T00:00:00.000Z'),
      type: 'direct',
    },
  ],
  creator: 'user1',
  name: 'Test Group Chat',
  communityId: 'communityId123',
};

const mockMessagePayload: Message = {
  msg: 'Hello!',
  msgFrom: 'user1',
  msgDateTime: new Date('2025-01-01T00:00:00.000Z'),
  type: 'direct',
};

describe('Community service', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  const mockCommunities = [
    {
      _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
      name: 'Community A',
      description: 'A community',
      isPrivate: false,
      members: ['user1', 'user2'],
      password: 'password123',
      admin: 'adminUserId',
      pollsEnabled: true,
      leaderboardEnabled: true,
      showPassword: false,
      blacklist: [],
    },
    {
      _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212b'),
      name: 'Community B',
      description: 'B community',
      isPrivate: false,
      members: [],
      password: 'password456',
      admin: 'adminUserId',
      pollsEnabled: true,
      leaderboardEnabled: true,
      showPassword: false,
      blacklist: [],
    },
  ];
  describe('createCommunity', () => {
    const mockCommunityPayload: Community = {
      name: 'Test Community',
      description: 'This is a test community.',
      isPrivate: false,
      password: 's',
      members: ['adminUserId'],
      admin: 'adminUserId',
      pollsEnabled: true,
      leaderboardEnabled: true,
      showPassword: false,
      blacklist: [],
    };

    it('should successfully save a community)', async () => {
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          members: ['user1'],
          messages: [new mongoose.Types.ObjectId()],
          password: 's',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );

      const result = await createCommunity(mockCommunities[0]);

      if ('error' in result) {
        throw new Error(`Expected a Community, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.members)).toBe(true);
      expect(result.password).toBe(mockCommunities[0].password);
      expect(result.members[0].toString()).toEqual(expect.any(String));
      expect(result.password && result.password[0].toString()).toEqual(expect.any(String));
    });
    it('should return an error if the community name or description is missing', async () => {
      const communityWithoutName = {
        description: 'A test community with no name.',
        isPrivate: false,
        password: 'password123',
        members: ['user1'],
        name: '',
        admin: 'adminUserId',
        pollsEnabled: true,
        leaderboardEnabled: true,
        showPassword: false,
        blacklist: [],
      };

      const resultWithoutName = await createCommunity(communityWithoutName);
      expect(resultWithoutName).toEqual({ error: 'Community name and description are required' });

      const communityWithoutDescription = {
        name: 'Test Community without description',
        isPrivate: false,
        password: 'password123',
        members: ['user1'],
        description: '',
        admin: 'adminUserId',
        pollsEnabled: true,
        leaderboardEnabled: true,
        showPassword: false,
        blacklist: [],
      };

      const resultWithoutDescription = await createCommunity(communityWithoutDescription);
      expect(resultWithoutDescription).toEqual({
        error: 'Community name and description are required',
      });

      const validCommunity = {
        name: 'Test Community',
        description: 'A valid community with name and description.',
        isPrivate: false,
        password: 'password123',
        members: ['user1'],
        admin: 'adminUserId',
        pollsEnabled: true,
        leaderboardEnabled: true,
        showPassword: false,
        blacklist: [],
      };

      const resultValid = await createCommunity(validCommunity);
      expect(resultValid).toHaveProperty('_id');
    });
    it('should handle errors from saveGroupChatMessage', async () => {
      const basePayload: GroupChat = {
        creator: 'user1',
        participants: ['user1'],
        messages: [{ msg: 'Hello!', msgFrom: 'user1', type: 'group', msgDateTime: new Date() }],
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };

      mockingoose(UserModel).toReturn(
        [{ username: 'user1', _id: new mongoose.Types.ObjectId() }],
        'find',
      );

      mockingoose(UserModel).toReturn(
        { username: 'user1', _id: new mongoose.Types.ObjectId() },
        'findOne',
      );

      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Failed to save message'));

      const result = await createGroupChat(basePayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error saving group chat:');
        expect(result.error).toContain('Failed to save message');
      }
    });

    it('should return an error if an exception occurs', async () => {
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1'],
          messages: [new mongoose.Types.ObjectId()],
          password: 's',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );
      jest.spyOn(CommunityModel, 'create').mockRejectedValueOnce(new Error('DB Error'));

      const result = await createCommunity(mockCommunityPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when creating community');
      }
    });
    it('should return an error if community creation fails', async () => {
      mockingoose(UserModel).toReturn({ _id: 'someUserId' }, 'findOne');
      jest.spyOn(CommunityModel, 'create').mockRejectedValueOnce(new Error('Create failed'));

      const result = await createCommunity(mockCommunityPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when creating community');
      }
    });
  });

  describe('getCommunities', () => {
    it('should return all communities, sorted by date', async () => {
      mockingoose(CommunityModel).toReturn(mockCommunities, 'find');

      const result = await getCommunities();

      expect(result).toEqual([
        {
          _id: expect.any(mongoose.Types.ObjectId),
          name: 'Community A',
          description: 'A community',
          isPrivate: false,
          members: ['user1', 'user2'],
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
          blacklist: [],
          admin: 'adminUserId',
        },
        {
          _id: expect.any(mongoose.Types.ObjectId),
          name: 'Community B',
          description: 'B community',
          isPrivate: false,
          members: [],
          password: 'password456',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
          blacklist: [],
          admin: 'adminUserId',
        },
      ]);
    });

    it('should return an error if an error occurs when retrieving communities', async () => {
      mockingoose(CommunityModel).toReturn(new Error('DB error'), 'find');

      const result = await getCommunities();
      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('DB error');
      }
    });
  });

  describe('getCommunityByName', () => {
    it('should return a community by name', async () => {
      const communityName = 'Community A';
      mockingoose(CommunityModel).toReturn(mockCommunities[0], 'findOne');

      const result = await getCommunityByName(communityName);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: 'Community A',
        description: 'A community',
        isPrivate: false,
        members: ['user1', 'user2'],
        password: 'password123',
        admin: 'adminUserId',
        showPassword: false,
        pollsEnabled: true,
        leaderboardEnabled: true,
        blacklist: [],
      });
    });

    it('should return an error if community not found', async () => {
      const communityName = 'Nonexistent Community';
      mockingoose(CommunityModel).toReturn(null, 'findOne');

      const result = await getCommunityByName(communityName);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Community not found');
      }
    });

    it('should return an error if an error occurs when retrieving the community', async () => {
      const communityName = 'Community A';
      mockingoose(CommunityModel).toReturn(new Error('DB error'), 'findOne');

      const result = await getCommunityByName(communityName);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('DB error');
      }
    });
  });

  describe('joinCommunity', () => {
    it('should return the community if the user is already a member', async () => {
      const communityName = 'Community A';
      const userId = 'userId123';

      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: 'Community A',
          description: 'A community',
          isPrivate: false,
          members: ['userId123'],
          password: 'password123',
        },
        'findOne',
      );

      const result = await joinCommunity(communityName, userId);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: 'Community A',
        description: 'A community',
        isPrivate: false,
        members: ['userId123'],
        password: 'password123',
        admin: '',
        showPassword: false,
        pollsEnabled: true,
        leaderboardEnabled: true,
        blacklist: [],
      });
    });

    it('should add a user to the community if they are not already a member', async () => {
      const communityName = 'Community A';
      const userId = 'userId456';

      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: 'Community A',
          description: 'A community',
          isPrivate: false,
          members: ['userId123'],
          password: 'password123',
        },
        'findOne',
      );

      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: 'Community A',
          description: 'A community',
          isPrivate: false,
          members: ['userId123', 'userId456'],
          password: 'password123',
        },
        'updateOne',
      );

      const result = await joinCommunity(communityName, userId);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: 'Community A',
        description: 'A community',
        isPrivate: false,
        members: ['userId123', 'userId456'],
        password: 'password123',
        admin: '',
        showPassword: false,
        pollsEnabled: true,
        leaderboardEnabled: true,
        blacklist: [],
      });
    });

    it('should return an error if community not found', async () => {
      const communityName = 'Nonexistent Community';
      const userId = 'userId123';

      mockingoose(CommunityModel).toReturn(null, 'findOne');

      const result = await joinCommunity(communityName, userId);

      expect(result).toEqual({
        error: 'Community not found',
      });
    });
  });
  describe('banMemberFromCommunity', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should successfully ban a member from a community', async () => {
      const communityName = 'Community A';
      const username = 'userToBan';

      // Mock community with the user as a member
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: false,
          members: ['adminUser', 'userToBan', 'otherUser'],
          blacklist: [],
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      // Mock the save operation
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: false,
          members: ['adminUser', 'otherUser'],
          blacklist: ['userToBan'],
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'save',
      );

      const result = await banMemberFromCommunity(communityName, username);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: communityName,
        description: 'A community',
        isPrivate: false,
        members: ['adminUser', 'otherUser'],
        blacklist: ['userToBan'],
        admin: 'adminUser',
        password: 'password123',
        showPassword: false,
        pollsEnabled: true,
        leaderboardEnabled: true,
      });
    });

    it('should add user to blacklist if already in blacklist', async () => {
      const communityName = 'Community A';
      const username = 'userToBan';

      // Mock community with the user as a member and already in blacklist
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: false,
          members: ['adminUser', 'userToBan', 'otherUser'],
          blacklist: ['userToBan'], // Already in blacklist
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      // Mock the save operation
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: false,
          members: ['adminUser', 'otherUser'],
          blacklist: ['userToBan'], // Still just once in blacklist
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'save',
      );

      const result = await banMemberFromCommunity(communityName, username);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: communityName,
        description: 'A community',
        isPrivate: false,
        members: ['adminUser', 'otherUser'],
        blacklist: ['userToBan'],
        admin: 'adminUser',
        password: 'password123',
        showPassword: false,
        pollsEnabled: true,
        leaderboardEnabled: true,
      });
    });

    it('should return an error if community not found', async () => {
      const communityName = 'Nonexistent Community';
      const username = 'userToBan';

      mockingoose(CommunityModel).toReturn(null, 'findOne');

      const result = await banMemberFromCommunity(communityName, username);

      expect(result).toEqual({
        error: 'Community not found',
      });
    });

    it('should return an error if user is not a member of the community', async () => {
      const communityName = 'Community A';
      const username = 'nonMemberUser';

      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: false,
          members: ['adminUser', 'otherUser'], // User not in members
          blacklist: [],
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      const result = await banMemberFromCommunity(communityName, username);

      expect(result).toEqual({
        error: 'User not found in members list',
      });
    });

    it('should handle database errors', async () => {
      const communityName = 'Community A';
      const username = 'userToBan';

      // Mock the findOne operation to return a community
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: false,
          members: ['adminUser', 'userToBan', 'otherUser'],
          blacklist: [],
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      // Mock the save operation to throw an error
      const originalSave = CommunityModel.prototype.save;
      CommunityModel.prototype.save = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      try {
        const result = await banMemberFromCommunity(communityName, username);
        expect(result).toEqual({
          error: 'Database error',
        });
      } finally {
        // Restore original save method
        CommunityModel.prototype.save = originalSave;
      }
    });
  });
  describe('updatePasswordVisibility', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should successfully update password visibility to true', async () => {
      const communityName = 'Community A';
      const showPassword = true;

      // Mock the community with initial showPassword as false
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: true,
          members: ['adminUser', 'user1', 'user2'],
          blacklist: [],
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      // Mock the updateOne operation
      mockingoose(CommunityModel).toReturn({ modifiedCount: 1 }, 'updateOne');

      const result = await updatePasswordVisibility(communityName, showPassword);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: communityName,
        description: 'A community',
        isPrivate: true,
        members: ['adminUser', 'user1', 'user2'],
        blacklist: [],
        admin: 'adminUser',
        password: 'password123',
        showPassword: true, // Updated to true
        pollsEnabled: true,
        leaderboardEnabled: true,
      });
    });

    it('should successfully update password visibility to false', async () => {
      const communityName = 'Community A';
      const showPassword = false;

      // Mock the community with initial showPassword as true
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: true,
          members: ['adminUser', 'user1', 'user2'],
          blacklist: [],
          admin: 'adminUser',
          password: 'password123',
          showPassword: true,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      // Mock the updateOne operation
      mockingoose(CommunityModel).toReturn({ modifiedCount: 1 }, 'updateOne');

      const result = await updatePasswordVisibility(communityName, showPassword);

      expect(result).toEqual({
        _id: expect.any(mongoose.Types.ObjectId),
        name: communityName,
        description: 'A community',
        isPrivate: true,
        members: ['adminUser', 'user1', 'user2'],
        blacklist: [],
        admin: 'adminUser',
        password: 'password123',
        showPassword: false, // Updated to false
        pollsEnabled: true,
        leaderboardEnabled: true,
      });
    });

    it('should return an error if community not found', async () => {
      const communityName = 'Nonexistent Community';
      const showPassword = true;

      // Mock findOne to return null (community not found)
      mockingoose(CommunityModel).toReturn(null, 'findOne');

      const result = await updatePasswordVisibility(communityName, showPassword);

      expect(result).toEqual({
        error: 'Community not found',
      });
    });

    it('should handle database errors during findOne', async () => {
      const communityName = 'Community A';
      const showPassword = true;

      // Mock findOne to throw an error
      mockingoose(CommunityModel).toReturn(new Error('Database connection error'), 'findOne');

      const result = await updatePasswordVisibility(communityName, showPassword);

      expect(result).toEqual({
        error: 'Database connection error',
      });
    });

    it('should handle database errors during updateOne', async () => {
      const communityName = 'Community A';
      const showPassword = true;

      // Mock findOne to succeed
      mockingoose(CommunityModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId('66101d857a3d10009efc212a'),
          name: communityName,
          description: 'A community',
          isPrivate: true,
          members: ['adminUser', 'user1', 'user2'],
          blacklist: [],
          admin: 'adminUser',
          password: 'password123',
          showPassword: false,
          pollsEnabled: true,
          leaderboardEnabled: true,
        },
        'findOne',
      );

      // Mock updateOne to throw an error
      const originalUpdateOne = CommunityModel.updateOne;
      CommunityModel.updateOne = jest.fn().mockImplementation(() => {
        throw new Error('Update operation failed');
      });

      try {
        const result = await updatePasswordVisibility(communityName, showPassword);
        expect(result).toEqual({
          error: 'Update operation failed',
        });
      } finally {
        // Restore original updateOne method
        CommunityModel.updateOne = originalUpdateOne;
      }
    });
  });

  describe('saveGroupChatMessage', () => {
    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      mockingoose(UserModel).toReturn(user, 'findOne');

      mockingoose(MessageModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          msg: 'Hello!',
          msgFrom: 'user1',
          msgDateTime: new Date('2025-01-01T00:00:00Z'),
          type: 'direct',
        },
        'create',
      );

      mockingoose(GroupChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1'],
          messages: [new mongoose.Types.ObjectId()],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );

      const result = await saveGroupChatMessage(mockChatPayload);

      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.participants[0].toString()).toEqual(expect.any(String));
      expect(result.messages[0].toString()).toEqual(expect.any(String));
    });

    it('should return an error if user does not exist', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const result = await saveGroupChatMessage(mockChatPayload);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Message sender is invalid');
      }
    });
  });

  describe('saveSingleGroupMessage', () => {
    it('should save a single group message successfully', async () => {
      mockingoose(UserModel).toReturn(user, 'findOne');

      mockingoose(MessageModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          msg: 'Hello!',
          msgFrom: 'user1',
          msgDateTime: new Date('2025-01-01T00:00:00Z'),
          type: 'direct',
        },
        'create',
      );

      const result = await saveSingleGroupMessage(mockMessagePayload);

      if ('error' in result) {
        throw new Error(`Expected a Message, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
    });

    it('should return an error if user does not exist', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const result = await saveSingleGroupMessage(mockMessagePayload);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Message sender is invalid');
      }
    });
  });
  describe('getGroupChatsByCommunityId', () => {
    it('should retrieve group chats by communityID', async () => {
      const mockFoundChat = {
        _id: new mongoose.Types.ObjectId('67f216acbc7f26ea1f9fb342'),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date('2025-04-06T05:52:53.921Z'),
        updatedAt: new Date('2025-04-06T05:52:53.921Z'),
        creator: 'testUser',
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };
      mockingoose(GroupChatModel).toReturn([mockFoundChat], 'find');

      const result = await getGroupChatsByCommunityId(mockFoundChat.communityId);

      expect(result).toEqual([
        {
          _id: expect.any(mongoose.Types.ObjectId),
          participants: ['testUser'],
          messages: [],
          createdAt: new Date('2025-04-06T05:52:53.921Z'),
          updatedAt: new Date('2025-04-06T05:52:53.921Z'),
          creator: 'testUser',
          name: 'Test Group Chat',
        },
      ]);
    });

    it('should return an error if community ID is not provided', async () => {
      const result = await getGroupChatsByCommunityId('');

      expect(result).toEqual({ error: 'Community ID is required' });
    });

    it('should return an error if no group chats are found', async () => {
      const communityId = 'nonExistentCommunityId';
      mockingoose(GroupChatModel).toReturn([], 'find');

      const result = await getGroupChatsByCommunityId(communityId);

      expect(result).toEqual([]);
    });

    it('should return an error if an error occurs when retrieving group chats', async () => {
      const communityId = 'communityId123';

      mockingoose(GroupChatModel).toReturn(() => {
        throw new Error('Database error');
      }, 'find');

      const result = await getGroupChatsByCommunityId(communityId);

      expect(result).toEqual({ error: 'Error occurred when retrieving group chats' });
    });
  });

  describe('getGroupChatById', () => {
    it('should retrieve a chat by ID', async () => {
      const mockFoundChat: DatabaseGroupChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: '',
        name: '',
        communityId: '',
      };

      mockingoose(GroupChatModel).toReturn(mockFoundChat, 'findOne');
      const result = await getGroupChatById(mockFoundChat._id.toString());

      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockFoundChat._id);
    });

    it('should return an error if the chat is not found', async () => {
      mockingoose(GroupChatModel).toReturn(null, 'findOne');

      const result = await getGroupChatById('anyChatId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Group chat not found');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(GroupChatModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await getGroupChatById('dbFailChatId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('DB Error');
      }
    });
  });
  describe('createGroupChat', () => {
    beforeEach(() => {
      mockingoose.resetAll();
      jest.clearAllMocks();
    });

    it('should default msgFrom to creator if missing', async () => {
      const basePayload: GroupChat = {
        creator: 'user1',
        participants: ['user1'],
        messages: [],
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };

      mockingoose(UserModel).toReturn(
        [{ username: 'user1', _id: new mongoose.Types.ObjectId() }],
        'find',
      );
      mockingoose(UserModel).toReturn(
        { username: 'user1', _id: new mongoose.Types.ObjectId() },
        'findOne',
      );

      const payload = {
        ...basePayload,
        messages: [{ msg: 'Hello!' }],
      };

      const result = await createGroupChat(payload as GroupChat);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result).toHaveProperty('messages');
        expect(result.participants).toContain('user1');
      }
    });

    it('should default msg.type to "group" if missing', async () => {
      const basePayload: GroupChat = {
        creator: 'user1',
        participants: ['user1'],
        messages: [],
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };

      mockingoose(UserModel).toReturn(
        [{ username: 'user1', _id: new mongoose.Types.ObjectId() }],
        'find',
      );

      mockingoose(UserModel).toReturn(
        { username: 'user1', _id: new mongoose.Types.ObjectId() },
        'findOne',
      );

      const payload = {
        ...basePayload,
        messages: [{ msg: 'Hi there!', msgFrom: 'user1' }],
      };

      const result = await createGroupChat(payload as GroupChat);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result).toHaveProperty('messages');
      }
    });
    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      mockingoose(UserModel).toReturn(
        [{ username: 'user1', _id: new mongoose.Types.ObjectId() }],
        'find',
      );

      mockingoose(GroupChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          creator: 'user1',
          participants: ['user1'],
          messages: [],
          name: 'Test Group Chat',
          communityId: 'communityId123',
        },
        'create',
      );
      const mockGroupChatPayload: GroupChat = {
        creator: 'user1',

        participants: ['user1'],
        messages: [],
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };

      const result = await createGroupChat(mockGroupChatPayload);

      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);

      if (result.messages.length > 0) {
        expect(result.messages[0]).toHaveProperty('user');
      }
    });

    it('should throw an error when participants contain invalid usernames', async () => {
      const mockGroupChatPayloadError: GroupChat = {
        creator: 'user1',
        participants: ['user1', 'invalidUser'],
        messages: [],
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };
      mockingoose(UserModel).toReturn(
        [{ username: 'user1', _id: new mongoose.Types.ObjectId() }],
        'find',
      );

      mockingoose(GroupChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          creator: 'user1',
          participants: ['user1'],
          messages: [],
          name: 'Test Group Chat',
          communityId: 'communityId123',
        },
        'create',
      );
      mockingoose(UserModel).toReturn(
        [{ username: 'user1', _id: new mongoose.Types.ObjectId() }],
        'find',
      );

      const result = await createGroupChat(mockGroupChatPayloadError);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        // console.log(result.error);
        expect(result.error).toContain('Invalid usernames: invalidUser');
      }
    });
    it('should return an error if an exception occurs', async () => {
      mockingoose(UserModel).toReturn(user, 'findOne');
      mockingoose(MessageModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          msg: 'Hello!',
          msgFrom: 'user1',
          msgDateTime: new Date('2025-01-01T00:00:00Z'),
          type: 'direct',
        },
        'create',
      );
      jest.spyOn(GroupChatModel, 'create').mockRejectedValueOnce(new Error('DB Error'));
      const mockGroupChatPayload: GroupChat = {
        creator: 'user1',

        participants: ['user1'],
        messages: [],
        name: 'Test Group Chat',
        communityId: 'communityId123',
      };

      const result = await createGroupChat(mockGroupChatPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error saving group chat:');
      }
    });
  });

  describe('addMessageToChat', () => {
    it('should add a message ID to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      const mockUpdatedChat: GroupChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as GroupChat;

      mockingoose(GroupChatModel).toReturn(mockUpdatedChat, 'findOneAndUpdate');

      const result = await addMessageToGroupChat(chatId, messageId);
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }

      expect(result.messages).toEqual(mockUpdatedChat.messages);
    });

    it('should return an error if chat is not found', async () => {
      mockingoose(GroupChatModel).toReturn(null, 'findOneAndUpdate');

      const result = await addMessageToGroupChat('invalidChatId', 'someMsgId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(GroupChatModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await addMessageToGroupChat('anyChatId', 'anyMessageId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error adding message to chat:');
      }
    });
  });

  describe('addParticipantToGroupChat', () => {
    it('should add a participant if user exists', async () => {
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'testUser' },
        'findOne',
      );

      const mockChat: DatabaseGroupChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: '',
        name: '',
        communityId: '',
      };

      mockingoose(GroupChatModel).toReturn(mockChat, 'findOneAndUpdate');

      const result = await addParticipantToGroupChat(mockChat._id.toString(), 'newUserId');
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockChat._id);
    });

    it('should return an error if user does not exist', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const result = await addParticipantToGroupChat('anyChatId', 'nonExistentUser');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Group chat not found');
      }
    });
    it('should return an error if user is already a participant in this group chat', async () => {
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'testUser' },
        'findOne',
      );

      const mockChat: DatabaseGroupChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: '',
        name: 'Test Group Chat',
        communityId: '',
      };

      mockingoose(GroupChatModel).toReturn(mockChat, 'findByIdAndUpdate');

      const result = await addParticipantToGroupChat(mockChat._id.toString(), 'testUser');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Group chat not found');
      }
    });

    it('should return an error if user does not exist', async () => {
      mockingoose(UserModel).toReturn(null, 'findOne');

      const result = await addParticipantToGroupChat('anyChatId', 'nonExistentUser');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Group chat not found');
      }
    });

    it('should return an error if chat is not found', async () => {
      mockingoose(UserModel).toReturn({ _id: 'validUserId' }, 'findOne');
      mockingoose(GroupChatModel).toReturn(null, 'findOneAndUpdate');

      const result = await addParticipantToGroupChat('anyChatId', 'validUserId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Group chat not found');
      }
    });

    it('should return an error if DB fails', async () => {
      mockingoose(UserModel).toReturn({ _id: 'validUserId' }, 'findOne');
      jest.spyOn(GroupChatModel, 'findOneAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await addParticipantToGroupChat('chatId', 'validUserId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error adding participant to group chat: DB Error');
      }
    });
  });
  describe('deleteMessageFromGroupChat', () => {
    it('should delete a message ID from an existing group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'testUser';

      const mockUpdatedChat: DatabaseGroupChat = {
        _id: new mongoose.Types.ObjectId(),
        creator: 'testUser',
        participants: ['testUser', 'anotherUser'],
        messages: [new mongoose.Types.ObjectId()],
        name: 'Test Group',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce({
        _id: mockUpdatedChat._id,
        creator: mockUpdatedChat.creator,
        participants: mockUpdatedChat.participants,
        messages: [...mockUpdatedChat.messages, new mongoose.Types.ObjectId(messageId)],
        name: mockUpdatedChat.name,
        communityId: mockUpdatedChat.communityId,
        createdAt: mockUpdatedChat.createdAt,
        updatedAt: mockUpdatedChat.updatedAt,
      } as DatabaseGroupChat);

      jest
        .spyOn(GroupChatModel, 'findByIdAndUpdate')
        .mockResolvedValueOnce(mockUpdatedChat as DatabaseGroupChat);

      const result = await deleteMessageFromGroupChat(chatId, messageId, creatorName);
      if ('error' in result) {
        throw new Error(`Expected a chat, got an error: ${result.error}`);
      }

      expect(result.messages).toEqual(mockUpdatedChat.messages);

      expect(GroupChatModel.findByIdAndUpdate).toHaveBeenCalledWith(
        chatId,
        { $pull: { messages: messageId } },
        { new: true },
      );
    });

    it('should return an error if group chat is not found', async () => {
      const chatId = 'invalidChatId';
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'testUser';

      mockingoose(GroupChatModel).toReturn(null, 'findOne');

      const result = await deleteMessageFromGroupChat(chatId, messageId, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error deleting message from chat: Group chat not found');
      }
    });
    it('should return an error if findByIdAndUpdate returns null', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'testUser';

      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        creator: creatorName,
        participants: [creatorName, 'anotherUser'],
        messages: [new mongoose.Types.ObjectId(messageId)],
        name: 'Test Group',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseGroupChat);

      jest.spyOn(GroupChatModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await deleteMessageFromGroupChat(chatId, messageId, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error deleting message from chat: Failed to delete message from the group chat',
        );
      }
    });

    it('should return an error if message deletion fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'testUser';

      mockingoose(GroupChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['testUser'],
          messages: [messageId],
        },
        'findOne',
      );

      mockingoose(GroupChatModel).toReturn(null, 'findByIdAndUpdate');

      const result = await deleteMessageFromGroupChat(chatId, messageId, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error deleting message from chat: Only the group chat creator can delete messages',
        );
      }
    });

    it('should return an error if user is not the group chat creator', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const creatorName = 'testUser';

      mockingoose(GroupChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['testUser'],
          messages: [messageId],
        },
        'findOne',
      );

      jest.spyOn(GroupChatModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await deleteMessageFromGroupChat(chatId, messageId, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error deleting message from chat: Only the group chat creator can delete messages',
        );
      }
    });
  });

  describe('removeParticipantFromGroupChat', () => {
    it('should return an error if database operation fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'participantToRemove';
      const creatorName = 'testCreator';

      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        creator: creatorName,
        participants: [creatorName, username, 'anotherParticipant'],
        messages: [new mongoose.Types.ObjectId()],
        name: 'Test Group',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseGroupChat);

      jest.spyOn(GroupChatModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await removeParticipantFromGroupChat(chatId, username, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error removing participant from chat: DB Error');
      }
    });
    it('should return an error if user is not the creator of the group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'participantToRemove';
      const creatorName = 'notTheCreator';
      const actualCreator = 'actualCreator';

      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        creator: actualCreator,
        participants: [actualCreator, 'participantToRemove', 'anotherParticipant'],
        messages: [new mongoose.Types.ObjectId()],
        name: 'Test Group',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseGroupChat);

      const result = await removeParticipantFromGroupChat(chatId, username, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error removing participant from chat: Only the group chat creator can remove participants',
        );
      }
    });
    it('should return an error if findByIdAndUpdate returns null', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'participantToRemove';
      const creatorName = 'testCreator';

      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        creator: creatorName,
        participants: [creatorName, username, 'anotherParticipant'],
        messages: [new mongoose.Types.ObjectId()],
        name: 'Test Group',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseGroupChat);

      jest.spyOn(GroupChatModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await removeParticipantFromGroupChat(chatId, username, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error removing participant from chat: Failed to remove participant from the group chat',
        );
      }
    });

    it('should return an error if group chat is not found', async () => {
      const chatId = 'invalidChatId';
      const username = 'participantToRemove';
      const creatorName = 'testCreator';

      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce(null);

      const result = await removeParticipantFromGroupChat(chatId, username, creatorName);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error removing participant from chat: Group chat not found',
        );
      }
    });
    it('should remove a participant from an existing group chat when creator requests', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'participantToRemove';
      const creatorName = 'testCreator';

      const mockUpdatedChat: DatabaseGroupChat = {
        _id: new mongoose.Types.ObjectId(),
        creator: creatorName,
        participants: ['testCreator', 'remainingParticipant'],
        messages: [new mongoose.Types.ObjectId()],
        name: 'Test Group',
        communityId: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(GroupChatModel, 'findById').mockResolvedValueOnce({
        _id: mockUpdatedChat._id,
        creator: creatorName,
        participants: [...mockUpdatedChat.participants, username],
        messages: mockUpdatedChat.messages,
        name: mockUpdatedChat.name,
        communityId: mockUpdatedChat.communityId,
        createdAt: mockUpdatedChat.createdAt,
        updatedAt: mockUpdatedChat.updatedAt,
      } as DatabaseGroupChat);

      jest
        .spyOn(GroupChatModel, 'findByIdAndUpdate')
        .mockResolvedValueOnce(mockUpdatedChat as DatabaseGroupChat);

      const result = await removeParticipantFromGroupChat(chatId, username, creatorName);
      if ('error' in result) {
        throw new Error(`Expected a chat, got an error: ${result.error}`);
      }

      expect(result.participants).toEqual(mockUpdatedChat.participants);
      expect(result.participants).not.toContain(username);

      expect(GroupChatModel.findByIdAndUpdate).toHaveBeenCalledWith(
        chatId,
        { $pull: { participants: username } },
        { new: true },
      );
    });
  });
  describe('isUserInGroupChat', () => {
    const chatId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should throw an error if the chat is not found', async () => {
      const username = 'testUser';

      mockingoose(GroupChatModel).toReturn(null, 'findById');

      await expect(isUserInGroupChat(chatId, username)).rejects.toThrow('Group chat not found');
    });

    it('should throw an error if DB throws an error', async () => {
      const username = 'testUser';

      mockingoose(GroupChatModel).toReturn(new Error('Database error'), 'findById');

      await expect(isUserInGroupChat(chatId, username)).rejects.toThrow(
        'Error checking user in group chat',
      );
    });
    it('should return true when the username is in participants', async () => {
      const username = 'testUser';

      const mockChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: ['anotherUser', username, 'thirdUser'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'adminUser',
        name: 'Test Group Chat',
        communityId: 'community123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockingoose(GroupChatModel).toReturn(mockChat, 'findOne');

      const result = await isUserInGroupChat(chatId, username);
      expect(result).toBe(true);
    });

    it('should return false when the username is not in participants', async () => {
      const username = 'nonParticipantUser';

      const mockChat = {
        _id: new mongoose.Types.ObjectId(chatId),
        participants: ['user1', 'user2', 'user3'],
        messages: [new mongoose.Types.ObjectId()],
        creator: 'adminUser',
        name: 'Test Group Chat',
        communityId: 'community123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockingoose(GroupChatModel).toReturn(mockChat, 'findOne');

      const result = await isUserInGroupChat(chatId, username);
      expect(result).toBe(false);
    });
  });
  describe('createPoll', () => {
    const mockPollPayload: Poll = {
      question: 'What is your favorite programming language?',
      choices: [
        { choice: 'JavaScript', votes: 0 },
        { choice: 'TypeScript', votes: 0 },
        { choice: 'Python', votes: 0 },
        { choice: 'Java', votes: 0 },
        { choice: 'C#', votes: 0 },
      ],
      communityId: 'communityId123',
      voters: [],
    };
    it('should successfully create a poll', async () => {
      const choicesWithIds = mockPollPayload.choices.map(choice => ({
        _id: new mongoose.Types.ObjectId(),
        choice: choice.choice,
        votes: choice.votes,
      }));

      const mockResponse = {
        _id: new mongoose.Types.ObjectId(),
        question: mockPollPayload.question,
        choices: choicesWithIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockingoose(PollModel).toReturn(mockResponse, 'create');

      const result = await createPoll(mockPollPayload);

      if ('error' in result) {
        throw new Error(`Expected a Poll, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(result.question).toBe(mockPollPayload.question);

      expect(result.choices.length).toBe(mockPollPayload.choices.length);
      result.choices.forEach((choice, index) => {
        expect(choice.choice).toBe(mockPollPayload.choices[index].choice);
        expect(choice.votes).toBe(mockPollPayload.choices[index].votes);
      });

      if (result.communityId) {
        expect(result.communityId).toBe(mockPollPayload.communityId);
      }

      if (result.voters) {
        expect(result.voters).toEqual([]);
      }
    });
    it('should return an error if the result is null', async () => {
      mockingoose.resetAll();

      const originalCreate = PollModel.create;
      PollModel.create = jest.fn().mockResolvedValue(null);

      try {
        const result = await createPoll(mockPollPayload);

        // console.log('Result from createPoll:', result);

        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBe('Failed to create poll');
        }
      } finally {
        PollModel.create = originalCreate;
      }
    });
    it('should return an error if poll creation fails', async () => {
      jest.spyOn(PollModel, 'create').mockRejectedValueOnce(new Error('Create failed'));

      const result = await createPoll(mockPollPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when saving user: Error: Create failed');
      }
    });

    it('should validate required fields in poll payload', async () => {
      const invalidPoll: Partial<Poll> = {
        question: '',
        choices: [],
        communityId: 'communityId123',
        voters: [],
      };

      jest.spyOn(PollModel, 'create').mockRejectedValueOnce(new mongoose.Error.ValidationError());

      const result = await createPoll(invalidPoll as Poll);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when saving user');
      }
    });
  });
  describe('getPollsByCommunityId', () => {
    it('should retrieve a poll by community ID', async () => {
      const mockPoll: DatabasePoll = {
        _id: new mongoose.Types.ObjectId(),
        question: 'What is your favorite programming language?',
        choices: [
          { choice: 'JavaScript', votes: 5 },
          { choice: 'TypeScript', votes: 10 },
          { choice: 'Python', votes: 3 },
        ],
        communityId: 'community123',
        voters: ['user1', 'user2', 'user3'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockingoose(PollModel).toReturn(mockPoll, 'findOne');

      const result = await getPollsByCommunityId('community123');

      if ('error' in result) {
        throw new Error(`Expected a Poll, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(result.question).toBe(mockPoll.question);

      expect(result.choices.length).toBe(mockPoll.choices.length);
      result.choices.forEach((choice, index) => {
        expect(choice.choice).toBe(mockPoll.choices[index].choice);
        expect(choice.votes).toBe(mockPoll.choices[index].votes);
      });

      if (result.communityId) {
        expect(result.communityId).toBe(mockPoll.communityId);
      }

      if (result.voters) {
        expect(result.voters).toEqual(mockPoll.voters);
      }
    });

    it('should return an error if poll is not found', async () => {
      mockingoose(PollModel).toReturn(null, 'findOne');

      const result = await getPollsByCommunityId('nonexistent');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Community not found');
      }
    });

    it('should return an error if database query fails', async () => {
      jest.spyOn(PollModel, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      const result = await getPollsByCommunityId('community123');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Database error');
      }
    });

    it('should throw an error when community ID is invalid', async () => {
      mockingoose(PollModel).toReturn(new Error('Invalid ID'), 'findOne');

      const result = await getPollsByCommunityId('invalid-id');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBeDefined();
      }
    });
  });
  describe('voteOnPoll', () => {
    beforeEach(() => {
      mockingoose.resetAll();
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const pollId = new mongoose.Types.ObjectId().toString();
    const userId = 'user123';

    const mockPoll = {
      _id: new mongoose.Types.ObjectId(pollId),
      question: 'Favorite programming language?',
      choices: [
        { _id: new mongoose.Types.ObjectId(), choice: 'JavaScript', votes: 5 },
        { _id: new mongoose.Types.ObjectId(), choice: 'TypeScript', votes: 10 },
        { _id: new mongoose.Types.ObjectId(), choice: 'Python', votes: 3 },
      ],
      communityId: 'community123',
      voters: ['user1', 'user2'],
      save: jest.fn(),
    };

    it('should successfully vote on a poll option', async () => {
      const pollCopy = JSON.parse(JSON.stringify(mockPoll));
      pollCopy.save = jest.fn().mockResolvedValueOnce({
        ...pollCopy,
        choices: [
          { _id: pollCopy.choices[0]._id, choice: 'JavaScript', votes: 6 },
          { _id: pollCopy.choices[1]._id, choice: 'TypeScript', votes: 10 },
          { _id: pollCopy.choices[2]._id, choice: 'Python', votes: 3 },
        ],
        voters: [...pollCopy.voters, userId],
      });

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(pollCopy);

      const result = await voteOnPoll(pollId, userId, 'JavaScript');

      if ('error' in result) {
        throw new Error(`Expected a Poll, got error: ${result.error}`);
      }

      const jsChoice = result.choices.find(c => c.choice === 'JavaScript');
      expect(jsChoice?.votes).toBe(6);

      expect(result.voters).toContain(userId);

      expect(pollCopy.save).toHaveBeenCalled();
    });

    it('should return an error if the poll is not found', async () => {
      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(null);

      const result = await voteOnPoll('nonexistentPollId', userId, 'JavaScript');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error voting on poll: Poll not found');
      }
    });

    it('should return an error if the user has already voted', async () => {
      const pollWithUserVoted = {
        ...mockPoll,
        voters: ['user1', 'user2', userId],
      };

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(pollWithUserVoted);

      const result = await voteOnPoll(pollId, userId, 'JavaScript');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error voting on poll: User has already voted on this poll');
      }
    });

    it('should return an error if the choice is invalid', async () => {
      const pollCopy = JSON.parse(JSON.stringify(mockPoll));

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(pollCopy);

      const result = await voteOnPoll(pollId, userId, 'InvalidChoice');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error voting on poll: Invalid choice');
      }
    });

    it('should return an error if saving the poll fails', async () => {
      const pollCopy = JSON.parse(JSON.stringify(mockPoll));
      pollCopy.save = jest.fn().mockRejectedValueOnce(new Error('Save failed'));

      jest.spyOn(PollModel, 'findById').mockResolvedValueOnce(pollCopy);

      const result = await voteOnPoll(pollId, userId, 'JavaScript');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error voting on poll: Save failed');
      }
    });

    it('should return an error if the database operation fails', async () => {
      jest.spyOn(PollModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await voteOnPoll(pollId, userId, 'JavaScript');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error voting on poll: Database error');
      }
    });
  });

  describe('getTopNimWinners', () => {
    it('should return top 5 users sorted by nimGameWins', async () => {
      const mockUsers = [
        { username: 'alice', nimGameWins: 10 },
        { username: 'bob', nimGameWins: 8 },
        { username: 'carol', nimGameWins: 6 },
        { username: 'dave', nimGameWins: 4 },
        { username: 'eve', nimGameWins: 2 },
      ];

      mockingoose(UserModel).toReturn(mockUsers, 'find');

      const result = await getTopNimWinners();

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(5);
        expect(result[0]).toEqual({ username: 'alice', nimWins: 10 });
        expect(result[4]).toEqual({ username: 'eve', nimWins: 2 });
      }
    });

    it('should return fewer users if less than 5 exist', async () => {
      const mockUsers = [
        { username: 'alice', nimGameWins: 5 },
        { username: 'bob', nimGameWins: 3 },
      ];

      mockingoose(UserModel).toReturn(mockUsers, 'find');

      const result = await getTopNimWinners();

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(2);
        expect(result[1]).toEqual({ username: 'bob', nimWins: 3 });
      }
    });

    it('should return an error if database fails', async () => {
      mockingoose(UserModel).toReturn(new Error('DB failure'), 'find');

      const result = await getTopNimWinners();

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error fetching top Nim winners: DB failure');
      }
    });
  });
});
