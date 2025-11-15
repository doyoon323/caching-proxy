const http = require("http");
const { getCached, setCached, clear} = require("./cache");

module.exports = function startServer(port, origin){
    const server = http.createServer(async (req, res) => {
        const cacheKey = req.url;
        const cached = getCached(cacheKey);
        if (cached) {
            res.setHeader("X-Cache", "HIT");
            res.writeHead(200, {"Content-Type" : "application/json"});
            return res.end(cached);
        }

        const proxyUrl = origin + req.url;

        http.get(proxyUrl, (originRes)=>{
            let data="";
            originRes.on("data", chunk => data +=chunk);
            originRes.on("end", ()=>{
                setCached(cacheKey,data);

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