import Redis from 'ioredis';
import { REDIS_URL } from './constants';

export const redis = new Redis(REDIS_URL);
