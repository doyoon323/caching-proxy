const http = require("http");
const { getCached, setCached, clear} = require("./cache");

module.exports = function startServer(port, origin){
    const server = http.createServer(async (req, res) => {
        const cacheKey = req.url;
        const cached = await getCached(cacheKey);
        console.log("cacheKey=", req.url, "hit=", !!cached);

        if (cached) {
            res.setHeader("X-Cache", "HIT");
            res.writeHead(200, {"Content-Type" : "application/json"});
            return res.end(cached);
        }

        const proxyUrl = origin + req.url;

        //origin server get
        http.get(proxyUrl, (originRes)=>{ 
            let data="";
            originRes.on("data", chunk => data +=chunk);
            originRes.on("end", async ()=> {
                await setCached(cacheKey,data,10);

                res.setHeader("X-Cache", "MISS");
                res.writeHead(originRes.statusCode, originRes.headers);
                res.end(data);
            }).on("error", err => {
                res.writeHead(500);
                res.end("Origin request failed");
            });
        });
    });

    server.listen(port, () =>{
            console.log(`caching proxy running at ${port}`);
        })
}


// redis 기반 lru 캐시 프록시 서버
// 간단한 cdn 구현 
// api rate limiter 
// load balancer


// 분산캐싱 시스템 (redis) + 쿠버네티스 배포 
