import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CommunitySettingsProps {
  name?: string; // Ensure this matches the usage
}

/**
 * AskQuestionButton component that renders a button for navigating to the
 * "New Question" page. When clicked, it redirects the user to the page
 * where they can ask a new question.
 */
const CommunitySettingsButton = ({ name }: CommunitySettingsProps) => {
  const navigate = useNavigate();

  /**
   * Function to handle navigation to the "New Question" page.
   */
  const handleNavigateToSettings = () => {
    if (name) {
      // navigate(`/${name}/settings`);
      navigate(`/settings/${name}`);
    }
    // } else {
    //   navigate(`/settings`);
    // }
  };

  return (
    <button
      className='custom-button'
      onClick={() => {
        handleNavigateToSettings();
      }}>
      Community Settings
    </button>
  );
};

export default CommunitySettingsButton;
