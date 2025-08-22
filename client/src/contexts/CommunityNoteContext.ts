import { createContext } from 'react';
import { FakeSOSocket, DatabaseCommunityNote } from '../types/types';

/**
 * Interface represents the context type for user-related data and a WebSocket connection.
 *
 * - user - the current user.
 * - socket - the WebSocket connection associated with the current user.
 */
export interface CommunityNoteContextType {
  communityNote: DatabaseCommunityNote | null;
  socket: FakeSOSocket | null;
}

const CommunityNoteContext = createContext<CommunityNoteContextType | null>(null);

export default CommunityNoteContext;
