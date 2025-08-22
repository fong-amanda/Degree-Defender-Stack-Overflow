import { ObjectId } from 'mongodb';
import api from './config';
import {
  Message,
  Community,
  CommunityResponse,
  GroupChatResponse,
  PopulatedDatabaseGroupChat,
  PopulatedDatabasePoll,
  PollResponse,
} from '../types/types';

const COMMUNITY_API_URL = `${process.env.REACT_APP_SERVER_URL}/community`;

/**
 * Creates a new community.
 *
 * @param community - The community object containing name, description, and other details.
 * @returns The newly created community or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
export const createCommunity = async (community: Community): Promise<CommunityResponse> => {
  try {
    // Send the community object instead of a string
    const res = await api.post(`${COMMUNITY_API_URL}/createCommunity`, community);

    if (res.status !== 200) {
      throw new Error('Error while creating a new community');
    }

    return res.data;
  } catch (error) {
    return { error: `Error occurred when creating community: ${error}` };
  }
};
/**
 * Fetches all communities.
 *
 * @returns An array of communities or an error response.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getCommunities = async (): Promise<CommunityResponse[] | { error: string }> => {
  try {
    const res = await api.get(`${COMMUNITY_API_URL}/getCommunities`);
    if (res.status !== 200) {
      throw new Error('Error while getting communities');
    }

    return res.data;
  } catch (error) {
    return { error: `Error occurred when getting communities${error}` };
  }
};
/**
 * Fetches a community by its unique name.
 *
 * @param name - The unique name of the community to fetch.
 * @returns The details of the community with the specified name.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getCommunityByName = async (name: string): Promise<CommunityResponse> => {
  try {
    const res = await api.get(`${COMMUNITY_API_URL}/getCommunityByName/${name}`);
    if (res.status !== 200) {
      throw new Error('Error while getting community by name');
    }
    return res.data;
  } catch (error) {
    return { error: `Error occurred when getting community by name: ${error}` };
  }
};
/**
 * Resets the password for a community.
 * @param name - The unique name of the community
 * @param newPassword - The new password to be set for the community
 * @returns A promise that resolves to the updated community data
 * @throws {Error} If the request to the server is unsuccessful
 */
// const resetPassword = async (name: string, newPassword: string): Promise<CommunityResponse> => {
//   const res = await api.patch(`${COMMUNITY_API_URL}/resetPassword`, {
//     name,
//     password: newPassword,
//   });
//   if (res.status !== 200) {
//     throw new Error('Error when resetting password');
//   }
//   return res.data;
// };
export const getGroupChatByCommunityName = async (
  communityName: string,
): Promise<GroupChatResponse | { error: string }> => {
  try {
    // console.log('Fetching group chat for community:', communityName); // This log should appear if the function is called
    const res = await api.get(`${COMMUNITY_API_URL}/getGroupChatsByCommunity/${communityName}`);
    if (res.status !== 200) {
      throw new Error('Error while getting group chat by community ID');
    }
    return res.data;
  } catch (error) {
    return {
      error: `Error occurred when getting group chat by community ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
/**
 * Fetches a chat by its unique ID.
 *
 * @param chatID - The ID of the chat to fetch.
 * @returns The details of the chat with the specified ID.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getGroupChatById = async (chatID: ObjectId): Promise<PopulatedDatabaseGroupChat> => {
  const res = await api.get(`${COMMUNITY_API_URL}/getGroupChat/${chatID}`);

  if (res.status !== 200) {
    throw new Error('Error when fetching chat by ID');
  }

  return res.data;
};
/**
 * Creates a new group chat.
 *
 * @param chat - The chat object containing details about the group chat.
 * @returns The newly created group chat or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
export const createGroupChat = async (
  communityName: string,
  groupName: string,
  participants: string[],
): Promise<PopulatedDatabaseGroupChat> => {
  // const res = await api.post(`${COMMUNITY_API_URL}/createGroupChat/${groupName}`, {
  const res = await api.post(`${COMMUNITY_API_URL}/createGroupChat/${communityName}/`, {
    participants,
    messages: [],
    name: groupName,
  });

  if (res.status !== 200) {
    throw new Error('Error when creating group chat');
  }

  return res.data;
};
/**
 * Adds a message to a group chat.
 *
 * @param chatId - The ID of the chat to which the message will be added.
 * @param message - The message object containing the message details.
 * @returns The updated group chat or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
export const sendGroupChatMessage = async (
  message: Omit<Message, 'type'>,
  chatID: ObjectId,
): Promise<PopulatedDatabaseGroupChat> => {
  const res = await api.post(`${COMMUNITY_API_URL}/addMessageToGroupChat/${chatID}`, message);

  if (res.status !== 200) {
    throw new Error('Error when adding message to chat');
  }
  return res.data;
};
/**
 * Adds a participant to a group chat.
 *
 * @param chatId - The ID of the chat to which the participant will be added.
 * @param username - The username of the participant to be added.
 * @returns The updated group chat or throws an error if the request fails.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
export const addParticipantToGroupChat = async (
  chatId: ObjectId,
  username: string,
): Promise<PopulatedDatabaseGroupChat> => {
  try {
    const res = await api.post(`${COMMUNITY_API_URL}/addParticipantToGroupChat/${chatId}/`, {
      username,
    });

    if (res.status !== 200) {
      throw new Error(`Failed to add participant: ${res.statusText}`);
    }

    return res.data;
  } catch (error) {
    throw new Error('Error when adding participant to group chat. Please try again.');
  }
};
/**
 * Deletes a message from a group chat.
 */
export const deleteMessageFromGroupChat = async (
  chatId: string,
  messageId: string,
  creatorName: string,
): Promise<PopulatedDatabaseGroupChat> => {
  try {
    // console.log('CHATTTTTID', chatId);
    // console.log('MESSAGEID', messageId);
    const res = await api.post(`${COMMUNITY_API_URL}/deleteMessageFromGroupChat/${chatId}`, {
      messageId,
      creatorName,
    });
    if (res.status !== 200) {
      throw new Error(`Failed to delete message: ${res.statusText}`);
    }
    return res.data;
  } catch (error) {
    throw new Error('Error when deleting message from group chat. Please try again.');
  }
};
/**
 * Removes a participant from a group chat.
 * @param chatId - The ID of the chat from which the participant will be removed.
 * @param participantName - The name of the participant to be removed.
 * @param creatorName - The name of the user who is removing the participant.
 * @returns The updated group chat or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 * @description This function removes a participant from a group chat by sending a POST request to the server.
 */
export const removeParticipantFromGroupChat = async (
  chatId: string,
  participantName: string,
  creatorName: string,
): Promise<PopulatedDatabaseGroupChat> => {
  try {
    // console.log('CHATTTTTID', chatId);
    // console.log('USERNAME', participantName);

    const res = await api.post(`${COMMUNITY_API_URL}/removeParticipantFromGroupChat/${chatId}`, {
      participantName,
      creatorName,
    });
    // console.log('res RES', res);

    if (res.status !== 200) {
      throw new Error(`Failed to remove participant: ${res.statusText}`);
    }
    return res.data;
  } catch (error) {
    throw new Error('Error when removing participant from group chat. Please try again.');
  }
};
/**
 * Creates a poll within a community
 * @param communityId - The ID of the community where the poll will be created
 * @param pollData - The data for the poll, including question and options
 * @returns The created poll or an error response
 * @throws Error Throws an error if the request fails or the response status is not 200
 */
export const createPoll = async (
  communityName: string,
  question: string,
  choices: string[],
): Promise<PopulatedDatabasePoll> => {
  const formattedChoices = choices.map(choice => ({
    text: choice, // use the choice string as text
    votes: 0, // set initial votes to 0
  }));
  const res = await api.post(`${COMMUNITY_API_URL}/createPoll/${communityName}/`, {
    question,
    choices: formattedChoices,
  });

  if (res.status !== 200) {
    throw new Error('Error when creating group chat');
  }

  return res.data;
};

/**
 * Fetches polls by community name.
 * @param communityName - The name of the community to fetch polls from.
 * @returns The polls for the specified community or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
export const getPollsByCommunityName = async (
  communityName: string,
): Promise<PollResponse | { error: string }> => {
  try {
    const res = await api.get(`${COMMUNITY_API_URL}/getPollsByCommunity/${communityName}`);
    if (res.status !== 200) {
      throw new Error('Error while getting poll by community ID');
    }
    return res.data;
  } catch (error) {
    return {
      error: `Error occurred when getting poll by community ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
/**
 * Votes on a poll within a community.
 * @param pollId - The ID of the poll to vote on.
 * @param username - The username of the voter.
 * @param choiceIndex - The index of the selected choice (0-based).
 * @returns The updated poll data or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 */
export const voteOnPoll = async (
  pollId: string,
  username: string,
  choiceIndex: number,
): Promise<PopulatedDatabasePoll> => {
  const res = await api.post(`${COMMUNITY_API_URL}/voteOnPoll`, {
    pollId,
    username,
    choiceIndex,
  });

  if (res.status !== 200) {
    throw new Error('Error when voting on poll');
  }

  return res.data;
};

/**
 * Adds a member to a community.
 * @param communityName The community to which the member will be added.
 * @param username The username of the member being added to the community.
 */
export const addMemberToCommunity = async (
  communityName: string,
  username: string,
): Promise<CommunityResponse> => {
  try {
    const res = await api.post(`${COMMUNITY_API_URL}/addMemberToCommunity/${communityName}`, {
      username,
    });

    if (res.status !== 200) {
      throw new Error('Error while adding member to community');
    }

    return res.data;
  } catch (error) {
    return { error: `Error occurred when adding member to community: ${error}` };
  }
};

/**
 * Bans a member from a community.
 * @param communityName The community from which the member will be banned.
 * @param username The username of the member being banned from the community.
 */
export const banMemberFromCommunity = async (
  communityName: string,
  username: string,
): Promise<CommunityResponse> => {
  try {
    const res = await api.post(`${COMMUNITY_API_URL}/banMemberFromCommunity/${communityName}`, {
      username,
    });

    if (res.status !== 200) {
      throw new Error('Error while banning member from community');
    }

    return res.data;
  } catch (error) {
    return { error: `Error occurred when banning member from community: ${error}` };
  }
};

/**
 * Updates the password visibility of a community.
 * @param communityName The community for which password visibility will be updated.
 * @param showPassword Whether or not the password should be shown.
 */
export const updatePasswordVisibility = async (
  communityName: string,
  showPassword: boolean,
): Promise<CommunityResponse> => {
  try {
    const res = await api.post(`${COMMUNITY_API_URL}/updatePasswordVisibility/${communityName}`, {
      showPassword,
    });

    if (res.status !== 200) {
      throw new Error('Error while banning member from community');
    }

    return res.data;
  } catch (error) {
    return { error: `Error occurred when banning member from community: ${error}` };
  }
};

/**
 * Displays the leadboard of NimGame within a community.
 * @param communityName The name of the community for which the leaderboard is fetched.
 * @returns The leaderboard data or an error response.
 * @throws Error Throws an error if the request fails or the response status is not 200.
 * @description This function fetches the leaderboard data for the NimGame within a specified community.
 */
export const getNimGameLeaderboard = async (communityName: string): Promise<CommunityResponse> => {
  try {
    if (!communityName) {
      throw new Error('Community name is required');
    }

    const res = await api.get(`${COMMUNITY_API_URL}/getTopNimWinners/${communityName}`);

    if (res.status !== 200) {
      throw new Error('Error while fetching NimGame leaderboard');
    }

    return res.data;
  } catch (error) {
    return { error: `Error occurred when fetching NimGame leaderboard: ${error}` };
  }
};
