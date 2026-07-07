let chart = null;

// Lấy event từ URL (?event=53)
// Mặc định là 53 nếu không truyền
const eventId =
    new URLSearchParams(window.location.search).get("event") || "53";

// previous sold riêng cho từng event
let previousSold = Number(
    localStorage.getItem(`previousSold_${eventId}`)
) || 0;

async function loadData() {
    try {

        const latest = await fetch(
            `./data/${eventId}/latest.json?_=${Date.now()}`
        ).then(res => res.json());

        const history = await fetch(
            `./data/${eventId}/history.json?_=${Date.now()}`
        ).then(res => res.json());

        updateSummary(latest);
        updateCategories(latest.categories);
        updateChart(history);

    } catch (err) {
        console.error(err);
    }
}

function updateSummary(data) {

    document.getElementById("updatedAt").textContent =
        new Date(data.updatedAt).toLocaleString();

    document.getElementById("total").textContent = data.total;
    document.getElementById("sold").textContent = data.sold;
    document.getElementById("holding").textContent = data.holding;
    document.getElementById("available").textContent = data.available;

    const percent = data.total
        ? (data.sold / data.total) * 100
        : 0;

    document.getElementById("soldPercent").textContent =
        percent.toFixed(2) + "%";

    document.getElementById("progress-bar").style.width =
        percent + "%";

    // Sold delta
    const delta = data.sold - previousSold;

    const deltaEl = document.getElementById("soldDelta");

    if (delta > 0) {
        deltaEl.textContent = `(+${delta})`;
        deltaEl.classList.remove("negative");
    } else if (delta < 0) {
        deltaEl.textContent = `(${delta})`;
        deltaEl.classList.add("negative");
    } else {
        deltaEl.textContent = "(+0)";
        deltaEl.classList.remove("negative");
    }

    previousSold = data.sold;

    localStorage.setItem(
        `previousSold_${eventId}`,
        previousSold
    );
}

function updateCategories(categories) {

    const container = document.getElementById("categories");

    container.innerHTML = "";

    Object.entries(categories).forEach(([name, value]) => {

        const percent = value.total
            ? (value.sold / value.total) * 100
            : 0;

        container.innerHTML += `
            <div class="category-item">

                <h3>${name}</h3>

                <div class="category-sold">
                    Sold ${value.sold}/${value.total}
                    (${percent.toFixed(1)}%)
                </div>

                <div class="category-progress">

                    <div
                        class="category-progress-bar"
                        style="width:${percent}%"
                    ></div>

                </div>

                <div class="category-info">

                    <span>Holding: ${value.holding}</span>

                    <span>Available: ${value.available}</span>

                </div>

            </div>
        `;
    });
}

function updateChart(history) {

    const sold = history.map(item => item.sold);

    const labels = [];

    let lastDate = "";

    history.forEach(item => {

        const d = new Date(item.time);

        const currentDate = d.toLocaleDateString([], {
            day: "2-digit",
            month: "2-digit"
        });

        if (currentDate !== lastDate) {

            labels.push(currentDate);
            lastDate = currentDate;

        } else {

            labels.push("");

        }

    });

    const ctx = document
        .getElementById("historyChart")
        .getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {

        type: "line",

        data: {

            labels,

            datasets: [

                {

                    label: "Sold",

                    data: sold,

                    borderColor: "#3b82f6",

                    backgroundColor: "rgba(59,130,246,.15)",

                    fill: true,

                    tension: 0.35,

                    pointRadius: 3,

                    pointHoverRadius: 6

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {

                legend: {

                    labels: {
                        color: "white"
                    }

                },

                tooltip: {

                    callbacks: {

                        title(context) {

                            const index = context[0].dataIndex;

                            return new Date(history[index].time)
                                .toLocaleString();

                        }

                    }

                }

            },

            scales: {

                x: {

                    ticks: {

                        color: "#cbd5e1",

                        autoSkip: false,

                        maxRotation: 0,

                        minRotation: 0

                    },

                    grid: {

                        color: "#334155"

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: "#cbd5e1"

                    },

                    grid: {

                        color: "#334155"

                    }

                }

            }

        }

    });

}

// Dropdown chọn event
const eventSelect = document.getElementById("eventSelect");

if (eventSelect) {

    eventSelect.value = eventId;

    eventSelect.addEventListener("change", () => {

        window.location.href = `?event=${eventSelect.value}`;

    });

}

loadData();

// Refresh mỗi 30 giây
setInterval(loadData, 30000);