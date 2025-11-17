// lb-server.js
const http = require("http");

const servers = [ //pool
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:4003",
];

const rateLimit = require("./src/rate-limit");
let current = 0;

function getIP(req) {
    let ip = req.socket.remoteAddress;

    if (ip === "::1") ip = "127.0.0.1";
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    return ip;
}


function getNextServer() {
    const server = servers[current];
    current = (current + 1) % servers.length;
    return server;
}

http.createServer(async (req, res) => {
    
    console.log("CLIENT IP:", req.socket.remoteAddress);
    const ip = getIP(req);
    const ok = await rateLimit(ip);
    if (!ok) {
        res.writeHead(429, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Too Many Requests" }));
    }



    const target = getNextServer();
    const proxyUrl = target + req.url;

    console.log(`[LB] ${req.method} ${req.url} → ${target}`);

    const proxyReq = http.request(proxyUrl, {
        method: req.method,
        headers: req.headers,
    }, (proxyRes) => {
        let body = "";

        proxyRes.on("data", chunk => body += chunk);
        proxyRes.on("end", () => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(body);
        });
    });

    // body forwarding (POST /signup, /login 지원)
    req.on("data", chunk => proxyReq.write(chunk));
    req.on("end", () => proxyReq.end());

    proxyReq.on("error", err => {
        console.error("Proxy Error:", err);
        res.writeHead(500);
        res.end("LB error");
    });

}).listen(3001, () => {
    console.log("LB (Round Robin) running on 3001");
});


// algorithm :  least connection으로 확장하기 




// api rate 
/*
    1. 클라이언ㄴ트 요청 -> 1개 토큰 사용
    2. 토큰 없으면 요청 차단 (too many request)
    3. 일정 주기마다 토큰 refill
    4. token refill 연산은 redis에서 atomic하게 처리


-> LB에서는
    1. 매 요청마다 redis Lua 스크립트 실행
    2. 토큰 사용 가능? 을 redis가 판단
    3. LB는 reids 결과만 보고 허용/차단
*/