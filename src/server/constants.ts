export const REDIS_SESSION_PREFIX = 'sess';
export const REDIS_USER_SESSION_PREFIX = 'user-session';
export const REDIS_RESET_PASSWORD_PREFIX = 'reset-pass';
export const REDIS_VERIFY_USER = 'verify';

export const REDIS_URL = process.env.MESSAGE_BROKER || 'redis://localhost:6379/0';
export const ALLOWED_HOST = [
    'http://localhost:4000',
    'http://localhost:4001',
    (process.env.CLIENT as string) || 'http://localhost:8000',
];
