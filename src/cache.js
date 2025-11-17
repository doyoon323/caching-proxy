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


// test 1  : ttl 유무의 차이
/*
    없다면, 
    - 메모리 계속 증가
    - 오래된 데이터 쌓임
    - 메모리 부족으로 이어짐


    있다면,
    - 자동으로 정리
    - 메모리 안정적
    - cache miss 증가 가능 
*/


//어떤 경우에 써야하는가? 어떤 경우에 시간을 길게/짧게 할당해야하는가?



// test 2 : lru 유무의 차이 
/*
    lru : 최근 사용된 데이터 유지 -> 시간 기반 접근
    lfu : 자주 사용된 데이터 유지 -> 인기도 기반 패턴에 유리
    
*/