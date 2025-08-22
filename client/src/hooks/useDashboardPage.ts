import { useEffect, useState, useCallback } from 'react';
import {
  getPendingCommunityNotes,
  updateCommunityNoteStatus,
} from '../services/communityNoteService';
import { updateAcceptedNotesByUserID, updateRejectedNotesByUserID } from '../services/userService';
import { DatabaseCommunityNote, CommunityNoteUpdatePayload } from '../types/types';
import useCommunityNoteContext from './useCommunityNoteContext';

const useDashboardPage = () => {
  const { socket } = useCommunityNoteContext();

  const [notesList, setNotesList] = useState<DatabaseCommunityNote[]>([]);
  const [, setSelectedNote] = useState<DatabaseCommunityNote | null>(null);
  const titleText = 'Pending Community Notes';

  const fetchData = useCallback(async () => {
    const res = await getPendingCommunityNotes();
    setNotesList(res || []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleNoteUpdated = (payload: CommunityNoteUpdatePayload) => {
      setNotesList(prevNotes =>
        prevNotes.map(note =>
          note._id.toString() === payload.note._id.toString() ? payload.note : note,
        ),
      );
    };

    socket.on('communityNoteUpdate', handleNoteUpdated);

    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('communityNoteUpdate', handleNoteUpdated);
    };
  }, [socket]);

  const handleApproveNote = async (communityNote: DatabaseCommunityNote) => {
    setSelectedNote(communityNote);

    await updateCommunityNoteStatus(communityNote._id.toString(), 'approved');
    await updateAcceptedNotesByUserID(communityNote.createdBy);
  };

  const handleDenyNote = async (communityNote: DatabaseCommunityNote) => {
    setSelectedNote(communityNote);

    await updateCommunityNoteStatus(communityNote._id.toString(), 'rejected');
    await updateRejectedNotesByUserID(communityNote.createdBy);
  };

  return { titleText, notesList, handleApproveNote, handleDenyNote };
};

export default useDashboardPage;
