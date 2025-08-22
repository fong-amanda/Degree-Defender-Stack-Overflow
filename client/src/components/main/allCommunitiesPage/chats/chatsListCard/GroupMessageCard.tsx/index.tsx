import React from 'react';
import './index.css';
import { DatabaseMessage } from '@fake-stack-overflow/shared';
import { getMetaData } from '../../../../../../tool';

/**
 * MessageCard component displays a single message with its sender and timestamp.
 *
 * @param message: The message object to display.
 */
const GroupMessageCard = ({
  message,
  currentUserUsername,
  handleDeleteMessage,
  groupChatCreator,
}: {
  message: DatabaseMessage;
  currentUserUsername: string;
  handleDeleteMessage: (messageId: string) => void;
  groupChatCreator: string;
}) => (
  <div className='message'>
    <div className='message-header'>
      <div className='message-sender'>{message.msgFrom}</div>
      <div className='message-time'>{getMetaData(new Date(message.msgDateTime))}</div>
    </div>
    <div className='message-body'>{message.msg}</div>

    {groupChatCreator === currentUserUsername && (
      <button
        className='delete-message-button'
        onClick={() => handleDeleteMessage(message._id.toString())}>
        Delete
      </button>
    )}
  </div>
);

export default GroupMessageCard;
