import { ObjectId } from 'mongodb';
import { SetStateAction, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  // DatabaseGroupChat,
  // GroupChatResponse,
  Message,
  // PopulatedDatabaseChat,
  PopulatedDatabaseGroupChat,
} from '../types/types';
import useUserContext from './useUserContext';
import {
  createGroupChat,
  getGroupChatByCommunityName,
  addParticipantToGroupChat,
  getGroupChatById,
  sendGroupChatMessage,
  removeParticipantFromGroupChat,
  deleteMessageFromGroupChat,
} from '../services/communitygroupService';

/**
 * Custom hook to fetch all community group chats for the logged-in user.
 * It also handles creating a new group chat.
 *
 * @returns An object containing the group chats, a loading state, and methods to create a group chat.
 */

/**
 * Custom hook to manage the state and logic for community group chats.
 * It includes fetching group chats by community name, sending messages,
 * creating new group chats, and managing the selected chat.
 *
 * @returns An object containing the following:
 * - `groupChats`: The list of group chats for the community.
 * - `handleSendMessage`: A function to send a message in the selected chat.
 * - `user`: The logged-in user.
 * - `loading`: A boolean indicating whether the data is still loading.
 * - `newGroupName`: The name of the new group chat being created.
 * - `setNewGroupName`: A function to update the new group name.
 * - `newGroupParticipants`: The participants of the new group chat.
 * - `setNewGroupParticipants`: A function to update the participants of the new group chat.
 * - `error`: An error message for any error that occurs.
 * - `showCreatePanel`: A boolean indicating whether the create group chat panel is visible.
 * - `setShowCreatePanel`: A function to toggle the visibility of the create group chat panel.
 * - `handleCreateGroupChat`: A function to create a new group chat.
 * - `handleChatSelect`: A function to select a chat and join it.
 * - `newCommunityID`: The ID of the new community being selected.
 * - `setNewCommunityID`: A function to update the new community ID.
 * - `newMessage`: The message being sent in the selected chat.
 * - `selectedChat`: The currently selected chat.
 * - `setNewMessage`: A function to update the new message.
 */
const useAllCommunityGroupChats = () => {
  const { name } = useParams<{ name: string }>();
  // const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  // const [groupChats, setGroupChats] = useState<GroupChatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<PopulatedDatabaseGroupChat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newGroupName, setNewGroupName] = useState<string>(''); // State for the new group name
  const [newGroupParticipants, setNewGroupParticipants] = useState<string[]>([]); // State for participants in the new group
  const { user, socket } = useUserContext();
  const [error, setError] = useState<string | null>(null);
  const [newCommunityID, setNewCommunityID] = useState<string>(' ');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [groupChats, setGroupChats] = useState<PopulatedDatabaseGroupChat[]>([]); // Store multiple group chats
  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };
  const loggedInUserId = user?.username;

  useEffect(() => {
    const fetchGroupChats = async () => {
      setError(null);
      try {
        if (!name) {
          setError('Community name is required');
          return;
        }
        // console.log('Fetching group chats for community:', name);
        const groupChat = await getGroupChatByCommunityName(name);
        // console.log('Fetched group chats:', groupChat);
        if (Array.isArray(groupChat)) {
          setGroupChats(groupChat);
        } else {
          setError('Problem fetching group chats');
        }
      } catch (fetchError) {
        setError('Error fetching group chats');
        // console.error('Error fetching group chats:', fetchError);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupChats();
  }, [name]);
  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedChat?._id) {
      const message: Omit<Message, 'type'> = {
        msg: newMessage,
        msgFrom: user.username,
        msgDateTime: new Date(),
      };

      const chat = await sendGroupChatMessage(message, selectedChat._id);

      setSelectedChat(chat);
      setError(null);
      setNewMessage('');
    } else {
      setError('Message cannot be empty');
    }
  };

  const handleGroupChatSelect = async (chatID: ObjectId | undefined) => {
    if (!chatID) {
      setError('Invalid chat ID');
      return;
    }

    const chat = await getGroupChatById(chatID);
    setSelectedChat(chat);
    handleJoinChat(chatID);
  };

  const handleCreateGroupChat = async (
    communityID: string,
    groupName: string,
    participants: string[],
  ) => {
    if (!groupName) {
      setError('Group name is required');
      return;
    }

    try {
      if (!name) {
        setError('Community name is required');
        return;
      }
      const chat = await createGroupChat(name, groupName, participants);
      setSelectedChat(chat);
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setNewGroupName('');
    } catch (err) {
      setError('Failed to create group chat');
    }
  };
  const handleCreateGroup = () => {
    // The creator is automatically added as the participant
    const creatorUsername = user.username; // Replace with actual username from the context
    handleCreateGroupChat(newCommunityID, newGroupName, [creatorUsername]); // Creates the group with the creator as the first participant
    setNewGroupName('');
    setShowCreatePanel(false);
  };
  const joinGroupChat = async (chatID: ObjectId | undefined, userId: string) => {
    if (!chatID) return;

    try {
      const response = await addParticipantToGroupChat(chatID, userId);
      if (!response) {
        setError('Failed to join group chat');
      } else {
        setGroupChats(prevChats =>
          prevChats.map(chat =>
            'participants' in chat && chat._id === chatID
              ? { ...chat, participants: [...chat.participants, userId] }
              : chat,
          ),
        );
      }
    } catch (err) {
      setError('Error joining the group chat');
    }
  };
  const [showParticipants, setShowParticipants] = useState(false);

  const toggleParticipants = () => {
    setShowParticipants(prev => !prev);
  };

  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const handleDeleteMessage = async (messageId: SetStateAction<string | null>) => {
    setDeletingMessageId(messageId); // Set deleting state for feedback/UI

    try {
      if (selectedChat) {
        // Call the backend service to delete the message
        if (typeof messageId === 'string') {
          await deleteMessageFromGroupChat(selectedChat._id.toString(), messageId, user.username);
        } else {
          setError('Invalid message ID');
        }

        // Create updated messages list without the deleted message
        const updatedMessages = selectedChat.messages.filter(
          message => message._id.toString() !== messageId,
        );

        // Update selectedChat state directly
        setSelectedChat(prevChat => {
          if (!prevChat) return null;
          return {
            ...prevChat,
            messages: updatedMessages,
          };
        });

        // Update groupChats state
        setGroupChats(prevChats =>
          prevChats.map(chat =>
            chat._id === selectedChat._id
              ? {
                  ...chat,
                  messages: updatedMessages,
                }
              : chat,
          ),
        );

        // Clear any existing errors since the operation succeeded
        setError(null);
      }
    } catch (err) {
      setError('Error deleting message from group chat');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleRemoveParticipant = async (participant: string) => {
    if (selectedChat) {
      try {
        await removeParticipantFromGroupChat(
          selectedChat._id.toString(),
          participant,
          user.username,
        );

        // Update groupChats
        const updatedChats = groupChats.map(chat =>
          chat._id === selectedChat._id
            ? { ...chat, participants: chat.participants.filter(p => p !== participant) }
            : chat,
        );
        setGroupChats(updatedChats);

        // Also update selectedChat
        const updatedSelectedChat = {
          ...selectedChat,
          participants: selectedChat.participants.filter(p => p !== participant),
        };
        handleGroupChatSelect(updatedSelectedChat._id);

        // console.log(`Removed ${participant} from group chat.`);
      } catch (err) {
        // console.error('Error removing participant:', err);
        setError('Error removing participant');
      }
    }
  };
  const useIsParticipant = (chatId: string, currentUserId: string, participants: string[]) => {
    const [isParticipant, setIsParticipant] = useState(false);

    useEffect(() => {
      setIsParticipant(participants.includes(currentUserId));
    }, [chatId, currentUserId, participants]);

    return isParticipant;
  };
  return {
    groupChats,
    handleSendMessage,
    user,
    loading,
    newGroupName,
    setNewGroupName,
    newGroupParticipants,
    setNewGroupParticipants,
    error,
    showCreatePanel,
    setShowCreatePanel,
    handleCreateGroupChat,
    handleGroupChatSelect,
    newCommunityID,
    setNewCommunityID,
    newMessage,
    selectedChat,
    setNewMessage,
    handleCreateGroup,
    setGroupChats,
    loggedInUserId,
    joinGroupChat,
    handleJoinChat,
    handleRemoveParticipant,
    handleDeleteMessage,
    showParticipants,
    toggleParticipants,
    deletingMessageId,
    setDeletingMessageId,
    useIsParticipant,
  };
};

export default useAllCommunityGroupChats;
