import React, { useState } from 'react';
import './index.css';
import useProfileSettings from '../../hooks/useProfileSettings';

const ProfileSettings: React.FC = () => {
  const {
    userData,
    loading,
    editBioMode,
    newBio,
    newPassword,
    confirmNewPassword,
    successMessage,
    errorMessage,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    isModerator,
    setEditBioMode,
    setNewBio,
    setNewPassword,
    currentUser,
    setConfirmNewPassword,
    handleUpdateModerator,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
    handlePermanentBan,
  } = useProfileSettings();

  const [isBanned, setIsBanned] = useState(userData?.isBanned || false);

  const totalNotes = (userData?.acceptedNotes || 0) + (userData?.rejectedNotes || 0);
  const userRating =
    totalNotes > 0 ? (((userData?.acceptedNotes || 0) / totalNotes) * 100).toFixed(0) : 0;

  if (loading) {
    return (
      <div className='page-container'>
        <div className='profile-card'>
          <h2>Loading user data...</h2>
        </div>
      </div>
    );
  }

  const canShowPromoteDemoteButton = () => {
    if (Number(userRating) >= 50) {
      return true;
    }

    if (Number(userRating) < 50 && userData?.isModerator) {
      return true;
    }

    return false;
  };

  const handleBanClick = async () => {
    const newBanStatus = !isBanned;

    try {
      await handlePermanentBan();
      setIsBanned(newBanStatus);
    } catch (error) {
      setIsBanned(isBanned);
    }
  };

  return (
    <div className='page-container'>
      <div className='profile-moderator-wrapper'>
        <div className='profile-card'>
          <h2>Profile</h2>
          {successMessage && <p className='success-message'>{successMessage}</p>}
          {errorMessage && <p className='error-message'>{errorMessage}</p>}
          {userData ? (
            <>
              <h4>General Information</h4>
              <p>
                <strong>Username:</strong> {userData.username}
              </p>

              {/* Biography Section */}
              {!editBioMode && (
                <p>
                  <strong>Biography:</strong> {userData.biography || 'No biography yet.'}
                  {canEditProfile && (
                    <button
                      className='login-button'
                      style={{ marginLeft: '1rem' }}
                      onClick={() => {
                        setEditBioMode(true);
                        setNewBio(userData.biography || '');
                      }}>
                      Edit
                    </button>
                  )}
                </p>
              )}

              {editBioMode && canEditProfile && (
                <div style={{ margin: '1rem 0' }}>
                  <input
                    className='input-text'
                    type='text'
                    value={newBio}
                    onChange={e => setNewBio(e.target.value)}
                  />
                  <button
                    className='login-button'
                    style={{ marginLeft: '1rem' }}
                    onClick={handleUpdateBiography}>
                    Save
                  </button>
                  <button
                    className='delete-button'
                    style={{ marginLeft: '1rem' }}
                    onClick={() => setEditBioMode(false)}>
                    Cancel
                  </button>
                </div>
              )}

              <p>
                <strong>Date Joined:</strong>{' '}
                {userData.dateJoined ? new Date(userData.dateJoined).toLocaleDateString() : 'N/A'}
              </p>

              {userData?.isModerator && <strong>MODERATOR</strong>}

              {/* Reset Password Section */}
              {canEditProfile && (
                <>
                  <h4>Reset Password</h4>
                  <input
                    className='input-text'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='New Password'
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <input
                    className='input-text'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Confirm New Password'
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                  />
                  <button className='toggle-password-button' onClick={togglePasswordVisibility}>
                    {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                  </button>
                  <button className='login-button' onClick={handleResetPassword}>
                    Reset
                  </button>
                </>
              )}

              {canEditProfile && (
                <>
                  <h4>Danger Zone</h4>
                  <button className='delete-button' onClick={handleDeleteUser}>
                    Delete This User
                  </button>
                </>
              )}
            </>
          ) : (
            <p>No user data found. Make sure the username parameter is correct.</p>
          )}
        </div>

        {isModerator && (
          <div className='moderator-container'>
            <h2>Moderator View</h2>
            {userData && (
              <div className='moderator-panel'>
                <p>
                  <strong> Current User Info </strong>
                </p>
                <p>
                  Accepted Community Notes: <strong> {userData.acceptedNotes} </strong>
                </p>

                <p>
                  Rejected Community Notes: <strong> {userData.rejectedNotes} </strong>
                </p>

                <p>
                  User Rating: <strong>{userRating}%</strong>
                </p>

                {/* Moderator Danger Zone Section: Only show the "Ban User" button when rating is low */}
                {Number(userRating) < 50 && (
                  <>
                    <h4>Moderator Danger Zone!</h4>
                    <p>This User has a LOW user rating.</p>

                    <button
                      className='mod-button'
                      onClick={handleBanClick}
                      style={{
                        backgroundColor: isBanned ? 'grey' : '',
                        cursor: 'pointer',
                      }}>
                      {userData.isBanned ? 'Unban User' : 'Ban User Permanently'}
                    </button>
                  </>
                )}

                {/* Promote/Demote This User Section: Only show when appropriate */}
                {canShowPromoteDemoteButton() &&
                  currentUser?.isModerator &&
                  userData.username !== currentUser.username && (
                    <>
                      <p>Promote/Demote This User:</p>

                      <button className='mod-button' onClick={handleUpdateModerator}>
                        {userData.isModerator
                          ? 'Demote User from Moderator'
                          : 'Promote User to Moderator'}
                      </button>
                    </>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
