import React from 'react';
import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseGroupChat } from '../../../../../types/types';
import useAllCommunityGroupChats from '../../../../../hooks/useAllCommunityGroupChats';

/**
 * GroupChatsListCard component displays a chat card and allows the user to join if not already in it.
 *
 * @param chat The chat object containing details like participants and chat ID.
 * @param currentUserId The ID of the currently logged-in user.
 * @param handleGroupChatSelect Function to handle chat selection.
 * @param handleJoinGroupChat Function to join the group chat.
 */
const GroupChatsListCard = ({
  chat,
  currentUserId,
  handleGroupChatSelect,
  handleJoinGroupChat,
}: {
  chat: PopulatedDatabaseGroupChat;
  currentUserId: string;
  handleGroupChatSelect: (chatID: ObjectId | undefined) => void;
  handleJoinGroupChat: (chatID: ObjectId | undefined, userId: string) => void;
}) => {
  const { useIsParticipant } = useAllCommunityGroupChats();
  const isParticipant = useIsParticipant(chat._id.toString(), currentUserId, chat.participants);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleJoinGroupChat(chat._id, currentUserId);
  };

  return (
    <div
      className={`chats-list-card ${isParticipant ? 'clickable' : 'disabled'}`}
      onClick={isParticipant ? () => handleGroupChatSelect(chat._id) : undefined} // Only allow click if participant
    >
      <p className='indiv-chat-name'>{chat.name}</p>

      {/* Show join button if the user is not a participant */}
      {!isParticipant ? (
        <button onClick={handleJoinClick} className='join-group-button'>
          Join Chat
        </button>
      ) : (
        <p className='joined-text'>
          You are already in this chat! Click anywhere on this chat panel to keep chatting.
        </p>
      )}
    </div>
  );
};

export default GroupChatsListCard;
