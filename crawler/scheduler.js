const crawl = require("./crawl");

const INTERVAL = 60 * 1000; // 1 phút

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    console.log("Scheduler started.");

    while (true) {
        try {
            await crawl();
        } catch (err) {
            console.error("Scheduler error:", err.message);
        }

        console.log(`Next crawl in ${INTERVAL / 1000}s...\n`);

        await sleep(INTERVAL);
    }
}

start();