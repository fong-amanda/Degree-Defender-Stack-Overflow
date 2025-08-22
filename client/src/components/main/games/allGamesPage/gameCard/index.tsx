import React from 'react';
import './index.css';
import { GameInstance, GameState } from '../../../../../types/types';

/**
 * Component to display a game card with details about a specific game instance.
 * @param game The game instance to display.
 * @param handleJoin Function to handle joining the game. Takes the game ID as an argument.
 * @returns A React component rendering the game details and a join button if the game is waiting to start.
 */
const GameCard = ({
  game,
  handleJoin,
}: {
  game: GameInstance<GameState>;
  handleJoin: (gameID: string) => void;
}) => (
  <div className='game-item'>
    <div className='specific-game-layout'>
      <p className='game-info'>
        <span>
          <strong>Game ID:</strong> {game.gameID}
        </span>
        <span>
          <strong>Status:</strong> {game.state.status}
        </span>
      </p>
      {game.state.status === 'WAITING_TO_START' && (
        <button className='standard-button' onClick={() => handleJoin(game.gameID)}>
          Join Game
        </button>
      )}
    </div>
    <ul className='game-players'>
      {game.players.map((player: string) => (
        <li key={`${game.gameID}-${player}`}>{player}</li>
      ))}
    </ul>
  </div>
);

export default GameCard;
