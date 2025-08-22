import React from 'react';
import usePolls from '../../../../hooks/useAllCommunityPolls';
import './index.css';

/**
 * CommunityPolls component allows users to create and view polls within a community.
 * It includes a form for creating polls and displays the list of existing polls.
 */
const CommunityPolls = ({ name }: { name: string }) => {
  const {
    polls,
    error,
    optionError,
    handleCreatePoll,
    showCreatePanel,
    setShowCreatePanel,
    newPollTitle,
    setNewPollTitle,
    newPollOptions,
    handleOptionChange,
    addOptionField,
    voteError,
    setVoteError,
    voteSuccess,
    handleVote,
    selectedChoices,
    handleChoiceChange,
    currentUser,
  } = usePolls();

  return (
    <div className='polls-container'>
      {/* Create Poll Panel */}
      <div className='polls-options-header'>
        <h1> Polls </h1>
        <button className='custom-button' onClick={() => setShowCreatePanel(prev => !prev)}>
          {showCreatePanel ? 'Hide Create Poll Panel' : 'Create a Poll'}
        </button>

        {error && <div className='poll-error'>{error}</div>}
      </div>
      {showCreatePanel && (
        <div className='poll-creation-panel'>
          <div className='poll-options-container'>
            <input
              className='custom-input'
              type='text'
              placeholder='Poll Question'
              value={newPollTitle}
              onChange={e => setNewPollTitle(e.target.value)}
            />
            {newPollOptions.map((option, index) => (
              <input
                key={`new-poll-option-${index}`}
                className='custom-input'
                type='text'
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={e => handleOptionChange(index, e.target.value)}
              />
            ))}
            {/* Add button to add more options */}
            <button
              className='custom-button add-option-button'
              type='button'
              onClick={addOptionField}>
              + Add Option
            </button>
          </div>

          {/* Display option error if present */}
          {optionError && <div className='poll-error'>{optionError}</div>}

          <button
            className='custom-button'
            onClick={() => handleCreatePoll(name, newPollTitle, newPollOptions)}
            disabled={!!optionError} // Disable button when there's an error
          >
            Create Poll
          </button>
        </div>
      )}

      {polls && polls.length > 0 ? (
        <div className='polls-list-wrapper'>
          {polls.map(poll => (
            <div key={poll._id?.toString()} className='poll-card'>
              <h3>{poll.question}</h3>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const selectedChoiceIndex = selectedChoices[poll._id?.toString() || ''];

                  if (selectedChoiceIndex !== undefined && selectedChoiceIndex !== null) {
                    handleVote(
                      poll._id?.toString() || '',
                      selectedChoiceIndex,
                      poll.choices.map(choice => ({ text: choice.choice, votes: choice.votes })),
                    );
                  } else {
                    setVoteError('Please select a choice to vote for');
                  }
                }}>
                {poll.choices?.length
                  ? poll.choices.map((choice, index) => (
                      <div key={`${poll._id}-${choice.choice}-${index}`} className='poll-option'>
                        <input
                          type='radio'
                          id={`choice-${poll._id?.toString()}-${index}`}
                          name={`poll-${poll._id?.toString()}`}
                          value={choice.choice}
                          checked={selectedChoices[poll._id?.toString() || ''] === index}
                          onChange={() => handleChoiceChange(poll._id?.toString() || '', index)}
                          disabled={
                            Array.isArray(poll.voters) && poll.voters.includes(currentUser.username)
                          }
                        />
                        <label htmlFor={`choice-${poll._id?.toString()}-${index}`}>
                          {choice.choice} - {choice.votes} votes
                        </label>
                      </div>
                    ))
                  : null}

                <button
                  className='custom-button'
                  type='submit'
                  disabled={
                    Array.isArray(poll.voters) && poll.voters.includes(currentUser.username)
                  }>
                  Submit Vote
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p>No polls available</p>
      )}

      {voteError && <div className='vote-error'>{voteError}</div>}
      {voteSuccess && <div className='vote-success'>{voteSuccess}</div>}
    </div>
  );
};

export default CommunityPolls;
