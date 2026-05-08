import BaseAgent from './BaseAgent.js';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt, generatePassword, generateUsername } from '../utils/encryption.js';

export default class AccountManagerAgent extends BaseAgent {
  constructor() {
    super('AccountManagerAgent', 'Platform Account Manager', [
      'account_creation',
      'credential_management',
      'platform_setup',
      'password_generation',
      'multi_platform_management'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'create_account':
        return this.createAccountEntry(context);
      case 'get_credentials':
        return this.getCredentials(context);
      case 'list_accounts':
        return this.listAccounts(context);
      case 'update_credentials':
        return this.updateCredentials(context);
      case 'setup_platforms':
        return this.setupPlatforms(context);
      case 'delete_account':
        return this.deleteAccountEntry(context);
      default:
        return { error: 'Unknown action for AccountManagerAgent' };
    }
  }

  createAccountEntry(context) {
    const { userId, platformName, platformUrl, email, username, password } = context;
    if (!userId || !platformName) return { error: 'User ID and platform name required' };

    const id = uuidv4();
    const generatedPassword = password || generatePassword(16);
    const generatedUsername = username || generateUsername(context.userName, email);

    try {
      db.prepare(
        'INSERT INTO platform_credentials (id, user_id, platform_name, platform_url, username, email, password_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, userId, platformName, platformUrl || '', generatedUsername, email || '', encrypt(generatedPassword));

      this.logAction(userId, null, 'create_account', { platformName }, { id, platformName, username: generatedUsername });
      this.addLearning('account_creation', `Created account on ${platformName}`, 0.8, 'account_management');

      return {
        success: true,
        accountId: id,
        platform: platformName,
        username: generatedUsername,
        email: email || 'Use primary email',
        password: generatedPassword,
        message: `Account credentials saved for ${platformName}. Password has been encrypted and stored securely.`
      };
    } catch (err) {
      return { error: `Failed to create account: ${err.message}` };
    }
  }

  getCredentials(context) {
    const { userId, platformName } = context;
    if (!userId) return { error: 'User ID required' };

    try {
      let query = 'SELECT * FROM platform_credentials WHERE user_id = ?';
      const params = [userId];

      if (platformName) {
        query += ' AND platform_name = ?';
        params.push(platformName);
      }

      const accounts = db.prepare(query).all(...params);

      return accounts.map(acc => ({
        id: acc.id,
        platform: acc.platform_name,
        platformUrl: acc.platform_url,
        username: acc.username,
        email: acc.email,
        password: decrypt(acc.password_encrypted),
        createdAt: acc.created_at
      }));
    } catch (err) {
      return { error: `Failed to retrieve credentials: ${err.message}` };
    }
  }

  listAccounts(context) {
    const { userId } = context;
    if (!userId) return { error: 'User ID required' };

    try {
      const accounts = db.prepare(
        'SELECT id, platform_name, platform_url, username, email, created_at FROM platform_credentials WHERE user_id = ? ORDER BY created_at DESC'
      ).all(userId);

      return {
        accounts,
        totalPlatforms: accounts.length,
        platforms: [...new Set(accounts.map(a => a.platform_name))]
      };
    } catch {
      return { accounts: [], totalPlatforms: 0, platforms: [] };
    }
  }

  updateCredentials(context) {
    const { accountId, userId, newPassword, newEmail, newUsername } = context;
    if (!accountId || !userId) return { error: 'Account ID and User ID required' };

    try {
      const updates = [];
      const params = [];

      if (newPassword) {
        updates.push('password_encrypted = ?');
        params.push(encrypt(newPassword));
      }
      if (newEmail) {
        updates.push('email = ?');
        params.push(newEmail);
      }
      if (newUsername) {
        updates.push('username = ?');
        params.push(newUsername);
      }

      if (updates.length === 0) return { error: 'No updates provided' };

      params.push(accountId, userId);
      db.prepare(
        `UPDATE platform_credentials SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
      ).run(...params);

      this.logAction(userId, null, 'update_credentials', { accountId }, { updated: updates.length });

      return { success: true, message: 'Credentials updated successfully' };
    } catch (err) {
      return { error: `Failed to update credentials: ${err.message}` };
    }
  }

  setupPlatforms(context) {
    const { userId, email, userName } = context;
    if (!userId || !email) return { error: 'User ID and email required' };

    const platforms = [
      { name: 'LinkedIn', url: 'https://www.linkedin.com', priority: 'Essential' },
      { name: 'Indeed', url: 'https://www.indeed.com', priority: 'High' },
      { name: 'Glassdoor', url: 'https://www.glassdoor.com', priority: 'High' },
      { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com', priority: 'Medium' },
      { name: 'Monster', url: 'https://www.monster.com', priority: 'Medium' },
      { name: 'CareerBuilder', url: 'https://www.careerbuilder.com', priority: 'Medium' },
      { name: 'AngelList/Wellfound', url: 'https://wellfound.com', priority: 'Medium' },
      { name: 'Dice', url: 'https://www.dice.com', priority: 'Medium' },
      { name: 'SimplyHired', url: 'https://www.simplyhired.com', priority: 'Low' },
      { name: 'FlexJobs', url: 'https://www.flexjobs.com', priority: 'Low' }
    ];

    const setupResults = platforms.map(platform => {
      const password = generatePassword(18);
      const username = generateUsername(userName, email);

      const existing = db.prepare(
        'SELECT id FROM platform_credentials WHERE user_id = ? AND platform_name = ?'
      ).get(userId, platform.name);

      if (existing) {
        return { platform: platform.name, status: 'already_exists', accountId: existing.id };
      }

      const result = this.createAccountEntry({
        userId,
        platformName: platform.name,
        platformUrl: platform.url,
        email,
        username,
        password,
        userName
      });

      return {
        platform: platform.name,
        url: platform.url,
        priority: platform.priority,
        status: result.success ? 'credentials_generated' : 'failed',
        username: result.username,
        password: result.password,
        note: 'Use these credentials when creating your account on this platform'
      };
    });

    return {
      setupResults,
      totalPlatforms: platforms.length,
      successCount: setupResults.filter(r => r.status === 'credentials_generated' || r.status === 'already_exists').length,
      instructions: [
        'Credentials have been generated and securely stored for each platform.',
        'Visit each platform URL to create your account using the generated credentials.',
        'The software will use these credentials for future automated applications.',
        'You can view or update credentials anytime from the Settings page.'
      ]
    };
  }

  deleteAccountEntry(context) {
    const { accountId, userId } = context;
    if (!accountId || !userId) return { error: 'Account ID and User ID required' };

    try {
      db.prepare('DELETE FROM platform_credentials WHERE id = ? AND user_id = ?').run(accountId, userId);
      return { success: true, message: 'Account credentials deleted' };
    } catch (err) {
      return { error: `Failed to delete: ${err.message}` };
    }
  }
}
