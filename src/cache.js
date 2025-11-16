const redis = require("redis");
const client = redis.createClient();
client.connect();

module.exports = {
    async getCached(key) {
        return await client.get(key);
    },
    async setCached(key,value){
        await client.setEx(key, 1000, value); // ttl 10초
    },
    async clear() {
        await client.flushAll();
    }
}