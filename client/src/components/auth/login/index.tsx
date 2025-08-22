import React from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../../../hooks/useAuth';

/**
 * Renders a login form with username and password inputs, password visibility toggle,
 * error handling, and a link to the signup page.
 * Also includes a Google login button.
 */
const Login = () => {
  const {
    username,
    password,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
    handleGoogleLogin,
  } = useAuth('login');

  return (
    <div className='login-container'>
      <h2>Welcome to Degree Defender!</h2>
      <h3>Please login to continue.</h3>

      {/* Regular Login Form */}
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

      {/* Google Login Button */}
      <div className='google-login-button'>
        <h4 style={{ textAlign: 'center' }}> Or log in with Google: </h4>
        <div className='google-button-wrapper'>
          <GoogleLogin
            onSuccess={credentialResponse => {
              const token = credentialResponse.credential;
              if (token) handleGoogleLogin(token);
            }}
            theme='outline'
            size='large'
            text='signin_with'
          />
        </div>
      </div>

      <Link to='/signup' className='signup-link'>
        Don&apos;t have an account? Sign up here.
      </Link>
    </div>
  );
};

export default Login;
