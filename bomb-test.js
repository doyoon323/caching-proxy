const axios = require("axios");

async function run() {
  const BATCH = 2000;   // 동시 2,000개
  const ROUNDS = 50;    // 50라운드 → 총 10만 개

  for (let round = 0; round < ROUNDS; round++) {
    console.log("Round", round);
    await Promise.all(
      Array(BATCH)
        .fill(0)
        .map((_, i) => axios.get("http://localhost:3000/data/" + i))
    );
  }
}

run();