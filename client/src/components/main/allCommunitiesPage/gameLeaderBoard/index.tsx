import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../../../../types/types'; // Correctly import LeaderboardEntry
import { getNimGameLeaderboard } from '../../../../services/communitygroupService';
import './index.css';

interface LeaderboardProps {
  communityName: string; // Accept communityName as a prop
}

const Leaderboard: React.FC<LeaderboardProps> = ({ communityName }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]); // Use the updated LeaderboardEntry type
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the leaderboard data for the community.
   */
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        if (!communityName) {
          throw new Error('Community name is undefined');
        }
        const response = await getNimGameLeaderboard(communityName);

        if (!Array.isArray(response)) {
          throw new Error('Unexpected response format');
        }

        setLeaderboard(response); // Set the leaderboard state with the new structure
      } catch (err) {
        setError(`Error fetching leaderboard: ${err}`);
      }
    };

    if (communityName) {
      fetchLeaderboard();
    }
  }, [communityName]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className='leaderboard-container'>
      <h1>Leaderboard</h1>
      {error ? (
        <div className='error-message'>{error}</div>
      ) : (
        <table className='leaderboard-table'>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Nim Wins</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{entry.username}</td>
                <td>{entry.nimWins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;
