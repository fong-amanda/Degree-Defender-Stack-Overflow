import api from './config';
import { CommunityNote, CommunityNoteResponse, DatabaseCommunityNote } from '../types/types';

const COMMUNITY_NOTE_API_URL = `${process.env.REACT_APP_SERVER_URL}/api/community-notes`;

interface CommunityNoteUpdate {
  voteType?: 'helpful' | 'notHelpful';
  userId?: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Submits a new community note.
 *
 * @param noteText - The content of the community note.
 * @param createdBy - The ID of the user who created the note.
 * @param question - The question associated with the community note.
 * @param sources - Optional sources for the note.
 * @returns A response object representing the saved note or an error message.
 */
const submitCommunityNote = async (
  noteText: string,
  createdBy: string,
  question: string,
  answerId: string,
  sources?: string,
): Promise<CommunityNoteResponse> => {
  try {
    // Add this console.log to verify data being sent
    // console.log('Sending to server:', { noteText, createdBy, question, answerId, sources });

    const res = await api.post(`${COMMUNITY_NOTE_API_URL}/submit`, {
      noteText,
      createdBy,
      question,
      answerId, // Make sure this is included in the request body
      sources,
    });

    // Log the response
    // console.log('Server response:', res.data);

    if (res.status !== 201) {
      throw new Error('Error submitting community note');
    }

    return res.data;
  } catch (error) {
    return {
      error: `Error occurred while submitting community note: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};

/**
 * Fetches all community notes.
 *
 * @returns An array of community notes or an error message.
 */
const getCommunityNotes = async (): Promise<DatabaseCommunityNote[] | { error: string }> => {
  try {
    const res = await api.get(`${COMMUNITY_NOTE_API_URL}`);
    return res.data;
  } catch (error) {
    return {
      error: `Error occurred while fetching community notes: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};

/**
 * Edits a community note (used for voting, text updates, etc).
 *
 * @param noteId - The ID of the note to update.
 * @param updates - The fields to update (e.g. helpfulCount, noteText, status).
 * @returns The updated note or an error message.
 */
const editCommunityNote = async (
  noteId: string,
  updates: CommunityNoteUpdate,
): Promise<CommunityNote | { error: string }> => {
  try {
    const res = await api.patch(`${COMMUNITY_NOTE_API_URL}/editNote/${noteId}`, updates);
    return res.data;
  } catch (error) {
    return {
      error: `Error editing community note: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};

/**
 * Function to get approved notes
 *
 * @throws Error if there is an issue fetching approved notes.
 */
const getApprovedCommunityNotes = async (): Promise<DatabaseCommunityNote[]> => {
  const res = await api.get(`${COMMUNITY_NOTE_API_URL}/`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Function to get pending notes
 *
 * @throws Error if there is an issue fetching pending notes.
 */
const getPendingCommunityNotes = async (): Promise<DatabaseCommunityNote[]> => {
  const res = await api.get(`${COMMUNITY_NOTE_API_URL}/getPendingNotes`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Updates the status of a community note.
 *
 * @param noteId - The ID of the community note to update.
 * @param status - The new status ('approved', 'rejected', or 'pending').
 * @returns A promise that resolves when the status is updated successfully, or rejects with an error.
 */
const updateCommunityNoteStatus = async (
  noteId: string,
  status: 'approved' | 'rejected' | 'pending',
): Promise<CommunityNoteResponse> => {
  try {
    const res = await api.patch(`${COMMUNITY_NOTE_API_URL}/updateNoteStatus`, {
      noteId,
      status,
    });

    if (res.status !== 200) {
      throw new Error('Error updating community note status');
    }

    return res.data;
  } catch (error) {
    return {
      error: `Error occurred while updating community note status: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};

export {
  submitCommunityNote,
  getApprovedCommunityNotes,
  getPendingCommunityNotes,
  updateCommunityNoteStatus,
  getCommunityNotes,
  editCommunityNote,
};
