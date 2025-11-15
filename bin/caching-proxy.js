#!/usr/bin/env node


// 커맨드라인 도구 실행
// 실행 포트, 요청을 전달한 원본서버 
// 캐시 기능

const fs = require('fs');

const argv = process.argv.slice(2);
if (argv.length == 0){
    process.exit(0);
}

//clear cache 
if (argv.includes("--clear-cache")) {
    require("../src/cache").clear();
    console.log("Cache cleared");
    process.exit(0);
}

// parsing param
const portIndex = argv.indexOf("--port");
const originIndex = argv.indexOf("--origin");

if (portIndex === -1 || originIndex === -1) {
  console.error("Error: --port and --origin are required.");
  process.exit(1);
}

const port = parseInt(argv[portIndex + 1], 10);
const origin = argv[originIndex + 1];

require("../src/server")(port, origin);


/*

[
  "/usr/local/bin/node",        // Node 실행 파일 경로
  "/usr/local/bin/caching-proxy", // 실행한 js 파일 경로
  "--port",
  "3000",
  "--origin",
  "http://localhost:4000"
]


*/