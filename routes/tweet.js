// routes/tweet.js
import express from 'express';
import crypto from 'crypto';
import { redis, BLOOM_FILTER_KEY, TOP_K_KEY } from '../redisClient.js';
import { validateTweet } from '../utils/validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Hashes the tweet content for deduplication.
 * @param {string} tweet
 * @returns {string} Hashed tweet
 */
function hashTweet(tweet) {
  return crypto.createHash('sha256').update(tweet).digest('hex');
}

/**
 * Checks if the tweet is a duplicate using Bloom Filter.
 * @param {string} tweetHash
 * @returns {Promise<boolean>}
 */
async function isDuplicateTweet(tweetHash) {
  try {
    return await redis.bf.exists(BLOOM_FILTER_KEY, tweetHash);
  } catch (error) {
    logger.error(`Error checking Bloom Filter: ${error.message}`);
    throw error;
  }
}

/**
 * Adds the tweet hash to the Bloom Filter.
 * @param {string} tweetHash
 */
async function addTweetToBloomFilter(tweetHash) {
  try {
    await redis.bf.add(BLOOM_FILTER_KEY, tweetHash);
  } catch (error) {
    logger.error(`Error adding to Bloom Filter: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts hashtags from the tweet content.
 * @param {string} tweet
 * @returns {string[]} Array of hashtags
 */
function extractHashtags(tweet) {
  const hashtags = tweet.match(/#[\p{L}\p{N}_]+/gu) || [];
  return hashtags.map((tag) => tag.toLowerCase());
}


/**
 * Updates the Top-K structure with the extracted hashtags.
 * @param {string[]} hashtags
 */
async function updateTopKHashtags(hashtags) {
  if (!Array.isArray(hashtags) || hashtags.length === 0) return;

  try {
    await redis.topK.add(TOP_K_KEY, hashtags);
  } catch (error) {
    logger.error(`Error updating Top-K: ${error.message}`);
    throw error;
  }
}

/**
 * Processes the tweet: deduplication, hashtag extraction, updating Redis structures.
 * @param {string} tweet
 */
async function processTweet(tweet) {
  try {
    if (!tweet || typeof tweet !== 'string') {
      throw new Error('Invalid tweet content.');
    }

    const tweetHash = hashTweet(tweet);

    const duplicate = await isDuplicateTweet(tweetHash);
    if (duplicate) {
      logger.info('Duplicate tweet detected. Skipping processing.');
      return;
    }

    // Add to Bloom Filter and update Top-K concurrently
    const hashtags = extractHashtags(tweet);

    const tasks = [
      addTweetToBloomFilter(tweetHash),
      hashtags.length > 0 ? updateTopKHashtags(hashtags) : Promise.resolve(),
    ];

    await Promise.all(tasks);

    if (hashtags.length > 0) {
      logger.info(`Processed tweet with hashtags: ${hashtags.join(', ')}`);
    } else {
      logger.info('Tweet contains no hashtags.');
    }
  } catch (error) {
    logger.error(`Error processing tweet: ${error.message}`);
  }
}

/**
 * POST /tweet
 * Body: { "tweet": "This is a tweet with #RedisBloom and #TopK" }
 * Description: Processes a tweet, extracts hashtags, updates Top-K, and ensures deduplication.
 */
router.post('/', async (req, res, next) => {
  try {
    const { tweet } = req.body;

    // Input validation
    const validationError = validateTweet(tweet);
    if (validationError) {
      logger.warn(`Validation error: ${validationError}`);
      return res.status(400).json({ error: validationError });
    }

    // Send response immediately
    res.status(202).json({ message: 'Tweet received for processing.' });

    // Process tweet asynchronously
    processTweet(tweet).catch((error) => {
      logger.error(`Error processing tweet asynchronously: ${error.message}`);
    });
  } catch (error) {
    logger.error(`Error receiving tweet: ${error.message}`);
    next(error);
  }
});

export default router;
