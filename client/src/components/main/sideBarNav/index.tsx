import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './index.css';
import useProfileSettings from '../../../hooks/useProfileSettings';

/**
 * The SideBarNav component has seven menu items: "Questions", "Tags", "Dashboard", "Community", "Messaging", "Users", and "Games".
 * It highlights the currently selected item based on the active page and
 * triggers corresponding functions when the menu items are clicked.
 */
const SideBarNav = () => {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const location = useLocation();
  const { isModerator } = useProfileSettings();

  const toggleOptions = () => setShowOptions(!showOptions);

  const isActiveOption = (path: string) =>
    location.pathname === path ? 'message-option-selected ' : '';

  return (
    <div className='sideBarNav'>
      {/* SECTION 1: MAIN NAVIGATION */}
      <div className='menu_section'>
        <div className='menu_title'>Navigation</div>
        <NavLink
          to='/home'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Questions
        </NavLink>
        <NavLink
          to='/tags'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Tags
        </NavLink>
        {isModerator && (
          <NavLink
            to='/dashboard'
            className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
            Dashboard
          </NavLink>
        )}
      </div>

      {/* SECTION 2: COMMUNITY */}
      <div className='menu_section'>
        <div className='menu_title'>Community</div>
        <NavLink
          to='/communities'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Communities
        </NavLink>
        <NavLink
          to='/users'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Users
        </NavLink>
      </div>

      {/* SECTION 3: MESSAGING */}
      <div className='menu_section'>
        <div className='menu_title'>Messaging</div>
        <NavLink
          to='/messaging'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}
          onClick={toggleOptions}>
          Messaging
        </NavLink>
        {showOptions && (
          <div className='additional-options'>
            <NavLink
              to='/messaging'
              className={`menu_button message-options ${isActiveOption('/messaging')}`}>
              Global
            </NavLink>
            <NavLink
              to='/messaging/direct-message'
              className={`menu_button message-options ${isActiveOption('/messaging/direct-message')}`}>
              Direct
            </NavLink>
          </div>
        )}
      </div>

      {/* SECTION 4: EXTRAS */}
      <div className='menu_section'>
        <div className='menu_title'>Extras</div>
        <NavLink
          to='/games'
          className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
          Games
        </NavLink>
      </div>
    </div>
  );
};

export default SideBarNav;
