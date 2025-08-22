import { Request } from 'express';

/**
 * For requests coming from Google SSO frontend login/signup
 */
export interface SSORequest extends Request {
  body: {
    token: string;
  };
}
