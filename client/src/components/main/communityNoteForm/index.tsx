import React, { useEffect, useState } from 'react';
import './index.css';
import { useParams } from 'react-router-dom';
import { submitCommunityNote } from '../../../services/communityNoteService';
import useUserContext from '../../../hooks/useUserContext';
import { CommunityNote } from '../../../types/types';

interface CommunityNoteFormProps {
  onClose: () => void;
  communityNotes: CommunityNote[]; // new prop to receive all community notes
  answerId: string;
}

/**
 * CommunityNoteForm component allows users to submit a community note.
 */
const CommunityNoteForm: React.FC<CommunityNoteFormProps> = ({
  onClose,
  communityNotes,
  answerId,
}) => {
  const { user } = useUserContext();
  const { qid } = useParams();

  const [note, setNote] = useState('');
  const [sources, setSources] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Added

  /**
   * Handles closing the note with an escape key.
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  /**
   * Handles the submission of the note.
   */
  const handleSubmit = async () => {
    if (note.trim() === '') {
      setError('Note is required.');
      return;
    }

    if (!user?._id) {
      setError('You must be logged in to submit a community note.');
      return;
    }

    if (!qid) {
      setError('Missing question ID. Cannot submit note.');
      return;
    }

    if (!answerId) {
      setError('Missing answer ID. Cannot submit note.');
      return;
    }

    // console.log('answerid ', answerId);
    // 24-hour limit check
    const recentNote = communityNotes.find(
      communityNote =>
        communityNote.createdBy === user._id.toString() &&
        communityNote.question.toString() === qid &&
        new Date(communityNote.createdDateTime).getTime() > Date.now() - 24 * 60 * 60 * 1000,
    );

    if (recentNote) {
      setError('You can only submit one community note every 24 hours.');
      return;
    }

    const result = await submitCommunityNote(
      note.trim(),
      user._id.toString(),
      qid,
      answerId,
      sources.trim(),
    );

    // console.log('resulttt', result);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    setNote('');
    setSources('');
    setError('');
    setSuccessMessage('Community note submitted successfully!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={e => e.stopPropagation()}>
        <h3>Submit a Community Note</h3>

        <label htmlFor='note-text'>Note (Required):</label>
        <textarea
          id='note-text'
          className={`note-text ${error ? 'error' : ''}`}
          placeholder='Write your note here...'
          value={note}
          onChange={e => {
            setNote(e.target.value);
            if (e.target.value.trim() !== '') {
              setError('');
            }
          }}
        />
        {error && <p className='error-text'>{error}</p>}
        {successMessage && <p className='success-text'>{successMessage}</p>}

        <label htmlFor='sources'>Sources:</label>
        <textarea
          id='sources'
          className='sources'
          placeholder='Optionally, provide any relevant sources to support your note.'
          value={sources}
          onChange={e => setSources(e.target.value)}
        />

        <div className='form-buttons'>
          <button className='standard-button' onClick={handleSubmit}>
            Submit
          </button>
          <button className='standard-button' onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityNoteForm;
