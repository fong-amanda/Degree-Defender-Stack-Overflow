import { useState, useEffect } from 'react';
import './index.css';
import useAllCommunityGroupChats from '../../../../hooks/useAllCommunityGroupChats';
import { getGroupChatByCommunityName } from '../../../../services/communitygroupService';
import GroupChatsListCard from './chatsListCard';
import GroupMessageCard from './chatsListCard/GroupMessageCard.tsx';

interface CommunityGroupChatProps {
  name: string;
}

/**
 * CommunityGroupChat component renders a page for community group messaging.
 * It includes a form to create a new group chat.
 */
const CommunityGroupChat = ({ name }: CommunityGroupChatProps) => {
  const {
    newGroupName,
    setNewGroupName,
    error,
    setNewMessage,
    handleGroupChatSelect,
    newMessage,
    handleSendMessage,
    selectedChat,
    handleCreateGroup,
    groupChats,
    setGroupChats,
    joinGroupChat,
    loggedInUserId,
    user,
    handleDeleteMessage,
    // showParticipants,
    // toggleParticipants,
    handleRemoveParticipant,
  } = useAllCommunityGroupChats();
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);

  /**
   * Fetches group chats based on the community name.
   * If the community name is not provided, it returns an empty array.
   */
  useEffect(() => {
    const fetchGroupChats = async () => {
      if (!name) return;
      try {
        const response = await getGroupChatByCommunityName(name);
        if ('error' in response) {
          // console.error('Error fetching community:', response.error);
          setGroupChats([]);
        } else {
          setGroupChats(
            Array.isArray(response)
              ? response.map(chat => ({
                  ...chat,
                  _id: chat._id || '',
                  createdAt: chat.createdAt || new Date(),
                  updatedAt: chat.updatedAt || new Date(),
                }))
              : [
                  {
                    ...response,
                    _id: response._id || '',
                    createdAt: response.createdAt || new Date(),
                    updatedAt: response.updatedAt || new Date(),
                  },
                ],
          );
        }
      } catch (fetchError) {
        setGroupChats([]);
      }
    };

    fetchGroupChats();
  }, [name, setGroupChats]); // <-- This is the closing bracket for the useEffect hook

  return (
    <>
      {/* Create Group Chat Panel */}
      <div className='create-gc-panel'>
        <div className='groupchats-options-header'>
          <h1> Group Chats </h1>
          <button
            className='create-groupchat-button'
            onClick={() => setShowCreatePanel(prevState => !prevState)}>
            {showCreatePanel ? 'Hide Create Group Panel' : 'Create a Group'}
          </button>
          {error && <div className='group-chat-error'>{error}</div>}
        </div>

        {/* Show Create Group Chat Panel */}
        {showCreatePanel && (
          <div>
            <input
              className='custom-input'
              type='text'
              placeholder='Group Name'
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
            <button className='custom-button' onClick={handleCreateGroup}>
              Create New Group
            </button>
          </div>
        )}
        <div className='chat-container'>
          {selectedChat ? (
            <>
              <div className='specific-chat-header'>
                <h2 className='groupchat-name'>{selectedChat.name}</h2>
                <button
                  onClick={() => setShowParticipantsList(prev => !prev)}
                  className='standard-button'>
                  <strong>
                    {showParticipantsList ? 'Hide Participants' : 'Show Participants'}
                  </strong>
                </button>
              </div>
              {showParticipantsList && (
                <div className='participants-list'>
                  {selectedChat.participants.map(participant => (
                    <div key={participant} className='participant-item'>
                      <span>{participant}</span>
                      {selectedChat.creator === user.username && (
                        <button
                          onClick={() => handleRemoveParticipant(participant)}
                          className='remove-participant-button'>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!showParticipantsList && (
                <>
                  <div className='chat-messages'>
                    {selectedChat.messages.map(message => (
                      <GroupMessageCard
                        key={String(message._id)}
                        message={message}
                        currentUserUsername={user.username}
                        handleDeleteMessage={handleDeleteMessage}
                        groupChatCreator={selectedChat.creator}
                      />
                    ))}
                  </div>
                  <div className='message-input'>
                    <input
                      className='custom-input'
                      type='text'
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder='Type a message...'
                    />
                    <button className='custom-button' onClick={handleSendMessage}>
                      Send
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p> No group selected.</p>
          )}
        </div>
        <div className='group-chats-list'>
          {groupChats.length > 0 ? (
            groupChats.map(chat => (
              <div key={chat._id.toString()} className='group-chat-item'>
                <GroupChatsListCard
                  key={String(chat._id)}
                  chat={chat}
                  currentUserId={loggedInUserId}
                  handleGroupChatSelect={handleGroupChatSelect}
                  handleJoinGroupChat={joinGroupChat}
                />
              </div>
            ))
          ) : (
            <p>No group chats found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default CommunityGroupChat;
