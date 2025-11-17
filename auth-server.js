// auth-server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

// 실행 시: node auth-server.js 4001 fast
const port = process.argv[2] || 4001;
const speed = process.argv[3] || "fast";

const DATA_DIR = path.join(__dirname, "data");
const FILE_PATH = path.join(DATA_DIR, "auth-services.json");

// 지연시간 설정
function getDelay() {
    if (speed === "fast") return 30;
    if (speed === "medium") return 120;
    if (speed === "slow") return 300;
    return 50;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// 파일 준비
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// 유저 로드
function loadUsers() {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    } catch (err) {
        console.error("Failed to read users file:", err);
        return [];
    }
}

// 유저 저장
function saveUsers(users) {
    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error("Failed to save users:", err);
    }
}

let users = loadUsers();

// JSON 응답 helper
function json(res, code, data) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

async function handler(req, res) {
    await delay(getDelay());

    // body 읽기
    let body = "";
    req.on("data", chunk => body += chunk);
    await new Promise(resolve => req.on("end", resolve));

   const { url, method } = req;

    // signup
    if (url === "/signup" && method === "POST") {
        const { username, password } = JSON.parse(body || "{}");

        if (!username || !password) {
            return json(res, 400, { error: "missing fields", server: port });
        }

        if (users.find(u => u.username === username)) {
            return json(res, 409, { error: "user exists", server: port });
        }

        users.push({ username, password });
        saveUsers(users);

        return json(res, 201, { message: "signup success", server: port });
    }

    // login
    if (url === "/login" && method === "POST") {
        const { username, password } = JSON.parse(body || "{}");

        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return json(res, 401, { error: "invalid credentials", server: port });
        }

        const token = `token-${username}-${Date.now()}`;
        user.token = token;
        saveUsers(users);

        return json(res, 200, { message: "login success", token, server: port });
    }

    // me
    if (url === "/me" && method === "GET") {
        const auth = req.headers["authorization"];
        const token = auth?.split(" ")[1];

        const user = users.find(u => u.token === token);

        if (!user) {
            return json(res, 401, { error: "invalid token", server: port });
        }

        return json(res, 200, { username: user.username, server: port });
    }

    // health
    if (url === "/health") {
        return json(res, 200, { status: "ok", server: port });
    }

    // info
    if (url === "/info") {
        return json(res, 200, {
            service: "auth-service",
            port,
            speed,
            delay: getDelay() + "ms"
        });
    }

    return json(res, 404, { error: "not found", server: port });
}

http.createServer(handler).listen(port, () => {
    console.log(`Auth server running on ${port} (speed: ${speed})`);
});