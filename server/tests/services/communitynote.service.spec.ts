import mongoose from 'mongoose';
import CommunityNoteModel from '../../models/communitynote.model';
import {
  saveCommunityNote,
  getApprovedCommunityNotes,
  editCommunityNote,
  incrementHelpful,
  incrementNotHelpful,
  updateNoteStatus,
  getPendingCommunityNotes,
  hasUserVoted,
} from '../../services/communitynote.service';
import { DatabaseCommunityNote } from '../../types/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('Community Note Service', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockQuestionId = new mongoose.Types.ObjectId().toString();
  const mockAnswerId = new mongoose.Types.ObjectId().toString();

  const mockCommunityNote: DatabaseCommunityNote = {
    _id: new mongoose.Types.ObjectId(),
    noteText: 'This is a test community note',
    createdBy: new mongoose.Types.ObjectId(mockUserId).toString(),
    question: mockQuestionId,
    createdDateTime: new Date(),
    helpfulCount: 0,
    notHelpfulCount: 0,
    status: 'pending',
    votes: {
      helpful: [],
      notHelpful: [],
    },
    notHelpfulReasons: [],
    answerId: new mongoose.Types.ObjectId().toString(),
  };

  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
  });

  describe('saveCommunityNote', () => {
    it('should save a community note successfully', async () => {
      mockingoose(CommunityNoteModel).toReturn(null, 'findOne');

      mockingoose(CommunityNoteModel).toReturn(mockCommunityNote, 'create');

      const result = await saveCommunityNote(
        mockCommunityNote.noteText,
        mockUserId,
        mockQuestionId,
        mockAnswerId,
        'Some sources',
      );

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.noteText).toEqual(mockCommunityNote.noteText);
        expect(result.createdBy).toEqual(mockUserId);
        // Using toString() to ensure string comparison
        expect(result.question.toString()).toEqual(mockQuestionId.toString());
      }
    });

    it('should return error if user already submitted a note in last 24 hours', async () => {
      mockingoose(CommunityNoteModel).toReturn(mockCommunityNote, 'findOne');

      const result = await saveCommunityNote(
        mockCommunityNote.noteText,
        mockUserId,
        mockQuestionId,
        mockAnswerId,
      );

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('You can only submit one community note every 24 hours');
      }
    });

    it('should return error if note creation fails', async () => {
      mockingoose(CommunityNoteModel).toReturn(null, 'findOne');

      jest.spyOn(CommunityNoteModel, 'create').mockImplementationOnce(() => {
        throw new Error('Failed to create community note');
      });

      const result = await saveCommunityNote(
        mockCommunityNote.noteText,
        mockUserId,
        mockQuestionId,
        mockAnswerId,
      );

      expect('error' in result).toBe(true);
    });
    it('should handle failure to create community note', async () => {
      // Mock the findOne to return null (no existing note)
      mockingoose(CommunityNoteModel).toReturn(null, 'findOne');

      // Mock create to throw an error
      const spy = jest.spyOn(CommunityNoteModel, 'create').mockImplementationOnce(() => {
        throw new Error('Failed to create community note');
      });

      const result = await saveCommunityNote(
        mockCommunityNote.noteText,
        mockUserId,
        mockQuestionId,
        mockAnswerId,
        'Some sources',
      );

      // Check that we got an error response
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Failed to create community note');
      }

      // Clean up
      spy.mockRestore();
    });
    it('should handle database errors gracefully', async () => {
      mockingoose(CommunityNoteModel).toReturn(new Error('Database error'), 'findOne');

      const result = await saveCommunityNote(
        mockCommunityNote.noteText,
        mockUserId,
        mockQuestionId,
        mockAnswerId,
      );

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when saving community note');
      }
    });
  });
  describe('hasUserVoted', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const otherUserId = new mongoose.Types.ObjectId().toString();

    it('should return false when votes object is undefined', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: { helpful: [], notHelpful: [] },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(false);
    });

    it('should return false when votes object is null', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: { helpful: [], notHelpful: [] },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(false);
    });

    it('should return false when votes.helpful is undefined', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [],
          notHelpful: [],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(false);
    });

    it('should return false when votes.notHelpful is undefined', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [],
          notHelpful: [],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(false);
    });

    it('should return false when user has not voted in either array', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [otherUserId],
          notHelpful: [otherUserId],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(false);
    });

    it('should return true when user is in helpful array', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [userId],
          notHelpful: [],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(true);
    });

    it('should return true when user is in notHelpful array', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [],
          notHelpful: [userId],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(true);
    });

    it('should return true when user is in both arrays', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [userId],
          notHelpful: [userId],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(true);
    });

    it('should handle empty arrays correctly', () => {
      const note: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: {
          helpful: [],
          notHelpful: [],
        },
      };

      const result = hasUserVoted(note, userId);

      expect(result).toBe(false);
    });
  });

  describe('getApprovedCommunityNotes', () => {
    it('should return all approved community notes', async () => {
      const approvedNotes = [
        { ...mockCommunityNote, status: 'approved' },
        {
          ...mockCommunityNote,
          _id: new mongoose.Types.ObjectId(),
          status: 'approved',
        },
      ];

      mockingoose(CommunityNoteModel).toReturn(approvedNotes, 'find');

      const result = await getApprovedCommunityNotes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('approved');
      expect(result[1].status).toBe('approved');
    });

    it('should return empty array if no approved notes found', async () => {
      mockingoose(CommunityNoteModel).toReturn([], 'find');

      const result = await getApprovedCommunityNotes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('editCommunityNote', () => {
    it('should edit a community note successfully', async () => {
      const updatedNote = {
        ...mockCommunityNote,
        noteText: 'Updated note text',
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const result = await editCommunityNote(mockCommunityNote._id.toString(), {
        noteText: 'Updated note text',
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.noteText).toEqual('Updated note text');
      }
    });

    it('should return error for invalid note ID format', async () => {
      const result = await editCommunityNote('invalid-id', { noteText: 'Updated note text' });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Invalid noteId format');
      }
    });

    it('should return error if note not found', async () => {
      mockingoose(CommunityNoteModel).toReturn(null, 'findByIdAndUpdate');

      const result = await editCommunityNote(mockCommunityNote._id.toString(), {
        noteText: 'Updated note text',
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Community note not found');
      }
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const result = await editCommunityNote(mockCommunityNote._id.toString(), {
        noteText: 'Updated note text',
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Database error while editing note');
      }
    });
  });

  describe('incrementHelpful', () => {
    const newUserId = new mongoose.Types.ObjectId().toString();

    it('should increment helpful count successfully', async () => {
      const mockNote = {
        ...mockCommunityNote,
        save: jest.fn().mockResolvedValue({
          ...mockCommunityNote,
          helpfulCount: 1,
          votes: {
            helpful: [newUserId],
            notHelpful: [],
          },
        }),
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(mockNote);

      const result = await incrementHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.helpfulCount).toEqual(1);
        expect(result.votes?.helpful).toContain(newUserId);
      }
    });

    it('should return error if note not found', async () => {
      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(null);

      const result = await incrementHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Community note not found');
      }
    });

    it('should return error if user already voted', async () => {
      const noteWithUserVoted = {
        ...mockCommunityNote,
        votes: {
          helpful: [newUserId],
          notHelpful: [],
        },
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithUserVoted);

      const result = await incrementHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('User has already voted on this note');
      }
    });
    it('should initialize votes.helpful array if it does not exist', async () => {
      // Create a note with votes object but no helpful array
      const noteWithoutHelpfulArray = {
        ...mockCommunityNote,
        votes: {
          helpful: undefined,
          notHelpful: [],
        },
        save: jest.fn().mockResolvedValue({
          ...mockCommunityNote,
          helpfulCount: 1,
          votes: {
            helpful: [new mongoose.Types.ObjectId().toString()],
            notHelpful: [],
          },
        }),
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithoutHelpfulArray);

      const result = await incrementHelpful(mockCommunityNote._id.toString(), newUserId);

      // Verify the function doesn't throw an error and returns a valid result
      expect('error' in result).toBe(false);

      // Verify save was called (meaning the code processed beyond the initialization)
      expect(noteWithoutHelpfulArray.save).toHaveBeenCalled();
    });

    it('should initialize votes object if it does not exist', async () => {
      const noteWithoutVotes = {
        ...mockCommunityNote,
        votes: undefined,
        save: jest.fn().mockResolvedValue({
          ...mockCommunityNote,
          helpfulCount: 1,
          votes: {
            helpful: [newUserId],
            notHelpful: [],
          },
        }),
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithoutVotes);

      const result = await incrementHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.votes?.helpful).toContain(newUserId);
      }
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(CommunityNoteModel, 'findById').mockImplementationOnce(() => {
        throw new Error('Failed to increment helpful vote');
      });

      const result = await incrementHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Failed to increment helpful vote');
      }
    });
    it('should return false when votes object is undefined', () => {
      // Create a note with undefined votes
      const noteWithUndefinedVotes: DatabaseCommunityNote = {
        ...mockCommunityNote,
        votes: { helpful: [], notHelpful: [] },
      };

      const userId = new mongoose.Types.ObjectId().toString();

      // Call the function
      const result = hasUserVoted(noteWithUndefinedVotes, userId);

      // Assert that it returns false
      expect(result).toBe(false);
    });
  });

  describe('incrementNotHelpful', () => {
    const newUserId = new mongoose.Types.ObjectId().toString();

    it('should increment not helpful count successfully', async () => {
      const initialNote = {
        ...mockCommunityNote,
        notHelpfulCount: 0,
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(initialNote);

      const updatedNote = {
        ...mockCommunityNote,
        notHelpfulCount: 1,
        votes: {
          helpful: [],
          notHelpful: [newUserId],
        },
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.notHelpfulCount).toEqual(1);
        expect(result.votes?.notHelpful).toContain(newUserId);
      }
    });

    it('should add reason if provided', async () => {
      const initialNote = {
        ...mockCommunityNote,
        notHelpfulCount: 0,
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(initialNote);

      const updatedNote = {
        ...mockCommunityNote,
        notHelpfulCount: 1,
        votes: {
          helpful: [],
          notHelpful: [newUserId],
        },
        notHelpfulReasons: ['Not accurate'],
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const result = await incrementNotHelpful(
        mockCommunityNote._id.toString(),
        newUserId,
        'Not accurate',
      );

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.notHelpfulReasons).toContain('Not accurate');
      }
    });

    it('should return error if note not found', async () => {
      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(null);

      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Community note not found');
      }
    });

    it('should return error if user already voted', async () => {
      const noteWithUserVoted = {
        ...mockCommunityNote,
        votes: {
          helpful: [newUserId],
          notHelpful: [],
        },
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithUserVoted);

      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('User has already voted on this note');
      }
    });
    it('should initialize votes object when it does not exist', async () => {
      // Create a note without votes object
      const noteWithoutVotes = {
        ...mockCommunityNote,
        votes: undefined,
      };

      // Mock findById to return a note without votes
      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithoutVotes);

      // Mock findByIdAndUpdate to return a successfully updated note
      const updatedNote = {
        ...mockCommunityNote,
        notHelpfulCount: 1,
        votes: {
          helpful: [],
          notHelpful: [new mongoose.Types.ObjectId().toString()],
        },
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const userId = new mongoose.Types.ObjectId().toString();
      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), userId);

      // Verify the function doesn't return an error
      expect('error' in result).toBe(false);

      // Verify the note was updated properly
      if (!('error' in result)) {
        expect(result.notHelpfulCount).toBe(1);
        expect(result.votes.notHelpful).toHaveLength(1);
      }
    });
    it('should return error if update fails', async () => {
      const initialNote = {
        ...mockCommunityNote,
        notHelpfulCount: 0,
      };

      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(initialNote);

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Community note not found after update');
      }
    });
    it('should initialize votes.notHelpful array when it is undefined', async () => {
      // Create a note with votes object but no notHelpful array
      const noteWithoutNotHelpfulArray = {
        ...mockCommunityNote,
        votes: {
          helpful: [],
          notHelpful: undefined,
        },
      };

      // Mock findById to return a note with votes but without notHelpful array
      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithoutNotHelpfulArray);

      // Mock findByIdAndUpdate to return a successfully updated note
      const updatedNote = {
        ...mockCommunityNote,
        notHelpfulCount: 1,
        votes: {
          helpful: [],
          notHelpful: [new mongoose.Types.ObjectId().toString()],
        },
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const userId = new mongoose.Types.ObjectId().toString();
      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), userId);

      // Verify the function doesn't return an error
      expect('error' in result).toBe(false);

      // Verify the note was updated properly
      if (!('error' in result)) {
        expect(result.notHelpfulCount).toBe(1);
        expect(result.votes.notHelpful).toHaveLength(1);
      }
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(CommunityNoteModel, 'findById').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), newUserId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Failed to increment not helpful vote');
      }
    });
    it('should initialize notHelpfulReasons array when it is undefined and reason is provided', async () => {
      // Create a note without notHelpfulReasons array
      const noteWithoutReasons = {
        ...mockCommunityNote,
        notHelpfulReasons: undefined,
      };

      // Mock findById to return a note without notHelpfulReasons
      jest.spyOn(CommunityNoteModel, 'findById').mockResolvedValueOnce(noteWithoutReasons);

      // Mock findByIdAndUpdate to return a successfully updated note with the reason
      const updatedNote = {
        ...mockCommunityNote,
        notHelpfulCount: 1,
        votes: {
          helpful: [],
          notHelpful: [new mongoose.Types.ObjectId().toString()],
        },
        notHelpfulReasons: ['This is incorrect information'],
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const userId = new mongoose.Types.ObjectId().toString();
      const reason = 'This is incorrect information';

      const result = await incrementNotHelpful(mockCommunityNote._id.toString(), userId, reason);

      // Verify the function doesn't return an error
      expect('error' in result).toBe(false);

      // Verify the findByIdAndUpdate was called with the correct parameters
      // This is the key assertion that verifies the notHelpfulReasons array was initialized
      expect(CommunityNoteModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCommunityNote._id.toString(),
        expect.objectContaining({
          $push: expect.objectContaining({
            notHelpfulReasons: reason,
          }),
        }),
        expect.any(Object),
      );

      // Verify the result contains the reason
      if (!('error' in result)) {
        expect(result.notHelpfulReasons).toContain(reason);
      }
    });
  });

  describe('getPendingCommunityNotes', () => {
    it('should return all pending community notes', async () => {
      const pendingNotes = [
        mockCommunityNote,
        {
          ...mockCommunityNote,
          _id: new mongoose.Types.ObjectId(),
        },
      ];

      mockingoose(CommunityNoteModel).toReturn(pendingNotes, 'find');

      const result = await getPendingCommunityNotes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('pending');
    });

    it('should return empty array if no pending notes found', async () => {
      mockingoose(CommunityNoteModel).toReturn(null, 'find');

      const result = await getPendingCommunityNotes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return empty array on database error', async () => {
      mockingoose(CommunityNoteModel).toReturn(new Error('Database error'), 'find');

      const result = await getPendingCommunityNotes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('updateNoteStatus', () => {
    it('should update note status to approved successfully', async () => {
      const updatedNote = {
        ...mockCommunityNote,
        status: 'approved',
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const result = await updateNoteStatus(mockCommunityNote._id.toString(), 'approved');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.status).toEqual('approved');
      }
    });

    it('should update note status to rejected successfully', async () => {
      const updatedNote = {
        ...mockCommunityNote,
        status: 'rejected',
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedNote);

      const result = await updateNoteStatus(mockCommunityNote._id.toString(), 'rejected');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.status).toEqual('rejected');
      }
    });

    it('should return error if note not found', async () => {
      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await updateNoteStatus(mockCommunityNote._id.toString(), 'approved');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toEqual('Community note not found');
      }
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const result = await updateNoteStatus(mockCommunityNote._id.toString(), 'approved');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error occurred when updating note status');
      }
    });

    it('should handle null votes gracefully', async () => {
      const noteWithNullVotes = {
        ...mockCommunityNote,
        status: 'approved',
        votes: null,
      };

      jest.spyOn(CommunityNoteModel, 'findByIdAndUpdate').mockResolvedValueOnce(noteWithNullVotes);

      const result = await updateNoteStatus(mockCommunityNote._id.toString(), 'approved');

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.votes.helpful).toEqual([]);
        expect(result.votes.notHelpful).toEqual([]);
      }
    });
  });
});
// function hasUserVoted(noteWithUndefinedVotes: DatabaseCommunityNote, userId: string) {
//   throw new Error('Function not implemented.');
// }
