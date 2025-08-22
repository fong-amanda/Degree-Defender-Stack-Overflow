import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PopulatedDatabasePoll } from '../types/types';
// import useUserContext from './useUserContext';
import { createPoll, getPollsByCommunityName, voteOnPoll } from '../services/communitygroupService';
import useUserContext from './useUserContext';

const MIN_OPTIONS = 2;

const usePolls = () => {
  const { name } = useParams<{ name: string }>();
  const { user: currentUser } = useUserContext();

  const [polls, setPolls] = useState<PopulatedDatabasePoll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '', '', '']);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChoices, setSelectedChoices] = useState<{ [key: string]: number | null }>({});
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set()); // 🆕 New: track voted polls

  const handleCreatePoll = async (communityName: string, question: string, choices: string[]) => {
    try {
      setError(null);
      setOptionError(null);

      const validChoices = choices.filter(choice => choice.trim() !== '');

      if (!question || validChoices.length < MIN_OPTIONS) {
        setError('Question and at least two options are required');
        return;
      }

      const uniqueChoices = new Set(validChoices.map(choice => choice.trim().toLowerCase()));
      if (uniqueChoices.size !== validChoices.length) {
        setOptionError('Duplicate options are not allowed');
        return;
      }

      const populatedPoll = await createPoll(communityName, question, validChoices);
      setPolls(prevPolls => [...prevPolls, populatedPoll as PopulatedDatabasePoll]);

      setNewPollTitle('');
      setNewPollOptions(['', '', '', '']);
      setShowCreatePanel(false);
    } catch (err) {
      setError('Error creating poll. Please try again.');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newPollOptions];
    updatedOptions[index] = value;

    const nonEmptyOptions = updatedOptions.filter(opt => opt.trim() !== '');
    const uniqueOptions = new Set(nonEmptyOptions.map(opt => opt.trim().toLowerCase()));

    if (uniqueOptions.size !== nonEmptyOptions.length) {
      setOptionError('Duplicate options are not allowed');
    } else {
      setOptionError(null);
    }

    setNewPollOptions(updatedOptions);
  };

  const addOptionField = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const handleVote = async (
    pollId: string,
    choiceIndex: number,
    pollChoices: { text: string; votes: number }[],
  ) => {
    if (choiceIndex < 0 || choiceIndex >= pollChoices.length) {
      setVoteError('Invalid choice selected. Please select a valid choice.');
      return;
    }

    try {
      const updatedPoll = await voteOnPoll(pollId, currentUser.username, choiceIndex);
      if (!name) {
        throw new Error('Community name is required');
      }
      const refreshedPolls = await getPollsByCommunityName(name);
      if (Array.isArray(refreshedPolls)) {
        setPolls(refreshedPolls as PopulatedDatabasePoll[]);
      } else {
        setError('Error fetching polls');
        setPolls([]);
      }
      setPolls(prevPolls =>
        prevPolls.map(poll =>
          poll._id.toString() === pollId
            ? {
                ...poll,
                choices: updatedPoll.choices ?? poll.choices,
                voters: updatedPoll.voters ?? poll.voters,
              }
            : poll,
        ),
      );

      setVoteSuccess('Vote recorded successfully');
      setVoteError(null);
      setVotedPolls(prev => new Set(prev).add(pollId)); // 🆕 Mark this poll as voted
    } catch (err) {
      setVoteError('Error voting on the poll. Please try again.');
      setVoteSuccess(null);
    }
  };

  const handleSubmitVote = (
    pollId: string,
    selectedChoiceIndex: number,
    pollChoices: { text: string; votes: number }[],
  ) => {
    if (selectedChoiceIndex === null || selectedChoiceIndex === undefined) {
      setVoteError('Please select a choice to vote for');
      return;
    }

    if (selectedChoiceIndex < 0 || selectedChoiceIndex >= pollChoices.length) {
      setVoteError('Invalid choice selected. Please select a valid choice.');
      return;
    }

    handleVote(pollId, selectedChoiceIndex, pollChoices);
  };

  const handleChoiceChange = (pollId: string, choiceIndex: number) => {
    setSelectedChoices(prev => ({
      ...prev,
      [pollId]: choiceIndex,
    }));
  };

  useEffect(() => {
    const fetchPolls = async () => {
      setError(null);
      try {
        if (!name) {
          setError('Community name is required');
          return;
        }
        const retrievedPolls = await getPollsByCommunityName(name);
        if (Array.isArray(retrievedPolls)) {
          setPolls(retrievedPolls);
        } else {
          setPolls([]);
          setError('Problem fetching polls');
        }
      } catch (fetchError) {
        setError('Error fetching communities');
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, [name]);

  return {
    polls,
    error,
    optionError,
    setOptionError,
    handleCreatePoll,
    showCreatePanel,
    setShowCreatePanel,
    newPollTitle,
    setNewPollTitle,
    newPollOptions,
    setNewPollOptions,
    handleOptionChange,
    addOptionField,
    loading,
    setLoading,
    selectedChoice,
    setSelectedChoice,
    voteError,
    setVoteError,
    voteSuccess,
    setVoteSuccess,
    handleVote,
    handleSubmitVote,
    handleChoiceChange,
    setSelectedChoices,
    selectedChoices,
    votedPolls,
    setPolls,
    currentUser,
  };
};

export default usePolls;
