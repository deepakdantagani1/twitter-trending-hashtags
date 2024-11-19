// redisClient.js
import { createClient } from 'redis';
import logger from './utils/logger.js';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error('Redis Client Error', err));

const BLOOM_FILTER_KEY = 'tweet_filter';
const TOP_K_KEY = 'topk_hashtags';

const checkBloomFilterInitialization = async () => {
  const exists = await redis.exists(BLOOM_FILTER_KEY);
  if (!exists) {
    logger.error(`Bloom Filter "${BLOOM_FILTER_KEY}" does not exist`);
    throw new Error('Bloom Filter does not exist');
  }
}

const checkTopKInitialization = async () => {
  const exists = await redis.exists(TOP_K_KEY);
  if (!exists) {
    logger.error(`Top-K "${TOP_K_KEY}" does not exist`);
    throw new Error('Top-K does not exist');
  }
}

export const initializeRedis = async () => {
  try {
    await redis.connect();
    await Promise.all([checkBloomFilterInitialization(), checkTopKInitialization()]);
    logger.info('RedisBloom and Top-K initialization checks completed successfully.');
  } catch (err) {
    logger.error(`Error during RedisBloom check or initialization: ${err.message}`);
    throw err;
  }
};


export { redis, BLOOM_FILTER_KEY, TOP_K_KEY };