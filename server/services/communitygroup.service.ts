import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import CommunityModel from '../models/communitygroup.model';
import {
  Community,
  CommunityDetails,
  CommunityResponse,
  Message,
  GroupChatResponse,
  DatabaseGroupChat,
  GroupChat,
  MessageResponse,
  Poll,
  PollResponse,
  DatabasePoll,
} from '../types/types';
import UserModel from '../models/users.model';
import GroupChatModel from '../models/groupchat.model';
import { saveMessage } from './message.service';
import PollModel from '../models/poll.model';

/**
 * Create a new community with the provided details.
 * @param {string} name - The name of the community.
 * @param {string} description - A brief description of the community.
 * @returns {Promise<CommunityResponse>} - The created community or an error message.
 */
export const createCommunity = async (community: Community): Promise<CommunityResponse> => {
  try {
    if (!community.name || !community.description) {
      return { error: 'Community name and description are required' };
    }
    const result: CommunityDetails = await CommunityModel.create(community);

    return result;
  } catch (error) {
    return { error: `Error occurred when creating community` };
  }
};

/**
 * Saves a new message to the database.
 * @param message - The message to save.
 * @returns {Promise<MessageResponse>} - The saved message or an error message.
 */
export const getCommunities = async (): Promise<CommunityResponse[] | { error: string }> => {
  try {
    const communities = await CommunityModel.find().sort({ createdAt: -1 }).lean();
    return communities;
  } catch (error) {
    return { error: (error as Error).message } as { error: string };
  }
};
/**
 * Gets a community by its name.
 * @param name - The name of the community.
 * @returns {Promise<CommunityResponse>} - The community or an error message.
 */
export const getCommunityByName = async (name: string): Promise<CommunityResponse> => {
  try {
    const community = await CommunityModel.findOne({ name }).lean();
    if (!community) {
      throw new Error('Community not found');
    }
    return community;
  } catch (error) {
    return { error: (error as Error).message };
  }
};
/**
 * Allows a user to join a community by adding their username to the members list.
 * @param communityName - The name of the community to join.
 * @param username - The username of the user joining.
 * @returns {Promise<CommunityResponse>} - The updated community or an error message.
 * @throws {Error} - Throws an error if the community is not found or if the user is already a member.
 */

export const joinCommunity = async (
  communityName: string,
  username: string,
): Promise<CommunityResponse> => {
  try {
    const community = await CommunityModel.findOne({ name: communityName }).lean();
    if (!community) {
      throw new Error('Community not found');
    }
    if (community.members.includes(username)) {
      return community;
    }
    community.members.push(username);

    await CommunityModel.updateOne({ name: communityName }, { members: community.members });
    return { ...community, members: community.members };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export const banMemberFromCommunity = async (
  communityName: string,
  username: string,
): Promise<CommunityResponse> => {
  try {
    const community = await CommunityModel.findOne({ name: communityName });
    if (!community) {
      throw new Error('Community not found');
    }
    if (!community.members.includes(username)) {
      return { error: 'User not found in members list' };
    }
    community.members = community.members.filter((member: string) => member !== username);

    if (!community.blacklist.includes(username)) {
      community.blacklist.push(username);
    }
    await community.save();

    return { ...community.toObject(), members: community.members, blacklist: community.blacklist };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export const updatePasswordVisibility = async (
  communityName: string,
  showPassword: boolean,
): Promise<CommunityResponse> => {
  try {
    const community = await CommunityModel.findOne({ name: communityName }).lean();
    if (!community) {
      throw new Error('Community not found');
    }
    community.showPassword = showPassword;

    await CommunityModel.updateOne(
      { name: communityName },
      { showPassword: community.showPassword },
    );
    return { ...community, showPassword: community.showPassword };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Saves a new message to the database.
 * @param message - The message to save.
 * @returns {Promise<GroupChatResponse>} - The saved message or an error message.
 */
export const saveGroupChatMessage = async (
  groupChatPayload: GroupChat,
): Promise<GroupChatResponse> => {
  try {
    const messageIds: ObjectId[] = await Promise.all(
      groupChatPayload.messages.map(async msg => {
        const savedMessage: MessageResponse = await saveMessage(msg);

        if ('error' in savedMessage) {
          throw new Error(savedMessage.error);
        }

        return savedMessage._id;
      }),
    );

    return await GroupChatModel.create({
      creator: groupChatPayload.creator,
      name: groupChatPayload.name,
      participants: groupChatPayload.participants,
      messages: messageIds,
      communityId: groupChatPayload.communityId,
    });
  } catch (error) {
    return { error: `Error saving chat: ${error}` };
  }
};
/**
 * Saves a single message for a group chat to the database.
 * @param message - The message to save.
 * @returns {Promise<MessageResponse>} - The saved message or an error message.
 */
export const saveSingleGroupMessage = async (message: Message): Promise<MessageResponse> => {
  try {
    const savedMessage = await saveMessage(message);

    if ('error' in savedMessage) {
      throw new Error(savedMessage.error);
    }

    return savedMessage;
  } catch (error) {
    return { error: `Error saving single group message: ${(error as Error).message}` };
  }
};
/**
 * Gets group chats associated with the community ID.
 * @param communityId - The ID of the community.
 * @returns {Promise<ChatResponse>} - The group chats or an error message.
 */
export const getGroupChatsByCommunityId = async (
  id: string,
): Promise<GroupChatResponse[] | { error: string }> => {
  try {
    if (!id) {
      return { error: 'Community ID is required' };
    }
    const groupChat = await GroupChatModel.find({ communityId: id }).lean();
    return groupChat;
  } catch (error) {
    return { error: 'Error occurred when retrieving group chats' };
  }
};
/**
 * Gets a group chat by its ID.
 * @param chatId - The ID of the chat to retrieve.
 * @returns {Promise<ChatResponse>} - The group chat or an error message.
 */
export const getGroupChatById = async (chatId: string): Promise<GroupChatResponse> => {
  try {
    const groupChat = await GroupChatModel.findById(chatId);
    if (!groupChat) {
      throw new Error('Group chat not found');
    }
    return groupChat;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Saves a new group chat, storing any messages provided as part of the argument.
 * @param chatPayload - The group chat object containing message data and participants.
 * @returns {Promise<GroupChatResponse>} - The saved group chat or an error message.
 */
export const createGroupChat = async (
  chatPayload: GroupChat & { participants: string[]; name: string },
): Promise<GroupChatResponse> => {
  try {
    const users = await UserModel.find({ username: { $in: chatPayload.participants } });

    const invalidUsernames = chatPayload.participants.filter(
      username => !users.some(user => user.username === username),
    );
    if (invalidUsernames.length > 0) {
      return { error: `Invalid usernames: ${invalidUsernames.join(', ')}` };
    }

    const messagesWithUserIds = await Promise.all(
      chatPayload.messages.map(async msg =>
        // Set default values
        ({
          ...msg,
          msgFrom: msg.msgFrom || chatPayload.creator,
          type: msg.type || 'group',
        }),
      ),
    );

    const messageIds: Types.ObjectId[] = await Promise.all(
      messagesWithUserIds.map(async msg => {
        const savedMessage: GroupChatResponse = await saveGroupChatMessage({
          creator: chatPayload.creator,
          participants: chatPayload.participants,
          messages: [{ ...msg, msgFrom: msg.msgFrom || '' }],
          name: chatPayload.name,
          communityId: chatPayload.communityId,
        });
        if ('error' in savedMessage) {
          throw new Error(savedMessage.error);
        }
        return savedMessage._id;
      }),
    );
    const groupChat = await GroupChatModel.create({
      participants: chatPayload.participants,
      messages: messageIds,
      name: chatPayload.name,
      communityId: chatPayload.communityId,
    });

    return groupChat;
  } catch (error) {
    return { error: `Error saving group chat: ${(error as Error).message || error}` };
  }
};

/**
 * Adds a message ID to a chat.
 * @param chatId - The ID of the chat to update.
 * @param messageId - The ID of the message to add.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const addMessageToGroupChat = async (
  chatId: string,
  messageId: string,
): Promise<GroupChatResponse> => {
  try {
    const updatedChat: DatabaseGroupChat | null = await GroupChatModel.findByIdAndUpdate(
      chatId,
      { $push: { messages: messageId } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Chat not found');
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error adding message to chat: ${error}` };
  }
};
/** Allows a user to join
 * a group chat by adding their username to the participants list.
 * @param chatId - The ID of the chat to update.
 * @param username - The username of the user to add.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 * @throws {Error} - Throws an error if the chat is not found or if the user is already a participant.
 */
export const addParticipantToGroupChat = async (groupChatId: string, username: string) => {
  try {
    const updatedChat = await GroupChatModel.findByIdAndUpdate(
      groupChatId,
      { $addToSet: { participants: username } },
      { new: true },
    );

    if (!updatedChat) {
      return { error: 'Group chat not found' };
    }
    return updatedChat;
  } catch (error) {
    return { error: `Error adding participant to group chat: ${(error as Error).message}` };
  }
};
/**
 * Allows group chat creator to delete a message in the group chat.
 * @param chatId - The ID of the chat to update.
 * @param messageId - The ID of the message to delete.
 * @param creatorName - The name of the user attempting to delete the message.
 * @returns {Promise<GroupChatResponse>} - The updated group chat or an error message.
 */
export const deleteMessageFromGroupChat = async (
  chatId: string,
  messageId: string,
  creatorName: string,
): Promise<GroupChatResponse> => {
  try {
    const groupChat = await GroupChatModel.findById(chatId);
    if (!groupChat) {
      throw new Error('Group chat not found');
    }

    if (groupChat.creator !== creatorName) {
      throw new Error('Only the group chat creator can delete messages');
    }

    const updatedChat = await GroupChatModel.findByIdAndUpdate(
      chatId,
      { $pull: { messages: messageId } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Failed to delete message from the group chat');
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error deleting message from chat: ${(error as Error).message}` };
  }
};
/**
 * Allows group chat creator to remove a participant from the group chat.
 * @param chatId - The ID of the chat to update.
 * @param username - The username of the participant to remove.
 * @param creatorName - The name of the user attempting to remove the participant.
 * @returns {Promise<GroupChatResponse>} - The updated group chat or an error message.
 */
export const removeParticipantFromGroupChat = async (
  chatId: string,
  username: string,
  creatorName: string,
): Promise<GroupChatResponse> => {
  try {
    const groupChat = await GroupChatModel.findById(chatId);
    if (!groupChat) {
      throw new Error('Group chat not found');
    }

    if (groupChat.creator !== creatorName) {
      throw new Error('Only the group chat creator can remove participants');
    }

    const updatedChat = await GroupChatModel.findByIdAndUpdate(
      chatId,
      { $pull: { participants: username } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Failed to remove participant from the group chat');
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error removing participant from chat: ${(error as Error).message}` };
  }
};

/**
 * Checks if a user is a participant in a group chat.
 * @param chatId - The ID of the chat to check.
 * @param username - The username of the user to check.
 * @returns {Promise<boolean>} - True if the user is a participant, false otherwise.
 * @throws {Error} - Throws an error if the chat is not found or if the user is not a participant.
 */
export const isUserInGroupChat = async (chatId: string, username: string): Promise<boolean> => {
  try {
    const chat = await GroupChatModel.findById(chatId);

    if (!chat) {
      throw new Error('Group chat not found');
    }

    return chat.participants.includes(username);
  } catch (error) {
    throw new Error(`Error checking user in group chat: ${(error as Error).message}`);
  }
};

/**
 *  * Creates a new poll within a community.
 * @param {CreatePollRequest} pollData - The poll details including question, choices, and expiration date.
 * @returns {Promise<PollResponse>} - The created poll or an error message.
 */
export const createPoll = async (poll: Poll): Promise<PollResponse> => {
  try {
    const result: DatabasePoll = await PollModel.create(poll);

    if (!result) {
      return { error: 'Failed to create poll' };
    }

    return result;
  } catch (error) {
    return { error: `Error occurred when saving user: ${error}` };
  }
};
/**
 * Gets polls associated with the community ID.
 * @param communityId - The ID of the community.
 * @returns {Promise<PollResponse>} - The group chats or an error message.
 */
export const getPollsByCommunityId = async (id: string): Promise<PollResponse> => {
  try {
    const poll = await PollModel.findOne({ id });
    if (!poll) {
      throw new Error('Community not found');
    }
    return poll;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * votes for a poll option.
 * @param pollId - The ID of the poll to update.
 * @param optionId - The ID of the option to vote for.
 * @param userId - The ID of the user voting.
 * @returns {Promise<PollResponse>} - The updated poll or an error message.
 * @throws {Error} - Throws an error if the poll is not found or if the user has already voted.
 */
export const voteOnPoll = async (
  pollId: string,
  userId: string,
  choice: string,
): Promise<PollResponse> => {
  try {
    const poll = await PollModel.findById(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.voters.includes(userId)) {
      throw new Error('User has already voted on this poll');
    }

    const choiceIndex = poll.choices.findIndex(c => c.choice === choice);

    if (choiceIndex === -1) {
      throw new Error('Invalid choice');
    }

    poll.choices[choiceIndex].votes += 1;
    poll.voters.push(userId);

    const updatedPolls = await poll.save();

    return updatedPolls;
  } catch (error) {
    return { error: `Error voting on poll: ${(error as Error).message}` };
  }
};
/**
 * Gets the top 5 users with the most wins in Nim game.
 * @returns {Promise<{ username: string; nimWins: number }[] | { error: string }>} - The top users or an error message.
 */
export const getTopNimWinners = async (): Promise<
  { username: string; nimWins: number }[] | { error: string }
> => {
  try {
    const topUsers = await UserModel.find({ nimGameWins: { $exists: true } })
      .sort({ nimGameWins: -1 })
      .limit(5)
      .select('username nimGameWins');

    return topUsers.map(user => ({
      username: user.username,
      nimWins: user.nimGameWins,
    }));
  } catch (error) {
    return { error: `Error fetching top Nim winners: ${(error as Error).message}` };
  }
};
