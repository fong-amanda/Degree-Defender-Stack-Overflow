import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { validateHyperlink } from '../tool';
// import addAnswer from '../services/answerService';
// import useUserContext from './useUserContext';
// import { Answer } from '../types/types';

/**
 * Custom hook for managing the state and logic of an answer submission form.
 *
 * @returns text - the current text input for the answer.
 * @returns textErr - the error message related to the text input.
 * @returns setText - the function to update the answer text input.
 * @returns postAnswer - the function to submit the answer after validation.
 */
const useCommunityNoteForm = () => {
  const { aid } = useParams();
  const navigate = useNavigate();

  // const { user } = useUserContext();
  const [text, setText] = useState<string>('');
  const [textErr, setTextErr] = useState<string>('');
  const [answerID, setAnswerID] = useState<string>('');

  useEffect(() => {
    if (!aid) {
      setTextErr('Answer ID is missing.');
      navigate('/home');
      return;
    }

    if (answerID !== aid) {
      setAnswerID(aid);
    }
  }, [aid, answerID, navigate]);

  return {
    text,
    textErr,
    setText,
  };
};

export default useCommunityNoteForm;
