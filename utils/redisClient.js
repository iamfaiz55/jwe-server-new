const redis = require('redis');

// Initialize the Redis client
const redisClient = redis.createClient({
    url: 'redis://localhost:6379',
});
// Connect to Redis
redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis!');
});

redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
});

module.exports = redisClient;
