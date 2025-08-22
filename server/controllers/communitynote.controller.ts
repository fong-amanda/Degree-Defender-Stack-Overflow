import express, { Response, Router } from 'express';
import { AddCommunityNoteRequest, FakeSOSocket, DatabaseCommunityNote } from '../types/types';
import {
  saveCommunityNote,
  getApprovedCommunityNotes,
  getPendingCommunityNotes,
  updateNoteStatus,
  editCommunityNote,
  incrementHelpful,
  incrementNotHelpful,
} from '../services/communitynote.service';

const communityNoteController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Validates the input for a new community note.
   * @param noteText The content of the note.
   * @param createdBy The user who created the note.
   * @param res The response to send an error message.
   * @returns True if the input is valid, false otherwise.
   */
  const validateCommunityNoteInput = (
    noteText: string,
    createdBy: string,
    question: string,
    res: Response,
  ): boolean => {
    if (!noteText || !createdBy || !question) {
      res.status(400).json({
        error: 'Missing required fields: noteText, createdBy, or question.',
      });
      return false;
    }

    return true;
  };

  /**
   * handles the submission of a new community note
   * @param req submitted note that includes the note text and the user who created it
   * @param res response to send back to the client
   * @returns void if successful, error response if not
   */
  const submitNote = async (req: AddCommunityNoteRequest, res: Response): Promise<void> => {
    try {
      const { noteText, createdBy, question, answerId, sources } = req.body;

      if (!validateCommunityNoteInput(noteText, createdBy, question, res)) {
        return;
      }

      const result = await saveCommunityNote(noteText, createdBy, question, answerId, sources);
      if ('error' in result) {
        res.status(500).send(result);
        return;
      }

      res.status(201).send(result);
    } catch (error) {
      res
        .status(500)
        .send({ error: 'Unexpected server error when attempting to save this community note' });
    }
  };

  /**
   * Fetches all approved community notes
   *  @param _req request object
   *  @param res response object
   * @returns void if successful, error response if not
   * */
  const getApprovedNotes = async (_req: express.Request, res: Response): Promise<void> => {
    try {
      const notes = await getApprovedCommunityNotes();
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch approved community notes' });
    }
  };

  /**
   * Checks if the update is a vote update
   * @param updates The updates to check
   * @returns True if the update is a vote update, false otherwise
   */
  const handleVote = async (
    voteType: 'helpful' | 'notHelpful',
    noteId: string,
    userId: string,
    reason?: string,
  ): Promise<DatabaseCommunityNote | { error: string }> => {
    if (voteType === 'helpful') {
      return incrementHelpful(noteId, userId);
    }
    return incrementNotHelpful(noteId, userId, reason);
  };

  /**
   * Handles the editing of a community note
   * @param req request object
   * @param res response object
   * @returns void if successful, error response if not
   */
  const editNote = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const noteId = req.params.noteId?.trim();
      const updates = req.body;
      const userId = updates.userId?.trim();

      if (!noteId || !updates || typeof updates !== 'object') {
        res.status(400).json({ error: 'Missing or invalid fields for update' });
        return;
      }

      let result;
      if (updates.voteType === 'helpful' || updates.voteType === 'notHelpful') {
        if (!userId) {
          res.status(400).json({ error: 'Missing userId for vote' });
          return;
        }
        result = await handleVote(updates.voteType, noteId, userId, updates.reason);
      } else {
        result = await editCommunityNote(noteId, updates);
      }

      if ('error' in result) {
        res.status(400).json({ error: 'cannot vote more than once' });
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Unexpected server error' });
    }
  };

  /**
   * Fetches all pending community notes
   *  @param _req request object
   *  @param res response object
   * @returns void if successful, error response if not
   * */
  const getPendingNotes = async (_req: express.Request, res: Response): Promise<void> => {
    try {
      const notes = await getPendingCommunityNotes();
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending community notes' });
    }
  };

  const handleUpdateNoteStatus = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const { noteId, status } = req.body;

      const updatedNote = await updateNoteStatus(noteId, status);

      if ('error' in updatedNote) {
        throw new Error(updatedNote.error);
      }

      socket.emit('communityNoteUpdate', {
        note: updatedNote,
        type: status,
      });

      res.status(200).json(updatedNote);
    } catch (error) {
      res.status(500).send(`Error when updating note status: ${error}`);
    }
  };

  router.post('/submit', submitNote);
  router.get('/', getApprovedNotes);
  router.patch('/editNote/:noteId', editNote);
  router.get('/getPendingNotes', getPendingNotes);
  router.patch('/updateNoteStatus', handleUpdateNoteStatus);
  return router;
};

export default communityNoteController;
