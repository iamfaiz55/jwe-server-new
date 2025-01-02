const redis = require('redis');

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
// Initialize the Redis client
const redisClient = redis.createClient({
    host: redisHost,
    port: redisPort,
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
