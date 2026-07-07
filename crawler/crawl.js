const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function crawl(eventId) {

    const API = `https://api-bnd.trackify.life/api/bnd/get-seats?event_id=${eventId}`;

    const DATA_DIR = path.resolve(__dirname, `../data/${eventId}`);
    const LATEST_FILE = path.join(DATA_DIR, "latest.json");
    const HISTORY_FILE = path.join(DATA_DIR, "history.json");

    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    try {

        console.log(`========== Crawling Event ${eventId} ==========`);

        const { data } = await axios.get(API);

        if (!data.result) {
            throw new Error("API response invalid.");
        }

        const seats = data.result;

        const summary = {
            eventId,
            updatedAt: new Date().toISOString(),
            total: seats.length,
            available: 0,
            holding: 0,
            sold: 0,
            categories: {}
        };

        for (const seat of seats) {

            const type = seat.ticket_type_name || "UNKNOWN";

            if (!summary.categories[type]) {
                summary.categories[type] = {
                    total: 0,
                    available: 0,
                    holding: 0,
                    sold: 0
                };
            }

            summary.categories[type].total++;

            switch (seat.status) {

                // Available
                case 1:
                    summary.available++;
                    summary.categories[type].available++;
                    break;

                // Holding
                case 2:
                case 4:
                    summary.holding++;
                    summary.categories[type].holding++;
                    break;

                // Sold
                case 3:
                    summary.sold++;
                    summary.categories[type].sold++;
                    break;

                default:
                    console.log(
                        `Unknown status ${seat.status} (${seat.code})`
                    );
            }

        }

        let changed = true;

        if (fs.existsSync(LATEST_FILE)) {

            const old = JSON.parse(
                fs.readFileSync(LATEST_FILE, "utf8")
            );

            if (
                old.available === summary.available &&
                old.holding === summary.holding &&
                old.sold === summary.sold
            ) {
                changed = false;
            }

        }

        // Luôn cập nhật latest.json
        fs.writeFileSync(
            LATEST_FILE,
            JSON.stringify(summary, null, 2)
        );

        // Chỉ append history khi dữ liệu thay đổi
        if (changed) {

            let history = [];

            if (fs.existsSync(HISTORY_FILE)) {
                history = JSON.parse(
                    fs.readFileSync(HISTORY_FILE, "utf8")
                );
            }

            history.push({
                time: summary.updatedAt,
                available: summary.available,
                holding: summary.holding,
                sold: summary.sold
            });

            fs.writeFileSync(
                HISTORY_FILE,
                JSON.stringify(history, null, 2)
            );

            console.log(`[${eventId}] History updated.`);

        } else {

            console.log(`[${eventId}] No changes.`);

        }

        console.log("----------------------------------");
        console.log(`Event     : ${eventId}`);
        console.log(`Updated   : ${summary.updatedAt}`);
        console.log(`Total     : ${summary.total}`);
        console.log(`Sold      : ${summary.sold}`);
        console.log(`Holding   : ${summary.holding}`);
        console.log(`Available : ${summary.available}`);
        console.log("----------------------------------");

        console.table(summary.categories);

    } catch (err) {

        console.error(
            `[${eventId}] Crawler Error:`,
            err.message
        );

    }

}

module.exports = crawl;

// Chạy trực tiếp:
// node crawler/crawl.js 53
// node crawler/crawl.js 54
if (require.main === module) {

    const eventId = Number(process.argv[2]) || 53;

    crawl(eventId);

}