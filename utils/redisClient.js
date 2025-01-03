// const redis = require('redis');

// // REDIS_URL=

// // Initialize the Redis client
// const redisClient = redis.createClient({
//     url: 'redis://default:wATEGhsJDFujaRgiOTYUcFYMLBmSURrf@<RAILWAY_PRIVATE_DOMAIN>:6379',
// });
// // Connect to Redis
// redisClient.connect().catch((err) => {
//     console.error('Failed to connect to Redis:', err);
// });

// redisClient.on('connect', () => {
//     console.log('Connected to Redis!');
// });

// redisClient.on('error', (err) => {
//     console.error('Redis Error:', err);
// });

// module.exports = redisClient;
const { default: Redis } = require("ioredis")
require("dotenv").config()

// const redis = Redis.createClient(process.env.REDIS_URL)
const redisClient = new Redis(process.env.REDIS_URL)
redisClient.on('error', (err) => {
    console.error("Redis connection error:", err);
})

// const redis = new Redis({
//     host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT,
// })

module.exports = {redisClient}