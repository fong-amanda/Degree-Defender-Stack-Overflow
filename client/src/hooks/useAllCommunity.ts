import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createCommunity,
  getCommunities,
  getCommunityByName,
  addMemberToCommunity,
} from '../services/communitygroupService';
import { Community, SafeDatabaseUser } from '../types/types';
import useUserContext from './useUserContext';

type CommunityResult = Community | { error: string };

/**
 * Custom hook to manage the state and logic for the "All Communities" page,
 * including fetching communities, creating a new community, and joining
 * communities.
 */
const useAllCommunitiesPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUserContext();

  const [availableCommunities, setAvailableCommunities] = useState<Community[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [communityMembers] = useState<SafeDatabaseUser[]>([]);
  const [pollsEnabled, setPollsEnabled] = useState(true);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [communityAdmin] = useState<SafeDatabaseUser>();
  const [showPassword, setShowPassword] = useState(false);
  // const [communityBlacklist, setCommunityBlacklist] = useState<SafeDatabaseUser[]>([]);

  /**
   * Fetches the list of communities from the server.
   */
  const fetchCommunities = useCallback(async () => {
    try {
      const communities = await getCommunities();
      if (Array.isArray(communities) && communities.every(c => 'name' in c && 'description' in c)) {
        setAvailableCommunities(communities as Community[]);
      } else {
        setCommunityError('Invalid community data received');
      }
    } catch (getCommunitiesError) {
      setCommunityError('Error fetching communities');
    }
  }, []);

  /**
   * Creates a new community and adds the user creating it as a member.
   */
  const handleCreateCommunity = useCallback(
    async (community: Community) => {
      try {
        const newCommunity = {
          ...community,
          members: [currentUser],
          admin: currentUser.username,
          password,
          pollsEnabled,
          leaderboardEnabled,
          showPassword: false,
          blacklist: [],
        };

        await createCommunity(newCommunity);
        setAvailableCommunities(prev => [...prev, newCommunity]);
        // console.log('new community with password:', newCommunity.password);
      } catch (createCommunityError) {
        setCommunityError('Error when creating community');
      }
    },
    [currentUser, password, pollsEnabled, leaderboardEnabled],
  );

  /**
   * Handles a member joining a public community.
   */
  const handleJoin = useCallback(
    async (targetCommunityName: string) => {
      try {
        if (!currentUser) {
          setCommunityError('Please log in');
          return;
        }
        // const community: CommunityResult = await getCommunityByName(targetCommunityName);
        // if ('error' in community) {
        //   setCommunityError('Invalid community');
        //   return;
        // }
        // console.log('community:', community);
        // if (community.blacklist.find(member => member.username === currentUser.username)) {
        //   setCommunityError('You are blacklisted from this community');
        //   return;
        // }

        if (!communityMembers.find(member => member.username === currentUser.username)) {
          const response = await addMemberToCommunity(targetCommunityName, currentUser.username);
          if (!response) {
            setCommunityError('Failed to join community');
          }
        }

        navigate(`/communities/${targetCommunityName}`);
      } catch (joinCommunityError) {
        setCommunityError('Error joining community');
      }
    },
    [communityMembers, currentUser, navigate],
  );

  /**
   * Handles a member joining a private community.
   */
  const handleJoinPrivateCommunity = useCallback(
    async (privateCommunityName: string) => {
      try {
        if (!currentUser) {
          setCommunityError('Please log in');
          return;
        }

        const community: CommunityResult = await getCommunityByName(privateCommunityName);
        if (
          !('error' in community) &&
          community.blacklist.find(member => member.username === currentUser.username)
        ) {
          setCommunityError('You are blacklisted from this community');
          return;
        }
        if (!('error' in community)) {
          if (community.password !== password) {
            setCommunityError('Incorrect password');
            return;
          }
        } else {
          setCommunityError('Invalid community');
          return;
        }
        if (!communityMembers.find(member => member.username === currentUser.username)) {
          const response = await addMemberToCommunity(privateCommunityName, currentUser.username);
          if (!response) {
            setCommunityError('Failed to join community');
          }
        }
        navigate(`/communities/${privateCommunityName}`);
      } catch (joinPrivateCommunityError) {
        setCommunityError('Error joining private community');
      }
    },
    [communityMembers, currentUser, navigate, password],
  );

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleToggleModal = useCallback(() => {
    setIsModalOpen(prevState => !prevState);
  }, []);

  const handleSelectCommunityType = useCallback(
    (community: Community) => {
      handleCreateCommunity(community);
      handleToggleModal();
    },
    [handleCreateCommunity, handleToggleModal],
  );

  const handleJoinClick = useCallback(
    (community: { name: string; isPrivate: boolean }) => {
      setCommunityError(null);
      // if (communityBlacklist.find(member => member.username === currentUser.username)) {
      //   setCommunityError('You are blacklisted from this community');
      //   return;
      // }
      if (community.isPrivate) {
        setSelectedCommunity(community.name);
        setShowPasswordModal(prevState => true);
        setCommunityError(null);
      } else {
        handleJoin(community.name);
      }
    },
    [handleJoin],
  );

  const handleSubmitPassword = useCallback(() => {
    if (selectedCommunity) {
      handleJoinPrivateCommunity(selectedCommunity);
      if (!communityError) {
        setShowPasswordModal(false);
        setPassword('');
        setSelectedCommunity(null);
      }
    }
  }, [handleJoinPrivateCommunity, selectedCommunity, communityError]);

  const handleCreateCommunityModal = useCallback(async () => {
    setCommunityError(null);

    if (!communityName || !communityDescription) {
      setCommunityError('Both a community name and a community description are required');
      return;
    }

    if (availableCommunities.find(community => community.name === communityName)) {
      setCommunityError('Community name already exists');
      return;
    }

    if (isPrivate && (!password || password.length < 6)) {
      setCommunityError('Password must be at least 6 characters long');
      return;
    }

    if (!currentUser) {
      setCommunityError('Please Log In!');
      return;
    }

    const newCommunity = {
      name: communityName,
      description: communityDescription,
      isPrivate,
      members: [currentUser],
      password,
      admin: currentUser.username,
      pollsEnabled,
      leaderboardEnabled,
      showPassword,
      blacklist: [],
    };

    // Call the correct function from the custom hook
    try {
      await handleCreateCommunity(newCommunity);
      setShowCreateCommunityModal(false);
      setCommunityName('');
      setCommunityDescription('');
      setIsPrivate(false);
      // setCommunityAdmin(undefined);
      setCommunityError('');
      setPollsEnabled(true);
      setLeaderboardEnabled(true);
    } catch (err) {
      setCommunityError('Error creating community');
    }
  }, [
    communityName,
    communityDescription,
    availableCommunities,
    isPrivate,
    password,
    currentUser,
    pollsEnabled,
    leaderboardEnabled,
    showPassword,
    // communityBlacklist,
    handleCreateCommunity,
  ]);

  return {
    availableCommunities,
    handleJoin,
    handleJoinPrivateCommunity,
    // fetchCommunities,
    isModalOpen,
    handleToggleModal,
    handleSelectCommunityType,
    handleCreateCommunity,
    communityError,
    currentUser,
    handleJoinClick,
    setShowCreateCommunityModal,
    handleSubmitPassword,
    handleCreateCommunityModal,
    showPasswordModal,
    setShowPasswordModal,
    selectedCommunity,
    setSelectedCommunity,
    password,
    setPassword,
    showCreateCommunityModal,
    communityName,
    setCommunityName,
    communityDescription,
    setCommunityDescription,
    isPrivate,
    setIsPrivate,
    pollsEnabled,
    setPollsEnabled,
    leaderboardEnabled,
    setLeaderboardEnabled,
    communityAdmin,
    showPassword,
    setShowPassword,
    // communityBlacklist,
    // setCommunityBlacklist,
  };
};

export default useAllCommunitiesPage;
