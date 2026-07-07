const crawl = require("./crawl");

(async () => {
    for (const eventId of [53, 54]) {
        try {
            await crawl(eventId);
        } catch (err) {
            console.error(`Event ${eventId} failed:`, err);
        }
    }
})();