const redis = require("redis");
const client = redis.createClient();
client.connect();

const CAPACITY = 20;
const REFILL_RATE = 5;

async function rateLimit(ip) {
    const key = `rate_limit:${ip}`;
    const now = Math.floor(Date.now() / 1000);

    //key가 없으면 새 버킷 생성 
    const data = await client.hGetAll(key);
    let tokens = data.tokens ? parseFloat(data.tokens) : CAPACITY;
    let last = data.last_ts ? parseInt(data.last_ts) : now;

    //토큰 리필 
    const delta = now - last;
    if (delta > 0) {
        tokens = Math.min(CAPACITY, tokens + delta * REFILL_RATE);
        last = now;
    }


    /// race condition에 완전히 안전하진 않음
    
    tokens -=1;
    // 토큰 부족하면 차단
    if (tokens < 0) {
        return false; // rate limit hit
    }
    await client.hSet(key, {
        tokens: tokens.toFixed(3),
        last_ts: last
    });

    return true;
}
module.exports = rateLimit;