const http = require("http");

http.createServer((req, res) => {
    const response = JSON.stringify({
        origin: 3,
        port: 4003,
        url: req.url,
        time: Date.now()
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(response);

}).listen(4003, () => console.log("Origin #3 running on port 4003"));