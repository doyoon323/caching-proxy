// lb-server.js
const http = require("http");

const servers = [ //pool
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:4003",
];

let current = 0;

function getNextServer() {
    const server = servers[current];
    current = (current + 1) % servers.length;
    return server;
}

http.createServer((req, res) => {
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