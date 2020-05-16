import { join as pathJoin } from 'path';

export const isTest = process.env.NODE_ENV === 'test';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

export const REDIS_SESSION_PREFIX = 'sess';
export const REDIS_USER_SESSION_PREFIX = 'user-session';
export const REDIS_FORGOT_PASSWORD_PREFIX = 'forgot-pass';
export const REDIS_VERIFY_USER = 'verify';
export const REDIS_SLOW_DOWN = 'slow';
export const REDIS_RATE_LIMIT = 'rate';

export const UPLOAD_DIR = pathJoin(process.cwd(), 'media');

export const REDIS_URL = process.env.MESSAGE_BROKER || 'redis://localhost:6379/0';
export const TRUSTED_HOST = ['http://localhost:3000', 'http://localhost:4001'];

export const MAX_SESSION_EXPIRY = 1000 * 60 * 60 * 24 * 30;
export const MAX_PASSWORD_RESET_TRY = 5;
export const ACCOUNT_LOCKING_TIME_MAP = {
    '5': 1000 * 30,
    '10': 1000 * 60 * 10,
    '14': 1000 * 60 * 15,
    '17': 1000 * 60 * 30,
    '19': 1000 * 60 * 60,
    '20': 1000 * 60 * 24,
};
