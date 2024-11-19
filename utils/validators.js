// utils/validators.js
export const validateTweet = (tweet) => {
    if (!tweet) {
      return 'Tweet is required.';
    }
    if (typeof tweet !== 'string' || tweet.trim() === '') {
      return 'Tweet must be a non-empty string.';
    }
    if (tweet.length > 280) {
      return 'Tweet exceeds maximum length of 280 characters.';
    }
    return null;
  };
  