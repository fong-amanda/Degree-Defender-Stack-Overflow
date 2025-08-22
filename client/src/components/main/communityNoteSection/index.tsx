import { useEffect, useState } from 'react';
import { getMetaData } from '../../../tool';
import { CommunityNote, DatabaseCommunityNote } from '../../../types/types';
import './index.css';
import { editCommunityNote, getCommunityNotes } from '../../../services/communityNoteService';
import useUserContext from '../../../hooks/useUserContext';

interface CommunityNoteSectionProps {
  answerId: string;
}

const CommunityNoteSection = ({ answerId }: CommunityNoteSectionProps) => {
  const { user } = useUserContext();
  const [communityNotes, setCommunityNotes] = useState<CommunityNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notHelpfulReasons, setNotHelpfulReasons] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editTexts, setEditTexts] = useState<Record<string, string>>({});
  const [editSources, setEditSources] = useState<Record<string, string>>({});

  const fetchNotes = async () => {
    const response = await getCommunityNotes();

    if ('error' in response) {
      setError(response.error);
    } else if (Array.isArray(response)) {
      const approvedNotes = response.filter(
        (note: DatabaseCommunityNote) => note.status === 'approved' && note.answerId === answerId,
      );

      const normalizedNotes = approvedNotes.map(note => ({
        ...note,
        _id: String(note._id),
      }));

      setCommunityNotes(normalizedNotes);

      const initialEditing: Record<string, boolean> = {};
      const initialTexts: Record<string, string> = {};
      const initialSources: Record<string, string> = {};
      normalizedNotes.forEach(note => {
        initialEditing[note._id] = false;
        initialTexts[note._id] = note.noteText;
        initialSources[note._id] = note.sources || '';
      });

      setIsEditing(initialEditing);
      setEditTexts(initialTexts);
      setEditSources(initialSources);
    } else {
      setError('Unexpected response format');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  });

  const handleHelpfulClick = async (noteId: string) => {
    if (!user?._id) return;

    const result = await editCommunityNote(noteId, {
      voteType: 'helpful',
      userId: user._id.toString(),
    });

    if ('error' in result) {
      setVoteError(result.error);
      return;
    }

    setVoteError(null);
    setCommunityNotes(prev =>
      prev.map(note =>
        note._id === noteId ? { ...note, ...result, _id: String(result._id) } : note,
      ),
    );
  };

  const handleNotHelpfulClick = async (noteId: string) => {
    if (!user?._id) return;

    const reason = notHelpfulReasons[noteId];

    const result = await editCommunityNote(noteId, {
      voteType: 'notHelpful',
      userId: user._id.toString(),
      reason,
    });

    if ('error' in result) {
      setError(result.error);
      return;
    }

    setCommunityNotes(prev =>
      prev.map(note =>
        note._id === noteId ? { ...note, ...result, _id: String(result._id) } : note,
      ),
    );

    setNotHelpfulReasons(prev => ({ ...prev, [noteId]: '' }));
  };

  const handleEditClick = (noteId: string) => {
    setIsEditing(prev => ({ ...prev, [noteId]: true }));
  };

  const handleCancelEdit = (noteId: string) => {
    setIsEditing(prev => ({ ...prev, [noteId]: false }));
  };

  const handleSaveEdit = async (noteId: string) => {
    const noteText = editTexts[noteId];
    const sources = editSources[noteId];

    const result = await editCommunityNote(noteId, {
      noteText,
      sources,
      status: 'pending',
    });

    if ('error' in result) {
      setError(result.error);
      return;
    }

    // Refresh notes after save to remove the updated (now pending) note from list
    fetchNotes();
  };

  return (
    <div className='community-note-section'>
      <div className='community-note-container'>
        {voteError && <p className='error'>{voteError}</p>}
        <div className='community-notes-list'>
          {loading && <p>Loading community notes...</p>}
          {error && <p className='error'>{error}</p>}
          {!loading && communityNotes.length > 0
            ? communityNotes.map(note => (
                <div key={note._id} className='community-note-item'>
                  {user?._id === note.createdBy && isEditing[note._id] ? (
                    <>
                      <textarea
                        value={editTexts[note._id]}
                        onChange={e =>
                          setEditTexts(prev => ({ ...prev, [note._id]: e.target.value }))
                        }
                      />
                      <textarea
                        value={editSources[note._id]}
                        onChange={e =>
                          setEditSources(prev => ({ ...prev, [note._id]: e.target.value }))
                        }
                      />
                      <button className='bluebtn' onClick={() => handleSaveEdit(note._id)}>
                        Save
                      </button>
                      <button className='cancelbtn' onClick={() => handleCancelEdit(note._id)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <p className='note-text'>{note.noteText}</p>
                      <small className='note-meta'>
                        Time posted: {getMetaData(new Date(note.createdDateTime))}
                      </small>
                      {user?._id === note.createdBy && (
                        <button className='bluebtn' onClick={() => handleEditClick(note._id)}>
                          Edit
                        </button>
                      )}
                    </>
                  )}
                  <div className='helpful-section'>
                    <button className='helpful-button' onClick={() => handleHelpfulClick(note._id)}>
                      Helpful
                    </button>
                    <span>{note.helpfulCount ?? 0} Helpful</span>
                  </div>
                  <div className='not-helpful-section'>
                    <button
                      className='not-helpful-button'
                      onClick={() => handleNotHelpfulClick(note._id)}>
                      Not Helpful
                    </button>
                    <span>{note.notHelpfulCount ?? 0} Not Helpful</span>
                    <input
                      type='text'
                      placeholder='Why is this not helpful?'
                      value={notHelpfulReasons[note._id] || ''}
                      onChange={e =>
                        setNotHelpfulReasons(prev => ({ ...prev, [note._id]: e.target.value }))
                      }
                      className='not-helpful-reason-input'
                    />
                  </div>
                </div>
              ))
            : !loading && <p className='no-notes'>No approved community notes.</p>}
        </div>
      </div>
    </div>
  );
};

export default CommunityNoteSection;
