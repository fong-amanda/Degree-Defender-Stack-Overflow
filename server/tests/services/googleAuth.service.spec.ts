import { OAuth2Client } from 'google-auth-library';
import verifyGoogleToken from '../../services/googleAuth.service';

jest.mock('google-auth-library', () => {
  const mockVerifyIdToken = jest.fn();
  const mockOAuth2Client = jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  }));

  return {
    OAuth2Client: mockOAuth2Client,
  };
});

describe('verifyGoogleToken', () => {
  const mockToken = 'fake-google-id-token';
  const mockPayload = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'http://example.com/pic.jpg',
    email_verified: true,
    // Additional fields that can be found in a google payload
    sub: '123456789',
    iss: 'accounts.google.com',
    aud: 'client-id',
  };

  const mockedClientInstance = new OAuth2Client() as jest.Mocked<OAuth2Client>;
  const mockedVerifyIdToken = mockedClientInstance.verifyIdToken as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user payload when token is valid', async () => {
    // Setup the mock to return a ticket with the expected payload
    mockedVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => mockPayload,
    });

    const result = await verifyGoogleToken(mockToken);

    // Verify the client was called with correct parameters
    expect(mockedVerifyIdToken).toHaveBeenCalledWith({
      idToken: mockToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Verify the result contains expected fields
    expect(result).toEqual({
      email: mockPayload.email,
      name: mockPayload.name,
      picture: mockPayload.picture,
      email_verified: mockPayload.email_verified,
    });
  });

  it('should return undefined fields if payload is missing', async () => {
    // Setup the mock to return a ticket with null payload
    mockedVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => null,
    });

    const result = await verifyGoogleToken(mockToken);

    expect(mockedVerifyIdToken).toHaveBeenCalledWith({
      idToken: mockToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    expect(result).toEqual({
      email: undefined,
      name: undefined,
      picture: undefined,
      email_verified: undefined,
    });
  });

  it('should return partial fields if payload has only some data', async () => {
    // Setup the mock to return a ticket with partial payload
    mockedVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: 'partial@example.com' }),
    });

    const result = await verifyGoogleToken(mockToken);

    expect(result).toEqual({
      email: 'partial@example.com',
      name: undefined,
      picture: undefined,
      email_verified: undefined,
    });
  });

  it('should throw if verifyIdToken fails', async () => {
    // Setup the mock to throw an error
    const errorMessage = 'Invalid token';
    mockedVerifyIdToken.mockRejectedValueOnce(new Error(errorMessage));

    // Test that the function throws
    await expect(verifyGoogleToken(mockToken)).rejects.toThrow(errorMessage);

    expect(mockedVerifyIdToken).toHaveBeenCalledWith({
      idToken: mockToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  });

  it('should throw with correct error message for network issues', async () => {
    // Test specific error types
    mockedVerifyIdToken.mockRejectedValueOnce(new Error('Network Error'));

    await expect(verifyGoogleToken(mockToken)).rejects.toThrow('Network Error');
  });
});
