const http = require("http");

http.createServer((req,res) => {
    const response = JSON.stringify({
        url: req.url,
        time : Date.now()
    });

    res.writeHead(200, {"Content-Type" : "application/json"});
    res.end(response);
}).listen(4001, ()=> console.log("Origin is running on 4001"));


// 프록시(3000) -> origin(4000)pw
