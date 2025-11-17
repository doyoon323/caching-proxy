const http = require("http");

http.createServer((req, res) => {
    const response = JSON.stringify({
        origin: 2,
        port: 4002,
        url: req.url,
        time: Date.now()
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(response);

}).listen(4002, () => console.log("Origin #2 running on port 4002"));

