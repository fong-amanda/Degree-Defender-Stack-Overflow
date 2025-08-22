import './index.css';
import { DatabaseCommunityNote } from '@fake-stack-overflow/shared';
// import { useNavigate } from 'react-router-dom';
import useDashboardPage from '../../../hooks/useDashboardPage';
import CommunityNoteCard from './communityNoteCard';

/**
 * Interface representing the props for the CommunityNoteListProps component.
 * handleUserSelect - The function to handle the click event on the user card.
 */
interface CommunityNoteListProps {
  handleNoteSelect?: (communityNote: DatabaseCommunityNote) => void;
}

/**
 * Represents the MessagingPage component which displays the public chat room.
 * and provides functionality to send and receive messages.
 */
const DashboardPage = (props: CommunityNoteListProps) => {
  const { titleText, notesList } = useDashboardPage();
  // const { handleNoteSelect = null } = props;
  // const navigate = useNavigate();

  // const handleNoteCardViewClickHandler = (communityNote: DatabaseCommunityNote): void => {
  //   if (handleNoteSelect) {
  //     handleNoteSelect(communityNote);
  //   } else if (communityNote._id) {
  //     navigate(`/${communityNote._id}`);
  //   }
  // };

  return (
    <div className='dashboard-page'>
      <div className='dashboard-header'>
        <h2>{titleText}</h2>
      </div>
      <div id='dashboard_list' className='dashboard_list'>
        {notesList.map(note => (
          <CommunityNoteCard
            communityNote={note}
            key={note.question}
            // handleNoteCardViewClickHandler={handleNoteCardViewClickHandler}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
