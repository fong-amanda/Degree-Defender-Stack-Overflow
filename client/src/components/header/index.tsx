import { useNavigate } from 'react-router-dom';
import useHeader from '../../hooks/useHeader';
import './index.css';
import useUserContext from '../../hooks/useUserContext';

/**
 * Header component that renders the main title and a search bar.
 * The search bar allows the user to input a query and navigate to the search results page
 * when they press Enter.
 */
const Header = () => {
  const { val, handleInputChange, handleKeyDown, handleSignOut } = useHeader();
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/home');
  };

  return (
    <div className='header'>
      <div></div>
      <div className='title' onClick={goHome}>
        Degree Defender
      </div>
      <input
        className='search-bar'
        id='searchBar'
        placeholder='Search...'
        type='text'
        value={val}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />

      <div className='user-dropdown-container'>
        <button className='user-dropdown-button'> {currentUser.username} </button>
        <div className='dropdown'>
          <button
            className='dropdown-option'
            onClick={() => navigate(`/user/${currentUser.username}`)}>
            View Profile
          </button>
          <button onClick={handleSignOut} className='dropdown-option'>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
