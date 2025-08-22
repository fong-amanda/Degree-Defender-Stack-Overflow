import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as communityNoteService from '../../services/communitynote.service';
import { DatabaseCommunityNote } from '../../types/types';

const saveCommunityNoteSpy = jest.spyOn(communityNoteService, 'saveCommunityNote');
const getApprovedCommunityNotesSpy = jest.spyOn(communityNoteService, 'getApprovedCommunityNotes');
const editCommunityNoteSpy = jest.spyOn(communityNoteService, 'editCommunityNote');
const getPendingCommunityNotesSpy = jest.spyOn(communityNoteService, 'getPendingCommunityNotes');
const updateNoteStatusSpy = jest.spyOn(communityNoteService, 'updateNoteStatus');
const incrementHelpfulSpy = jest.spyOn(communityNoteService, 'incrementHelpful');
const incrementNotHelpfulSpy = jest.spyOn(communityNoteService, 'incrementNotHelpful');

describe('Community Note Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/community-notes/submit', () => {
    it('should create a new community note successfully', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockQuestionId = new mongoose.Types.ObjectId().toString();
      const noteId = new mongoose.Types.ObjectId();
      const mockAnswerId = new mongoose.Types.ObjectId().toString();

      const noteRequest = {
        noteText: 'This is a test community note',
        createdBy: mockUserId,
        question: mockQuestionId,
        answerId: mockAnswerId,
        sources: 'Some sources',
      };

      const mockCommunityNote: DatabaseCommunityNote = {
        _id: noteId,
        noteText: noteRequest.noteText,
        createdBy: mockUserId,
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

      saveCommunityNoteSpy.mockResolvedValue(mockCommunityNote);

      const response = await supertest(app).post('/api/community-notes/submit').send(noteRequest);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          noteText: mockCommunityNote.noteText,
          createdBy: mockCommunityNote.createdBy,
        }),
      );

      expect(saveCommunityNoteSpy).toHaveBeenCalledWith(
        noteRequest.noteText,
        noteRequest.createdBy,
        noteRequest.question,
        noteRequest.answerId,
        noteRequest.sources,
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidNote = {
        noteText: 'This is a test community note',
      };

      const response = await supertest(app).post('/api/community-notes/submit').send(invalidNote);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('Missing required fields'),
        }),
      );

      expect(saveCommunityNoteSpy).not.toHaveBeenCalled();
    });

    it('should return 500 when service returns an error', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockQuestionId = new mongoose.Types.ObjectId().toString();
      const mockAnswerId = new mongoose.Types.ObjectId().toString();

      const noteRequest = {
        noteText: 'This is a test community note',
        createdBy: mockUserId,
        question: mockQuestionId,
        answerId: mockAnswerId,
      };

      saveCommunityNoteSpy.mockResolvedValue({
        error: 'You can only submit one community note every 24 hours',
      });

      const response = await supertest(app).post('/api/community-notes/submit').send(noteRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'You can only submit one community note every 24 hours',
      });

      expect(saveCommunityNoteSpy).toHaveBeenCalledWith(
        noteRequest.noteText,
        noteRequest.createdBy,
        noteRequest.question,
        noteRequest.answerId,
        undefined,
      );
    });

    it('should return 500 when service throws an error', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockQuestionId = new mongoose.Types.ObjectId().toString();
      const mockAnswerId = new mongoose.Types.ObjectId().toString();

      const noteRequest = {
        noteText: 'This is a test community note',
        createdBy: mockUserId,
        question: mockQuestionId,
        answerId: mockAnswerId,
      };

      saveCommunityNoteSpy.mockImplementation(() => {
        throw new Error('Unexpected server error');
      });

      const response = await supertest(app).post('/api/community-notes/submit').send(noteRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Unexpected server error when attempting to save this community note',
      });

      expect(saveCommunityNoteSpy).toHaveBeenCalledWith(
        noteRequest.noteText,
        noteRequest.createdBy,
        noteRequest.question,
        noteRequest.answerId,
        undefined,
      );
    });
  });

  describe('GET /api/community-notes', () => {
    it('should return all approved community notes', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockQuestionId = new mongoose.Types.ObjectId().toString();

      const mockApprovedNotes: DatabaseCommunityNote[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          noteText: 'Approved note 1',
          createdBy: mockUserId,
          question: mockQuestionId,
          createdDateTime: new Date('2024-06-04'),
          helpfulCount: 2,
          notHelpfulCount: 0,
          status: 'approved',
          votes: {
            helpful: [new mongoose.Types.ObjectId().toString()],
            notHelpful: [],
          },
          notHelpfulReasons: [],
          answerId: new mongoose.Types.ObjectId().toString(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          noteText: 'Approved note 2',
          createdBy: mockUserId,
          question: mockQuestionId,
          createdDateTime: new Date('2024-06-05'),
          helpfulCount: 1,
          notHelpfulCount: 1,
          status: 'approved',
          votes: {
            helpful: [new mongoose.Types.ObjectId().toString()],
            notHelpful: [new mongoose.Types.ObjectId().toString()],
          },
          notHelpfulReasons: ['Not helpful'],
          answerId: new mongoose.Types.ObjectId().toString(),
        },
      ];

      getApprovedCommunityNotesSpy.mockResolvedValue(mockApprovedNotes);

      const response = await supertest(app).get('/api/community-notes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ noteText: 'Approved note 1', status: 'approved' }),
          expect.objectContaining({ noteText: 'Approved note 2', status: 'approved' }),
        ]),
      );

      expect(getApprovedCommunityNotesSpy).toHaveBeenCalled();
    });

    it('should return empty array when no approved notes exist', async () => {
      getApprovedCommunityNotesSpy.mockResolvedValue([]);

      const response = await supertest(app).get('/api/community-notes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(getApprovedCommunityNotesSpy).toHaveBeenCalled();
    });

    it('should return 500 when service throws an error', async () => {
      getApprovedCommunityNotesSpy.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await supertest(app).get('/api/community-notes');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch approved community notes' });
      expect(getApprovedCommunityNotesSpy).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/community-notes/editNote/:noteId', () => {
    it('should edit a community note successfully', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();
      const updatedNote = {
        noteText: 'Updated note text',
        sources: 'New source',
      };

      const mockResponse: DatabaseCommunityNote = {
        _id: new mongoose.Types.ObjectId(noteId),
        noteText: updatedNote.noteText,
        createdBy: new mongoose.Types.ObjectId().toString(),
        question: new mongoose.Types.ObjectId().toString(),
        createdDateTime: new Date(),
        helpfulCount: 0,
        notHelpfulCount: 0,
        status: 'pending',
        votes: { helpful: [], notHelpful: [] },
        notHelpfulReasons: [],
        answerId: new mongoose.Types.ObjectId().toString(),
      };

      editCommunityNoteSpy.mockResolvedValue(mockResponse);

      const response = await supertest(app)
        .patch(`/api/community-notes/editNote/${noteId}`)
        .send(updatedNote);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({ noteText: updatedNote.noteText }));
      expect(editCommunityNoteSpy).toHaveBeenCalledWith(noteId, updatedNote);
    });

    it('should return 400 if user tries to vote more than once', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      incrementHelpfulSpy.mockResolvedValue({ error: 'cannot vote more than once' });

      const response = await supertest(app).patch(`/api/community-notes/editNote/${noteId}`).send({
        voteType: 'helpful',
        userId,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'cannot vote more than once' });
      expect(incrementHelpfulSpy).toHaveBeenCalledWith(noteId, userId);
    });

    it('should return 400 if voteType is provided without userId', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();
      const response = await supertest(app).patch(`/api/community-notes/editNote/${noteId}`).send({
        voteType: 'helpful',
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing userId for vote' });
    });

    it('should return 500 if service throws an error', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();
      const updates = { noteText: 'Update' };

      editCommunityNoteSpy.mockImplementation(() => {
        throw new Error('Edit failed');
      });

      const response = await supertest(app)
        .patch(`/api/community-notes/editNote/${noteId}`)
        .send(updates);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Unexpected server error' });
    });
  });

  describe('GET /api/community-notes/getPendingNotes', () => {
    it('should return pending notes', async () => {
      const pendingNotes: DatabaseCommunityNote[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          noteText: 'Pending note',
          createdBy: new mongoose.Types.ObjectId().toString(),
          question: new mongoose.Types.ObjectId().toString(),
          createdDateTime: new Date(),
          helpfulCount: 0,
          notHelpfulCount: 0,
          status: 'pending',
          votes: { helpful: [], notHelpful: [] },
          notHelpfulReasons: [],
          answerId: new mongoose.Types.ObjectId().toString(),
        },
      ];

      getPendingCommunityNotesSpy.mockResolvedValue(pendingNotes);

      const response = await supertest(app).get('/api/community-notes/getPendingNotes');

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 500 if fetching pending notes fails', async () => {
      getPendingCommunityNotesSpy.mockImplementation(() => {
        throw new Error('Fetch failed');
      });

      const response = await supertest(app).get('/api/community-notes/getPendingNotes');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch pending community notes' });
    });
  });

  describe('PATCH /api/community-notes/updateNoteStatus', () => {
    it('should update the note status successfully', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();

      const updatedNote: DatabaseCommunityNote = {
        _id: new mongoose.Types.ObjectId(noteId),
        status: 'approved' as const,
        noteText: 'Approved',
        createdBy: new mongoose.Types.ObjectId().toString(),
        question: new mongoose.Types.ObjectId().toString(),
        createdDateTime: new Date(),
        helpfulCount: 1,
        notHelpfulCount: 0,
        votes: { helpful: [], notHelpful: [] },
        notHelpfulReasons: [],
        answerId: new mongoose.Types.ObjectId().toString(),
      };

      updateNoteStatusSpy.mockResolvedValue(updatedNote);

      const response = await supertest(app)
        .patch('/api/community-notes/updateNoteStatus')
        .send({ noteId, status: 'approved' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('approved');
      expect(updateNoteStatusSpy).toHaveBeenCalledWith(noteId, 'approved');
    });

    it('should return 500 if service fails', async () => {
      updateNoteStatusSpy.mockImplementation(() => {
        throw new Error('Update error');
      });

      const response = await supertest(app)
        .patch('/api/community-notes/updateNoteStatus')
        .send({ noteId: 'abc', status: 'approved' });

      expect(response.status).toBe(500);
      expect(response.text).toMatch(/Error when updating note status/);
    });
  });
  describe('PATCH /api/community-notes/editNote/:noteId', () => {
    it('should handle helpful vote', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const mockNote: DatabaseCommunityNote = {
        _id: new mongoose.Types.ObjectId(noteId),
        noteText: 'Great note!',
        createdBy: userId,
        question: new mongoose.Types.ObjectId().toString(),
        createdDateTime: new Date(),
        helpfulCount: 1,
        notHelpfulCount: 0,
        status: 'approved',
        votes: {
          helpful: [userId],
          notHelpful: [],
        },
        notHelpfulReasons: [],
        answerId: new mongoose.Types.ObjectId().toString(),
      };

      incrementHelpfulSpy.mockResolvedValue(mockNote);

      const response = await supertest(app).patch(`/api/community-notes/editNote/${noteId}`).send({
        voteType: 'helpful',
        userId,
      });

      expect(response.status).toBe(200);
      expect(incrementHelpfulSpy).toHaveBeenCalledWith(noteId, userId);
    });

    it('should handle notHelpful vote with reason', async () => {
      const noteId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const mockNote: DatabaseCommunityNote = {
        _id: new mongoose.Types.ObjectId(noteId),
        noteText: 'Needs improvement',
        createdBy: userId,
        question: new mongoose.Types.ObjectId().toString(),
        createdDateTime: new Date(),
        helpfulCount: 0,
        notHelpfulCount: 1,
        status: 'approved',
        votes: {
          helpful: [],
          notHelpful: [userId],
        },
        notHelpfulReasons: ['Unclear content'],
        answerId: new mongoose.Types.ObjectId().toString(),
      };

      incrementNotHelpfulSpy.mockResolvedValue(mockNote);

      const response = await supertest(app).patch(`/api/community-notes/editNote/${noteId}`).send({
        voteType: 'notHelpful',
        userId,
        reason: 'Unclear content',
      });

      expect(response.status).toBe(200);
      expect(incrementNotHelpfulSpy).toHaveBeenCalledWith(noteId, userId, 'Unclear content');
    });
  });

  describe('GET /api/community-notes/getPendingNotes', () => {
    it('should return 500 on service error', async () => {
      getPendingCommunityNotesSpy.mockImplementation(() => {
        throw new Error('DB error');
      });

      const response = await supertest(app).get('/api/community-notes/getPendingNotes');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch pending community notes',
      });
    });
  });

  describe('PATCH /api/community-notes/updateNoteStatus', () => {
    it('should return 500 on service error', async () => {
      updateNoteStatusSpy.mockResolvedValue({ error: 'Update failed' });

      const response = await supertest(app).patch('/api/community-notes/updateNoteStatus').send({
        noteId: new mongoose.Types.ObjectId().toString(),
        status: 'approved',
      });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating note status');
    });
  });
});
