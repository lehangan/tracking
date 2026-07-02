const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API =
  "https://api-bnd.trackify.life/api/bnd/get-seats?event_id=53";

const DATA_DIR = path.resolve(__dirname, "../data");
const LATEST_FILE = path.join(DATA_DIR, "latest.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

// Tạo thư mục data nếu chưa có
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function crawl() {
  try {
    console.log("Fetching seats...");

    const { data } = await axios.get(API);

    if (!data.result) {
      throw new Error("API response invalid.");
    }

    const seats = data.result;

    const summary = {
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
        case 1:
          summary.available++;
          summary.categories[type].available++;
          break;

        case 2:
          summary.holding++;
          summary.categories[type].holding++;
          break;

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
      const old = JSON.parse(fs.readFileSync(LATEST_FILE, "utf8"));

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

    // Chỉ lưu history khi có thay đổi
    if (changed) {
      let history = [];

      if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
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

      console.log("History updated.");
    } else {
      console.log("No changes.");
    }

    console.log("----------------------------------");
    console.log(`Updated : ${summary.updatedAt}`);
    console.log(`Total   : ${summary.total}`);
    console.log(`Sold    : ${summary.sold}`);
    console.log(`Holding : ${summary.holding}`);
    console.log(`Available: ${summary.available}`);
    console.log("----------------------------------");

    console.table(summary.categories);

  } catch (err) {
    console.error("Crawler Error:", err.message);
  }
}

module.exports = crawl;

if (require.main === module) {
    crawl();
}