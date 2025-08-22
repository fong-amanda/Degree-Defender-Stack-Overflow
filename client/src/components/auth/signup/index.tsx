import React from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../../../hooks/useAuth';

/**
 * Renders a signup form with username, password, and password confirmation inputs,
 * password visibility toggle, error handling, and a link to the login page.
 * Also includes a Google login button for signing up with Google.
 */
const Signup = () => {
  const {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
    handleGoogleSignup,
  } = useAuth('signup');

  return (
    <div className='container'>
      <h2>Sign up for Degree Defender!</h2>
      <form onSubmit={handleSubmit}>
        <h4>Please enter your username.</h4>
        <input
          type='text'
          value={username}
          onChange={event => handleInputChange(event, 'username')}
          placeholder='Enter your username'
          required
          className='input-text'
          id='username-input'
        />
        <h4>Please enter your password.</h4>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={event => handleInputChange(event, 'password')}
          placeholder='Enter your password'
          required
          className='input-text'
          id='password-input'
        />
        <input
          type={showPassword ? 'text' : 'password'}
          value={passwordConfirmation}
          onChange={e => handleInputChange(e, 'confirmPassword')}
          placeholder='Confirm your password'
          required
          className='input-text'
        />
        <div className='show-password'>
          <input
            type='checkbox'
            id='showPasswordToggle'
            checked={showPassword}
            onChange={togglePasswordVisibility}
          />
          <label htmlFor='showPasswordToggle'>Show Password</label>
        </div>
        <button type='submit' className='standard-btn'>
          Submit
        </button>
      </form>

      {err && <p className='error-message'>{err}</p>}

      <div className='google-login-button'>
        <h4>Or sign up with Google:</h4>
        <div className='google-button-wrapper'>
          <GoogleLogin
            onSuccess={credentialResponse => {
              const token = credentialResponse.credential;
              if (token) handleGoogleSignup(token);
            }}
            size='large'
            theme='outline'
            text='signup_with'
          />
        </div>
      </div>

      <Link to='/' className='login-link'>
        Have an account? Login here.
      </Link>
    </div>
  );
};

export default Signup;
