import React from 'react';
// import Form from '../../baseComponents/form';
import useCommunitySettings from '../../../../hooks/useCommunitySettings';
// import Input from '../../baseComponents/input';
// import TextArea from '../../baseComponents/textarea';
import './index.css';

/**
 * NewQuestionPage component allows users to submit a new question with a title,
 * description, tags, and username.
 */
const CommunitySettingsPage = () => {
  const {
    editNameMode,
    setEditNameMode,
    newName,
    setNewName,
    newDescription,
    setNewDescription,
    editDescriptionMode,
    setEditDescriptionMode,
    handleUpdatePasswordVisibility,
    communityData,
    canEditCommunity,
    handleBanMember,
  } = useCommunitySettings();

  return (
    <>
      <div className='page-container'>
        <div className='community-card'>
          <h2>Community Settings</h2>
          {!editNameMode && (
            <p>
              <strong>Community Name:</strong> {communityData?.name || 'No name yet.'}
              {/* {canEditCommunity && (
                <button
                  className='login-button'
                  style={{ marginLeft: '1rem' }}
                  onClick={() => {
                    setEditNameMode(true);
                    setNewName(communityData?.name || '');
                  }}>
                  Edit
                </button>
              )} */}
            </p>
          )}
          {editNameMode && canEditCommunity && (
            <div style={{ margin: '1rem 0' }}>
              <input
                className='input-text'
                type='text'
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              {/* <button
                className='login-button'
                style={{ marginLeft: '1rem' }}
                onClick={handleUpdateName}>
                Save
              </button> */}
              <button
                className='delete-button'
                style={{ marginLeft: '1rem' }}
                onClick={() => setEditNameMode(false)}>
                Cancel
              </button>
            </div>
          )}
          {!editDescriptionMode && (
            <p>
              <strong>Description:</strong> {communityData?.description || 'No description yet.'}
              {/* {canEditCommunity && (
                <button
                  className='login-button'
                  style={{ marginLeft: '1rem' }}
                  onClick={() => {
                    setEditDescriptionMode(true);
                    setNewDescription(communityData?.description || '');
                  }}>
                  Edit
                </button>
              )} */}
            </p>
          )}
          {editDescriptionMode && canEditCommunity && (
            <div style={{ margin: '1rem 0' }}>
              <input
                className='input-text'
                type='text'
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
              {/* <button
                className='login-button'
                style={{ marginLeft: '1rem' }}
                onClick={handleUpdateDescription}>
                Save
              </button> */}
              <button
                className='delete-button'
                style={{ marginLeft: '1rem' }}
                onClick={() => setEditDescriptionMode(false)}>
                Cancel
              </button>
            </div>
          )}
          {/* {communityData?.isPrivate && <p>Private Community</p>}
          {!communityData?.isPrivate && <p>Public Community</p>} */}
          {/* <button className='login-button'>Update Privacy</button> */}
          {
            // {canEditCommunity && (
            // <>
            //   <h4>Reset Password</h4>
            //   <input
            //     className='input-text'
            //     type={showPassword ? 'text' : 'password'}
            //     placeholder='New Password'
            //     value={newPassword}
            //     onChange={e => setNewPassword(e.target.value)}
            //   />
            //   <input
            //     className='input-text'
            //     type={showPassword ? 'text' : 'password'}
            //     placeholder='Confirm New Password'
            //     value={confirmNewPassword}
            //     onChange={e => setConfirmNewPassword(e.target.value)}
            //   />
            //   <button className='toggle-password-button' onClick={togglePasswordVisibility}>
            //     {showPassword ? 'Hide Passwords' : 'Show Passwords'}
            //   </button>
            //   {/* <button className='login-button' onClick={handleResetPassword}>
            //     Reset
            //   </button> */}
            // </>)}
          }
          {communityData?.isPrivate && canEditCommunity && (
            <p>
              <strong>Show password to community members:</strong>
              <button
                className='login-button'
                style={{ marginLeft: '1rem' }}
                onClick={handleUpdatePasswordVisibility}>
                {communityData.showPassword ? 'Disable' : 'Enable'}
                {/* TODO: change condition to "if password sharing enabled" */}
              </button>
            </p>
          )}
          {communityData?.showPassword && (
            <p>
              <strong>Password:</strong> {communityData?.password || 'Error: no password.'}
            </p>
          )}
          <p>
            <strong>Admin:</strong> {communityData?.admin || 'No admin yet.'}
          </p>
          {communityData?.members && (
            <div>
              <h3>Community Members</h3>
              <ul>
                {communityData.members.map((member, index) => (
                  <li key={index}>
                    <p>
                      <strong>{member}</strong>
                      {canEditCommunity && member !== communityData.admin && (
                        <button
                          className='login-button'
                          style={{ marginLeft: '1rem' }}
                          onClick={() => handleBanMember(member)}>
                          Ban
                        </button>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* <div>
            <button className='delete-button'>Delete Community</button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default CommunitySettingsPage;
