import React, { useEffect } from 'react';
import './index.css';

interface RequestCommunityJoinModalProps {
  communityName: string;
  onClose: () => void;
  onRequestJoin: () => void;
}

const RequestCommunityJoinModal: React.FC<RequestCommunityJoinModalProps> = ({
  onClose,
  onRequestJoin,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSubmit = () => {
    onRequestJoin(); // sims successfully joining the community
    onClose(); // close the modal
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={e => e.stopPropagation()}>
        <h3>This is a private community. Please enter the password to join:</h3>

        <textarea id='note-text' placeholder='Password (required)' onChange={e => {}} />
        {/* {error && <p className='error-text'>{error}</p>} */}
        <div className='form-buttons'>
          <button className='bluebtn' onClick={handleSubmit}>
            Join
          </button>
          <button className='cancelbtn' onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestCommunityJoinModal;
