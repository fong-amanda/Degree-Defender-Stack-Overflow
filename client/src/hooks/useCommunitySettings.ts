import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import { validateHyperlink } from '../tool';
import useUserContext from './useUserContext';
import { CommunityDetails } from '../types/types';
import {
  banMemberFromCommunity,
  getCommunityByName,
  updatePasswordVisibility,
  // resetPassword,
  // updateDescription,
  // updateName,
} from '../services/communitygroupService';

/**
 * Custom hook to handle editing community settings
 *
 * @returns communityName - The current value of the community name input.
 * @returns description - The current value of the description input.
 * @returns titleErr - Error message for the title field, if any.
 * @returns textErr - Error message for the text field, if any.
 * @returns postQuestion - Function to validate the form and submit a new question.
 */

const useCommunitySettings = () => {
  const { name } = useParams<{ name: string }>();
  // const navigate = useNavigate();
  const { user: currentUser } = useUserContext();

  // Local state
  const [communityData, setCommunityData] = useState<CommunityDetails | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPrivacy, setNewPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editNameMode, setEditNameMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [editDescriptionMode, setEditDescriptionMode] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const canEditCommunity =
    currentUser.username && communityData?.admin
      ? currentUser.username === communityData.admin
      : false;
  //   currentUser.username && userData?.username ? currentUser.username === userData.username : false;

  const [communityName, setCommunityName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  // const [tagNames, setTagNames] = useState<string>('');

  const [communityNameErr, setCommunityNameErr] = useState<string>('');
  const [descriptionErr, setDescriptionErr] = useState<string>('');
  // const [tagErr, setTagErr] = useState<string>('');

  useEffect(() => {
    if (!name) return;

    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        const data = await getCommunityByName(name);
        // console.log('Community data:', data);
        if (!('error' in data)) {
          setCommunityData(data);
        } else {
          setErrorMessage(data.error);
        }
      } catch (error) {
        setErrorMessage('Error fetching user profile');
        setCommunityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [name]);

  // /**
  //  * Validate the password fields before attempting to reset.
  //  */
  // const validatePasswords = () => {
  //   if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
  //     setErrorMessage('Please enter and confirm your new password.');
  //     return false;
  //   }
  //   if (newPassword !== confirmNewPassword) {
  //     setErrorMessage('Passwords do not match.');
  //     return false;
  //   }
  //   return true;
  // };

  /**
   * Handler for resetting the password
   */
  // const handleResetPassword = async () => {
  //   if (!name) return;
  //   if (!validatePasswords()) {
  //     return;
  //   }
  //   try {
  //     await resetPassword(name, newPassword);
  //     setSuccessMessage('Password reset successful!');
  //     setErrorMessage(null);
  //     setNewPassword('');
  //     setConfirmNewPassword('');
  //   } catch (error) {
  //     setErrorMessage('Failed to reset password.');
  //     setSuccessMessage(null);
  //   }
  // };

  // const handleUpdateDescription = async () => {
  //   if (!name) return;
  //   try {
  //     // Await the async call to update the description
  //     const updatedCommunity = await updateDescription(name, newDescription);

  //     // Ensure state updates occur sequentially after the API call completes
  //     if (!('error' in updatedCommunity)) {
  //       await new Promise(resolve => {
  //         setCommunityData(updatedCommunity); // Update the community data
  //         setEditDescriptionMode(false); // Exit edit mode
  //         resolve(null); // Resolve the promise
  //       });
  //     } else {
  //       setErrorMessage(updatedCommunity.error);
  //     }

  //     setSuccessMessage('Description updated!');
  //     setErrorMessage(null);
  //   } catch (error) {
  //     setErrorMessage('Failed to update description.');
  //     setSuccessMessage(null);
  //   }
  // };

  // const handleUpdateName = async () => {
  //   if (!name) return;
  //   try {
  //     // Await the async call to update the biography
  //     const updatedCommunity = await updateName(name, newName);

  //     // Ensure state updates occur sequentially after the API call completes
  //     if (!('error' in updatedCommunity)) {
  //       await new Promise(resolve => {
  //         setCommunityData(updatedCommunity); // Update the user data
  //         setEditNameMode(false); // Exit edit mode
  //         resolve(null); // Resolve the promise
  //       });
  //     } else {
  //       setErrorMessage(updatedCommunity.error);
  //     }

  //     setSuccessMessage('Community name updated!');
  //     setErrorMessage(null);
  //   } catch (error) {
  //     setErrorMessage('Failed to update community name.');
  //     setSuccessMessage(null);
  //   }
  // };

  /**
   * Toggles the visibility of the password fields.
   */
  const handleUpdatePasswordVisibility = async () => {
    if (!name) return;
    if (!communityData) return;
    try {
      const updatedCommunity = await updatePasswordVisibility(name, !communityData.showPassword);
      if (!('error' in updatedCommunity)) {
        await new Promise(resolve => {
          setCommunityData(updatedCommunity); // Update the community data
          resolve(null); // Resolve the promise
        });
      } else {
        setErrorMessage(updatedCommunity.error);
      }
      setSuccessMessage('Password visibility updated!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to toggle password visibility.');
      setSuccessMessage(null);
    }
  };

  const handleBanMember = async (username: string) => {
    if (!name) return;
    try {
      // Await the async call to ban the user
      // console.log('Banning user:', username);
      const updatedCommunity = await banMemberFromCommunity(name, username);
      // console.log('Updated community:', updatedCommunity);
      if (!('error' in updatedCommunity)) {
        await new Promise(resolve => {
          setCommunityData(updatedCommunity);
          resolve(null);
        });
      } else {
        setErrorMessage(updatedCommunity.error);
      }
      setSuccessMessage('User banned!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to ban user.');
      setSuccessMessage(null);
    }
  };

  return {
    communityName,
    setCommunityName,
    description,
    setDescription,
    communityData,
    currentUser,
    newName,
    setNewName,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    loading,
    editNameMode,
    setEditNameMode,
    newDescription,
    setNewDescription,
    editDescriptionMode,
    setEditDescriptionMode,
    newPrivacy,
    setNewPrivacy,
    communityNameErr,
    setCommunityNameErr,
    descriptionErr,
    setDescriptionErr,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    handleUpdatePasswordVisibility,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    canEditCommunity,
    handleBanMember,
    // handleResetPassword,
    // handleUpdateDescription,
    // handleUpdateName,
  };
};

export default useCommunitySettings;
