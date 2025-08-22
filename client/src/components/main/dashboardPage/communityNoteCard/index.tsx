import React, { useEffect, useState } from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import { DatabaseCommunityNote, PopulatedDatabaseQuestion } from '../../../../types/types';
import { getQuestionById } from '../../../../services/questionService';
import useProfileSettings from '../../../../hooks/useProfileSettings';
import useDashboardPage from '../../../../hooks/useDashboardPage';

/**
 * Interface representing the props for the User component.
 *
 * user - The user object containing details about the user.
 * handleUserCardViewClickHandler - The function to handle the click event on the user card.
 */
interface CommunityNoteProps {
  communityNote: DatabaseCommunityNote;
}

const CommunityCardView = (props: CommunityNoteProps) => {
  const [questionDetails, setQuestionDetails] = useState<PopulatedDatabaseQuestion | null>(null);
  const { communityNote } = props;
  const { currentUser } = useProfileSettings();
  const { handleApproveNote, handleDenyNote } = useDashboardPage();

  useEffect(() => {
    const fetchQuestion = async () => {
      const data = await getQuestionById(communityNote.question, currentUser._id);
      setQuestionDetails(data);
    };

    fetchQuestion();
  }, [communityNote.question, currentUser._id]);

  return (
    <div className='community-note right_padding'>
      <div className='community-note-mid'>
        <div>Question:&nbsp;</div>
        <div className='community-note-question'>
          {questionDetails ? (
            <Link to={`/question/${communityNote.question}`}>{questionDetails.title}</Link>
          ) : (
            'Loading...'
          )}
        </div>
      </div>
      <div className='community-note-mid'>
        <div>Submitted note:&nbsp;</div>
        <div className='community-note-title'>{communityNote.noteText}</div>
      </div>
      {communityNote.sources && (
        <div className='community-note-mid'>
          <div>Additional provided sources:&nbsp;</div>
          <div className='community-note-title'>{communityNote.sources}</div>
        </div>
      )}
      <div className='btns-mod'>
        <button className='approve-button' onClick={() => handleApproveNote(communityNote)}>
          Approve
        </button>
        <button className='deny-button' onClick={() => handleDenyNote(communityNote)}>
          Deny
        </button>
        <div className='noteStats'>
          <div>created {new Date(communityNote.createdDateTime).toUTCString()}</div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCardView;
