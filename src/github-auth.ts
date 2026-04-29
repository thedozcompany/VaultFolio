import { requestUrl } from 'obsidian';

export const GITHUB_CLIENT_ID = 'Ov23liNeQynCCQUQ8G7e';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token?: string;
  error?: string;
  interval?: number;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  try {
    const response = await requestUrl({
      url: 'https://github.com/login/device/code',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'repo' }),
    });
    return response.json as DeviceCodeResponse;
  } catch {
    throw new Error('Failed to get device code from GitHub');
  }
}

export async function pollForToken(
  deviceCode: string,
  interval: number,
  onStatusUpdate: (status: string) => void,
  signal: { cancelled: boolean }
): Promise<string> {
  return new Promise((resolve, reject) => {
    let currentInterval = interval * 1000;
    let attempts = 0;
    const maxAttempts = 180;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (signal.cancelled) {
        reject(new Error('cancelled'));
        return;
      }
      if (attempts >= maxAttempts) {
        reject(new Error('Authorization timed out'));
        return;
      }
      attempts++;

      try {
        const response = await requestUrl({
          url: 'https://github.com/login/oauth/access_token',
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });

        if (signal.cancelled) {
          reject(new Error('cancelled'));
          return;
        }

        const data = response.json as TokenResponse;

        if (data.access_token) {
          resolve(data.access_token);
          return;
        }

        if (data.error === 'slow_down' && data.interval) {
          currentInterval = data.interval * 1000;
          onStatusUpdate('Waiting for authorization...');
        } else if (data.error === 'authorization_pending') {
          onStatusUpdate('Waiting for authorization...');
        } else if (data.error === 'expired_token') {
          reject(new Error('Authorization code expired. Please try again.'));
          return;
        } else if (data.error === 'access_denied') {
          reject(new Error('Authorization was denied.'));
          return;
        }

        timeoutId = setTimeout(poll, currentInterval);
      } catch {
        if (signal.cancelled) {
          reject(new Error('cancelled'));
          return;
        }
        onStatusUpdate('Retrying...');
        timeoutId = setTimeout(poll, currentInterval);
      }
    };

    timeoutId = setTimeout(poll, currentInterval);
  });
}

export async function getGitHubUsername(token: string): Promise<string> {
  try {
    const response = await requestUrl({
      url: 'https://api.github.com/user',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return (response.json.login as string) ?? '';
  } catch {
    return '';
  }
}
