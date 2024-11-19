// routes/hashtags.js
import express from 'express';
import { redis, TOP_K_KEY } from '../redisClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const MAX_COUNT = 25;

/**
 * Middleware to validate the 'count' query parameter.
 * Ensures 'count' is a positive integer not exceeding MAX_COUNT.
 * Attaches the validated 'count' to req.validatedCount.
 */
function validateCountParam(req, res, next) {
  try {
    const countParam = req.query.count;

    if (countParam === undefined) {
      return res.status(400).json({ error: "'count' query parameter is required." });
    }

    const count = parseInt(countParam, 10);

    if (isNaN(count) || count <= 0 || !Number.isInteger(count)) {
      return res.status(400).json({ error: "'count' must be a positive integer." });
    }

    if (count > MAX_COUNT) {
      return res
        .status(400)
        .json({ error: `'count' cannot exceed the maximum value of ${MAX_COUNT}.` });
    }

    // Attach the validated count to the request object
    req.validatedCount = count;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    logger.error(`Error validating 'count' parameter: ${error.message}`);
    next(error);
  }
}

/**
 * Fetches the top trending hashtags from Redis.
 * @param {number} count - The number of top hashtags to retrieve.
 * @returns {Promise<Array<{ hashtag: string, count: number }>>}
 */
async function getTopHashtags(count) {
  try {
    // Fetch Top-K hashtags with counts from Redis
    const topKData = await redis.topK.listWithCount(TOP_K_KEY);

    if (!Array.isArray(topKData) || topKData.length === 0) {
      logger.warn('No hashtags found in Top-K structure.');
      return [];
    }

    // Format and return the top hashtags up to the requested count
    return topKData
      .slice(0, count)
      .map(({ item, count }) => ({
        hashtag: item,
        count,
      }));
  } catch (error) {
    logger.error(`Error fetching top hashtags: ${error.message}`);
    throw error;
  }
}

/**
 * GET /api/v1/hashtags
 * Query Params: ?count=25 (Required)
 * Description: Retrieves the top trending hashtags.
 */
router.get('/', validateCountParam, async (req, res, next) => {
  try {
    const count = req.validatedCount;

    const topHashtags = await getTopHashtags(count);

    logger.info(`Retrieved top ${topHashtags.length} hashtags.`);
    res.status(200).json(topHashtags);
  } catch (error) {
    logger.error(`Error fetching trending hashtags: ${error.message}`);
    next(error);
  }
});

export default router;
