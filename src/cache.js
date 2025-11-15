let cache = {}; 

//getCached(key)
function getCached(key){
    return cache[key];
};
//module.export -> 파일이 외부에 기능을 내보내겠다
//setCached(key,value)
function setCached(key,value){
    cache[key] = value;
    return value;
};
//clear()
function clear(){
    cache = {};
};


module.exports = {getCached, setCached, clear};


//ttl캐시, lru캐시, 파일기반캐시, redis로 교체 

/*

Rate Limiter + Load Balancer + API Gateway mini-version
	2.	Redis 기반 캐싱 프록시 + CDN 확장

    */


// redis 캐시 연동 -> ttl 적용 -> lru 구현 -> 

