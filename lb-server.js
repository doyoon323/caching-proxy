// lb-server.js

// roundrobin -> leat connection 
const http = require("http");

const servers = { // pool
    "http://localhost:4001": 0,
    "http://localhost:4002": 0,
    "http://localhost:4003": 0
};

// 요청 A -> server[target]++하기 전에, 요청 B가 server[target]++ 하고 context switch
const rateLimit = require("./src/rate-limit");
const { relative } = require("path");
let current = 0;

function getIP(req) {
    let ip = req.socket.remoteAddress;

    if (ip === "::1") ip = "127.0.0.1";
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    return ip;
}


function getConnleastServer() {
    let min = Infinity; 
    let target = null;
    for(const [server, count] of Object.entries(servers)){
        if (count < min){
            min = count;
            target = server;
        }
    }

    // node.js는 단일스레드라 자바같은 race-condition은 없고, 비동기 I/O 타이밍이 문제가 된다
    //locks();
    servers[target]++;
    //free();
    return target;
}

http.createServer(async (req, res) => {
    const ip = getIP(req);
    const ok = await rateLimit(ip);
    if (!ok) {
        res.writeHead(429, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Too Many Requests" }));
    }
    const target = getConnleastServer();
    const proxyUrl = target + req.url;

    let released = false;
    // 정확히 한번만 decrement하자. (여러 이벤트 중 2개 이상 호출시, -- 여러번 실행하는 문제)
    const release = () => {
        if (released) return; // 두번 이상 실행 방지
        released = true;
        servers[target]--; 
    }

    //node.js는 싱글스레드라 연달아서 호출될 수는 있어도, 동시 실행은 불가능

    console.log(`[LC] ${req.method} ${req.url} → ${target}`);

    const proxyReq = http.request(proxyUrl, {
        method: req.method,
        headers: req.headers,
    }, (proxyRes) => {
        let body = "";

        proxyRes.on("data", chunk => body += chunk);
        proxyRes.on("end", () => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(body);
            release();
        });

        proxyRes.on("close", release);
    });

    req.on("close", release);
    req.on("aborted", release);
    req.on("error", release);
    

    // body forwarding (POST /signup, /login 지원)
    req.on("data", chunk => proxyReq.write(chunk));
    req.on("end", () => proxyReq.end());

    proxyReq.on("error", err => {
        console.error("Proxy Error:", err);
        res.writeHead(500);
        res.end("LB error");
        release(); 
    });

}).listen(3001, () => {
    console.log("LC (Least Connection) running on 3001");
});