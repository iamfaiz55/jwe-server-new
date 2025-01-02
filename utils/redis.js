
// isko import karna karna hai redis client ki file se
const redisClient = require("./redisClient");

const redisMiddleware = async (req, res, next) => {
    const key = req.originalUrl; 
    try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
            console.log(`Cache hit for ${key}`);
            return res.status(200).json(JSON.parse(cachedData));
        }
        console.log(`Cache miss for ${key}`);
        next();
    } catch (error) {
        console.error('Redis Middleware Error:', error);
        next();
    }
};


const setCache = async (key, data, ttl = 3600) => {
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        console.log(`Data cached under key: ${key}`);
    } catch (error) {
        console.error('Error setting cache:', error);
    }
};



module.exports = { redisMiddleware, setCache };
