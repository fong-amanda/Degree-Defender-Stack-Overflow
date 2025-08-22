import { useContext } from 'react';
import CommunityNoteContext, { CommunityNoteContextType } from '../contexts/CommunityNoteContext';

/**
 * Custom hook to access the current user context.
 *
 * @returns context - Returns the user context object, which contains user and socket information.
 *
 * @throws it will throw an error if the context is not found or is null.
 */
const useCommunityNoteContext = (): CommunityNoteContextType => {
  const context = useContext(CommunityNoteContext);

  if (context === null) {
    throw new Error('Community note context is null.');
  }

  return context;
};

export default useCommunityNoteContext;
