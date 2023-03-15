require('dotenv').config()

module.exports = {
    MONGO_PORT: process.env.MONGO_PORT || 27017,
    MONGO_IP: process.env.MONGO_IP || 'localhost',
    MONGO_INITDB_ROOT_USERNAME: process.env.MONGO_INITDB_ROOT_USERNAME || '',
    MONGO_INITDB_ROOT_PASSWORD: process.env.MONGO_INITDB_ROOT_PASSWORD || '',
    MONGO_DATABASE: process.env.MONGO_DATABASE || 'google-calendar-api',
    REDIS_URL: process.env.REDIS_URL || "localhost",
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    COOKIE_SECRET: process.env.COOKIE_SECRET,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET
}