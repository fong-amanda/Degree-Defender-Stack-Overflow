import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies the Google ID token and returns the user payload
 */
const verifyGoogleToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  return {
    email: payload?.email,
    name: payload?.name,
    picture: payload?.picture,
    email_verified: payload?.email_verified,
  };
};

export default verifyGoogleToken;
