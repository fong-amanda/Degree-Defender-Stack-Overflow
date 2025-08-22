import useAllCommunitiesPage from '../../../hooks/useAllCommunity';

import './index.css';

/**
 * The CommunitiesPage component displays a list of communities and allows users to create a new community.
 * @returns CommunitiesPage component
 */
const CommunitiesPage = () => {
  const {
    availableCommunities,
    handleJoinClick,
    handleSubmitPassword,
    showPasswordModal,
    setShowPasswordModal,
    selectedCommunity,
    setSelectedCommunity,
    password,
    setPassword,
    communityName,
    setCommunityName,
    communityDescription,
    setCommunityDescription,
    isPrivate,
    setIsPrivate,
    handleCreateCommunityModal,
    showCreateCommunityModal,
    setShowCreateCommunityModal,
    leaderboardEnabled,
    setLeaderboardEnabled,
    pollsEnabled,
    setPollsEnabled,
    communityError,
    // communityBlacklist,
    currentUser,
  } = useAllCommunitiesPage();

  const handleCancelPrivateCommunity = () => {
    setShowPasswordModal(false);
    setPassword('');
    setSelectedCommunity(null);
  };

  return (
    <div className='communities-page'>
      <div className='community-sidebar'>
        <div className='communities-header'>
          <h3 className='communities-page-title'>Communities</h3>
          <button onClick={() => setShowCreateCommunityModal(true)} className='standard-button'>
            Create Community
          </button>
        </div>
        <ul>
          {communityError && <p className='err-message'>{communityError}</p>}
          {availableCommunities.map(community => (
            <li className='community-item' key={community.name}>
              <div className='community-header'>
                <h3 className='community-title'>{community.name}</h3>
                <h3 className='community-privacy'>{community.isPrivate ? 'Private' : 'Public'}</h3>
              </div>
              <p>{community.description}</p>
              {!community.blacklist?.find(member => member === currentUser.username) && (
                <button
                  className='standard-button-join-var'
                  onClick={() => handleJoinClick(community)}>
                  Join
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showCreateCommunityModal && (
        <div className='create-community-modal'>
          <div className='modal-content'>
            <h3 className='create-panel-title'>Create a New Community</h3>
            <input
              className='title-field'
              type='text'
              placeholder='Community Name'
              value={communityName}
              onChange={e => setCommunityName(e.target.value)}
            />
            <textarea
              className='description-field'
              placeholder='Community Description'
              value={communityDescription}
              onChange={e => setCommunityDescription(e.target.value)}
            />
            <div className='row'>
              <p className='text-beside-btn'>Enable Polls: </p>
              <button className='polls-toggle-btn' onClick={() => setPollsEnabled(prev => !prev)}>
                {pollsEnabled ? 'True' : 'False'}
              </button>
            </div>
            <div className='row'>
              <p className='text-beside-btn'>Show Leaderboard: </p>
              <button
                className='leaderboard-toggle-btn'
                onClick={() => setLeaderboardEnabled(prev => !prev)}>
                {leaderboardEnabled ? 'True' : 'False'}
              </button>
            </div>
            <div className='row'>
              <p className='text-beside-btn'>Privacy: </p>
              <button className='privacy-toggle-btn' onClick={() => setIsPrivate(prev => !prev)}>
                {isPrivate ? 'Private' : 'Public'}
              </button>
            </div>
            {isPrivate && (
              <input
                className='password-field'
                type='text'
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            )}
            <p className='err-message'>{communityError}</p>

            <div className='button-wrapper'>
              <button className='create-comm-btn' onClick={handleCreateCommunityModal}>
                Create
              </button>
              <button
                className='cancel-comm-btn'
                onClick={() => setShowCreateCommunityModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className='password-modal'>
          <div className='modal-content'>
            <h3>Enter Password for &quot;{selectedCommunity}&quot;</h3>
            <input
              type='password'
              placeholder='Enter password'
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <p className='err-message'>{communityError}</p>
            <div className='button-wrapper'>
              <button className='join-comm-btn' onClick={handleSubmitPassword}>
                Join
              </button>
              <button className='cancel-comm-btn' onClick={handleCancelPrivateCommunity}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
