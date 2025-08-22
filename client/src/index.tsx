import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import FakeStackOverflow from './components/fakestackoverflow';
import { FakeSOSocket } from './types/types';

const container = document.getElementById('root');
const CLIENT_ID = '695585504662-re847o0co8sj6eurrf32i2i2gu0tres1.apps.googleusercontent.com';

const App = () => {
  const [socket, setSocket] = useState<FakeSOSocket | null>(null);

  const serverURL = process.env.REACT_APP_SERVER_URL;

  if (serverURL === undefined) {
    throw new Error("Environment variable 'REACT_APP_SERVER_URL' must be defined");
  }

  useEffect(() => {
    if (!socket) {
      setSocket(io(serverURL));
    }

    return () => {
      if (socket !== null) {
        socket.disconnect();
      }
    };
  }, [socket, serverURL]);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <FakeStackOverflow socket={socket} />
      </Router>
    </GoogleOAuthProvider>
  );
};

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
