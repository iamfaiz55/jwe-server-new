const redis = require('redis');


const redisClient = redis.createClient({
    host: '127.0.0.1',
    port:  6379,
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
