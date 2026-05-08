import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadGoogleCredentials() {
  let clientId = process.env.GMAIL_CLIENT_ID;
  let clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (clientId && clientSecret) return { clientId, clientSecret };

  const credPaths = [
    path.join(__dirname, '..', 'credentials', 'google_oauth.json'),
    path.join(__dirname, '..', 'google_oauth.json'),
  ];

  for (const p of credPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const creds = raw.web || raw.installed || raw;
        if (creds.client_id && creds.client_secret) {
          return { clientId: creds.client_id, clientSecret: creds.client_secret };
        }
      } catch (_) { /* ignore parse errors */ }
    }
  }

  return { clientId: null, clientSecret: null };
}

const router = Router();

router.get('/connect/:userId', (req, res) => {
  const { clientId } = loadGoogleCredentials();

  if (!clientId) {
    return res.json({
      status: 'not_configured',
      message: 'Gmail integration requires Google OAuth2 credentials. Place your google_oauth.json file in server/credentials/ or set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.',
      setupInstructions: {
        step1: 'Go to https://console.cloud.google.com/apis/credentials',
        step2: 'Create a new OAuth 2.0 Client ID',
        step3: 'Set authorized redirect URI to http://localhost:5000/api/gmail/callback',
        step4: 'Download the JSON credentials and place in server/credentials/google_oauth.json',
        step5: 'Enable Gmail API in Google Cloud Console',
        note: 'This is completely free with a Google account'
      }
    });
  }

  const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback';
  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly profile email');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${req.params.userId}`;

  res.json({ authUrl, message: 'Redirect user to authUrl to connect Gmail' });
});

router.get('/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing authorization code or user ID' });
  }

  try {
    const { clientId, clientSecret } = loadGoogleCredentials();
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      return res.status(400).json({ error: tokens.error_description || 'Failed to exchange code for tokens' });
    }

    db.prepare(
      'UPDATE users SET gmail_connected = 1, gmail_tokens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(JSON.stringify(tokens), userId);

    res.json({ success: true, message: 'Gmail connected successfully!' });
  } catch (err) {
    res.status(500).json({ error: `Gmail connection failed: ${err.message}` });
  }
});

router.get('/status/:userId', (req, res) => {
  const user = db.prepare('SELECT gmail_connected, email FROM users WHERE id = ?').get(req.params.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    connected: !!user.gmail_connected,
    email: user.email,
    gmailConfigured: !!loadGoogleCredentials().clientId
  });
});

router.post('/disconnect/:userId', (req, res) => {
  try {
    db.prepare(
      'UPDATE users SET gmail_connected = 0, gmail_tokens = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(req.params.userId);

    res.json({ success: true, message: 'Gmail disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
