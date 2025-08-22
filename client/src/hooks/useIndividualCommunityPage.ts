import { ObjectId } from 'mongodb';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import useUserContext from './useUserContext';
import { createGroupChat } from '../services/communitygroupService';

/**
 * Custom hook to fetch all community group chats for the logged-in user.
 * It also handles creating a new group chat.
 *
 * @returns An object containing the group chats, a loading state, and methods to create a group chat.
 */
const useAllCommunityGroupChats = () => {
  const { name } = useParams<{ name: string }>();

  const [newGroupName, setNewGroupName] = useState<string>(''); // State for the new group name
  const [newGroupParticipants, setNewGroupParticipants] = useState<string[]>([]); // State for participants in the new group
  const { user, socket } = useUserContext();
  const [error, setError] = useState<string | null>(null);
  const [newCommunityID, setNewCommunityID] = useState<string>(' ');

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
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
      // setSelectedChat(chat);
      handleJoinChat(chat._id);
      // setShowCreatePanel(false);
      setNewGroupName('');
    } catch (err) {
      setError('Failed to create group chat');
    }
  };
  const handleCommunitySelect = (id: string) => {
    setNewCommunityID(id); // Set the communityID when a community is selected
  };

  return {
    user,
    newGroupName,
    setNewGroupName,
    newGroupParticipants,
    setNewGroupParticipants,
    error,
    handleCreateGroupChat,
    handleCommunitySelect,
    newCommunityID,
    setNewCommunityID,
  };
};

export default useAllCommunityGroupChats;
