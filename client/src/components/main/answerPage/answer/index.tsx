import React, { useState } from 'react';
import { handleHyperlink } from '../../../../tool';
import CommentSection from '../../commentSection';
import './index.css';
import {
  Comment,
  CommunityNote,
  DatabaseComment,
  DatabaseCommunityNote,
} from '../../../../types/types';
import CommunityNoteForm from '../../communityNoteForm';
import CommunityNoteSection from '../../communityNoteSection';

interface AnswerProps {
  text: string;
  ansBy: string;
  meta: string;
  comments: DatabaseComment[];
  handleAddComment: (comment: Comment) => void;
  answerId: string;
  communityNotes?: DatabaseCommunityNote[];
  handleAddCommunityNote?: (note: CommunityNote) => void;
}

const AnswerView = ({
  text,
  ansBy,
  meta,
  comments,
  handleAddComment,
  communityNotes,
  answerId,
  handleAddCommunityNote = () => {},
}: AnswerProps) => {
  const [showCommunityNoteForm, setShowCommunityNoteForm] = useState(false);
  const [showCommunityNotes, setShowCommunityNotes] = useState(false);

  return (
    <div className='answer right_padding'>
      <div className='column-formatting'>
        <div id='answerText' className='answerText'>
          {handleHyperlink(text)}
        </div>
        <div className='community-notes-container'>
          <button
            className='standard-btn-remodel'
            onClick={() => setShowCommunityNotes(!showCommunityNotes)}>
            {showCommunityNotes ? 'Hide Community Notes' : 'Show Community Notes'}
          </button>
          {showCommunityNotes && <CommunityNoteSection answerId={answerId} />}
        </div>
      </div>
      <div className='answerAuthor'>
        <div className='answer_author'>{ansBy}</div>
        <div className='answer_question_meta'>{meta}</div>
      </div>

      <CommentSection
        comments={comments}
        handleAddComment={handleAddComment}
        communityNotes={communityNotes || []}
        handleAddCommunityNote={handleAddCommunityNote || (() => {})}
      />

      <button
        className='standard-button'
        onClick={() => setShowCommunityNoteForm(!showCommunityNoteForm)}>
        {showCommunityNoteForm ? 'Cancel' : 'Submit a Community Note'}
      </button>

      {showCommunityNoteForm && (
        <CommunityNoteForm
          onClose={() => setShowCommunityNoteForm(false)}
          communityNotes={[]}
          answerId={answerId}
        />
      )}
    </div>
  );
};

export default AnswerView;
