const http = require("http");
const { getCached, setCached } = require("./cache");

module.exports = function startServer(port, origin) {
    const server = http.createServer(async (req, res) => {

        // 캐싱은 GET 요청만 적용 (POST/PUT은 캐싱하면 안 됨)
        const isCacheable = req.method === "GET";
        const cacheKey = req.url;

        // GET 요청이면 캐시 체크
        if (isCacheable) {
            const cached = await getCached(cacheKey);
            console.log("cacheKey=", cacheKey, "hit=", !!cached);

            if (cached) {
                res.setHeader("X-Cache", "HIT");
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(cached);
            }
        }

        // MISS → LB or origin으로 전달
        const proxyUrl = origin + req.url;

        const originReq = http.request(proxyUrl, {
            method: req.method,
            headers: req.headers
        }, (originRes) => {
            let data = "";

            originRes.on("data", chunk => data += chunk);
            originRes.on("end", async () => {

                // GET 요청만 캐싱
                if (isCacheable) {
                    await setCached(cacheKey, data);
                }

                res.setHeader("X-Cache", isCacheable ? "MISS" : "NO-CACHE");
                res.writeHead(originRes.statusCode, originRes.headers);
                res.end(data);
            });
        });

        // body forwarding (POST, PUT, PATCH 요청 지원)
        req.on("data", chunk => originReq.write(chunk));
        req.on("end", () => originReq.end());

        originReq.on("error", err => {
            console.error("Proxy Error:", err);
            res.writeHead(500);
            res.end("Origin request failed");
        });
    });

    server.listen(port, () => {
        console.log(`caching proxy running at ${port}`);
    });
};