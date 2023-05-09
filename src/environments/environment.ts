import { ProviderOptions } from '@ionic-enterprise/auth';

const baseConfig: ProviderOptions = {
  clientId: '64p9c53l5thd5dikra675suvq9',
  discoveryUrl: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_YU8VQe29z/.well-known/openid-configuration',
  scope: 'openid email profile',
  audience: '',
  redirectUri: '',
  logoutUrl: '',
};

const mobileAuthConfig: ProviderOptions = {
  ...baseConfig,
  redirectUri: 'msauth://auth-action-complete',
  logoutUrl: 'msauth://auth-action-complete',
};

const webAuthConfig: ProviderOptions = {
  ...baseConfig,
  redirectUri: 'http://localhost:8100/auth-action-complete',
  logoutUrl: 'http://localhost:8100/auth-action-complete',
};

export const environment = {
  production: false,
  dataService: 'https://cs-demo-api.herokuapp.com',
  mobileAuthConfig,
  webAuthConfig,
};
