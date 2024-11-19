// redisClient.js
import { createClient } from 'redis';
import logger from './utils/logger.js';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error('Redis Client Error', err));

const BLOOM_FILTER_KEY = 'tweet_filter';
const TOP_K_KEY = 'topk_hashtags';

const initializeBloomFilter = async () => {
  try {
    await redis.bf.reserve(BLOOM_FILTER_KEY, 0.01, 100000); // 1% error rate, 100k capacity
    logger.info('Bloom Filter initialized.');
  } catch (err) {
    if (err.message.includes('ERR item exists')) {
      logger.warn(`Bloom Filter "${BLOOM_FILTER_KEY}" already exists. Skipping initialization.`);
    } else {
      logger.error(`Error initializing Bloom Filter: ${err.message}`);
      throw err;
    }
  }
};

const initializeTopK = async () => {
  try {
    const k = 25; // Top 25 hashtags
    await redis.topK.reserve(TOP_K_KEY, 25);
    logger.info('Top-K structure initialized.');
  } catch (err) {
    if (err.message.includes('key already exists')) {
      logger.warn(`Top-K "${TOP_K_KEY}" already exists. Skipping initialization.`);
    } else {
      logger.error(`Error initializing Top-K structure: ${err.message}`);
      throw err;
    }
  }
};


export const initializeRedis = async () => {
  try {
    await redis.connect();
    await initializeBloomFilter();
    await initializeTopK();
    logger.info('RedisBloom initialized with Bloom Filter and Top-K structures.');
  } catch (err) {
    logger.error(`Error initializing RedisBloom: ${err.message}`);
    throw err;
  }
};

export { redis, BLOOM_FILTER_KEY, TOP_K_KEY };