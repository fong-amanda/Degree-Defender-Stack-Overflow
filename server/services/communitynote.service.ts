import mongoose, { UpdateQuery } from 'mongoose';
import CommunityNoteModel from '../models/communitynote.model';
import { CommunityNote, CommunityNoteResponse, DatabaseCommunityNote } from '../types/types';

/**
 * Checks if the user has already voted on the note.
 * @param {DatabaseCommunityNote} note - The community note object.
 * @param {string} userId - The ID of the user.
 * @returns {boolean} - True if the user has voted, false otherwise.
 */
const hasUserVoted = (note: DatabaseCommunityNote, userId: string): boolean => {
  if (!note.votes) {
    return false;
  }

  return note.votes?.helpful?.includes(userId) || note.votes?.notHelpful?.includes(userId);
};

/**
 * Saves a new community note to the database.
 *
 * @param {string} noteText - The content of the community note.
 * @param {string} createdBy - The ID of the user who created the note.
 * @param {string} question - The ID of the question the note is associated with.
 * @param {string} [sources] - Optional sources or citations for the note.
 * @returns {Promise<CommunityNoteResponse>} - Resolves with the saved community note or an error message.
 */
const saveCommunityNote = async (
  noteText: string,
  createdBy: string,
  question: string,
  answerId: string,
  sources?: string,
): Promise<CommunityNoteResponse> => {
  try {
    // console.log('Saving note with data:', { noteText, createdBy, question, answerId, sources });

    const existingNote = await CommunityNoteModel.findOne({
      createdBy: new mongoose.Types.ObjectId(createdBy),
      question: new mongoose.Types.ObjectId(question),
      createdDateTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existingNote) {
      throw new Error('You can only submit one community note every 24 hours.');
    }

    const result: DatabaseCommunityNote = await CommunityNoteModel.create({
      noteText,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      question: new mongoose.Types.ObjectId(question),
      answerId: new mongoose.Types.ObjectId(answerId),
      sources,
    });

    if (!result) {
      throw new Error('Failed to create community note');
    }

    const savedNote: CommunityNoteResponse = {
      _id: result._id,
      noteText: result.noteText,
      createdBy: result.createdBy.toString(),
      question: result.question,
      answerId: result.answerId.toString(),
      createdDateTime: result.createdDateTime,
      helpfulCount: result.helpfulCount,
      notHelpfulCount: result.notHelpfulCount,
      status: result.status,
      sources: result.sources,
      votes: result.votes,
      notHelpfulReasons: result.notHelpfulReasons,
    };

    return savedNote;
  } catch (error) {
    // console.error('Error in saveCommunityNote:', error);
    return { error: `Error occurred when saving community note: ${error}` };
  }
};

/**
 * Returns all community notes with status "approved"
 * @returns {Promise<DatabaseCommunityNote[]>} - Resolves with an array of approved community notes.
 */
const getApprovedCommunityNotes = async (): Promise<DatabaseCommunityNote[]> =>
  CommunityNoteModel.find({ status: 'approved' });

/**
 * Edits an existing community note in the database.
 * @param noteId the community note ID
 * @param updates the updates to apply to the community note
 * @returns the updated community note or an error message
 */
const editCommunityNote = async (
  noteId: string,
  updates: Partial<CommunityNote>,
): Promise<DatabaseCommunityNote | { error: string }> => {
  try {
    if (!mongoose.isValidObjectId(noteId)) {
      return { error: 'Invalid noteId format' };
    }

    const updatedNote = await CommunityNoteModel.findByIdAndUpdate(noteId, updates, {
      new: true,
    });

    if (!updatedNote) {
      return { error: 'Community note not found' };
    }

    return updatedNote;
  } catch (err) {
    return { error: 'Database error while editing note' };
  }
};

/**
 * Increments the helpfulCount field.
 * @param noteId the community note ID
 * @returns the updated community note or an error message
 */
const incrementHelpful = async (
  noteId: string,
  userId: string,
): Promise<DatabaseCommunityNote | { error: string }> => {
  try {
    const note = await CommunityNoteModel.findById(noteId);
    if (!note) return { error: 'Community note not found' };

    if (!note.votes) {
      note.votes = { helpful: [], notHelpful: [] }; // Initialize if it doesn't exist
    }

    if (hasUserVoted(note, userId)) {
      return { error: 'User has already voted on this note' };
    }

    // Ensure votes.helpful exists before pushing
    if (!note.votes.helpful) {
      note.votes.helpful = [];
    }

    note.helpfulCount = (note.helpfulCount ?? 0) + 1;
    note.votes.helpful.push(new mongoose.Types.ObjectId(userId).toString());
    await note.save();

    return note;
  } catch (err) {
    return { error: 'Failed to increment helpful vote' };
  }
};

/**
 * Increments the notHelpfulCount field.
 * @param noteId the community note ID
 * @param reason the reason for marking the note as not helpful
 * @returns the updated community note or an error message
 */
const incrementNotHelpful = async (
  noteId: string,
  userId: string,
  reason?: string,
): Promise<DatabaseCommunityNote | { error: string }> => {
  try {
    const note = await CommunityNoteModel.findById(noteId);
    if (!note) return { error: 'Community note not found' };

    if (!note.votes) {
      note.votes = { helpful: [], notHelpful: [] }; // Initialize if it doesn't exist
    }

    const alreadyVoted = hasUserVoted(note, userId);
    if (alreadyVoted) return { error: 'User has already voted on this note' };

    // Ensure votes.notHelpful exists before pushing
    if (!note.votes.notHelpful) {
      note.votes.notHelpful = [];
    }

    const updateQuery: UpdateQuery<DatabaseCommunityNote> = {
      $inc: { notHelpfulCount: 1 },
      $push: { 'votes.notHelpful': userId },
    };

    if (reason) {
      // Ensure notHelpfulReasons exists before pushing
      if (!note.notHelpfulReasons) {
        note.notHelpfulReasons = [];
      }
      updateQuery.$push!.notHelpfulReasons = reason;
    }

    const updated = await CommunityNoteModel.findByIdAndUpdate(noteId, updateQuery, {
      new: true,
    });

    if (!updated) {
      return { error: 'Community note not found after update' };
    }

    return updated;
  } catch (err) {
    return { error: 'Failed to increment not helpful vote' };
  }
};

/**
 * Returns all community notes with status "approved"
 */
const getPendingCommunityNotes = async (): Promise<DatabaseCommunityNote[]> => {
  try {
    const notes: DatabaseCommunityNote[] | null = await CommunityNoteModel.find({
      status: 'pending',
    });

    if (!notes) {
      return []; // Return an empty array instead of throwing an error
    }

    return notes;
  } catch (err) {
    return []; // Return an empty array on error
  }
};

/**
 * Updates the status of a community note.
 * @param noteId the community note ID
 * @param status the new status to set
 * @returns the updated community note or an error message
 */
const updateNoteStatus = async (
  noteId: string,
  status: 'approved' | 'pending' | 'rejected',
): Promise<CommunityNoteResponse> => {
  try {
    const updatedNote: DatabaseCommunityNote | null = await CommunityNoteModel.findByIdAndUpdate(
      noteId,
      { status },
      { new: true },
    );

    if (!updatedNote) {
      return { error: 'Community note not found' };
    }

    const response: CommunityNoteResponse = {
      _id: updatedNote._id,
      noteText: updatedNote.noteText,
      createdBy: updatedNote.createdBy.toString(),
      question: updatedNote.question,
      createdDateTime: updatedNote.createdDateTime,
      helpfulCount: updatedNote.helpfulCount,
      notHelpfulCount: updatedNote.notHelpfulCount,
      status: updatedNote.status,
      sources: updatedNote.sources,
      votes: {
        helpful: updatedNote.votes?.helpful || [], // Handle undefined cases
        notHelpful: updatedNote.votes?.notHelpful || [], // Handle undefined cases
      },
      notHelpfulReasons: updatedNote.notHelpfulReasons,
      answerId: updatedNote.answerId,
    };

    return response;
  } catch (error) {
    return { error: `Error occurred when updating note status: ${error}` };
  }
};

export {
  saveCommunityNote,
  getApprovedCommunityNotes,
  editCommunityNote,
  incrementHelpful,
  incrementNotHelpful,
  updateNoteStatus,
  getPendingCommunityNotes,
  hasUserVoted,
};
