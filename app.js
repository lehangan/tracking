let chart = null;

// lưu giá trị sold lần trước
let previousSold = Number(localStorage.getItem("previousSold")) || 0;

async function loadData() {
    try {
        const latest = await fetch("./data/latest.json?_=" + Date.now())
            .then(res => res.json());

        const history = await fetch("./data/history.json?_=" + Date.now())
            .then(res => res.json());

        updateSummary(latest);
        updateCategories(latest.categories);
        updateChart(history);

    } catch (err) {
        console.error(err);
    }
}

function updateSummary(data) {

    // update time
    document.getElementById("updatedAt").textContent =
        new Date(data.updatedAt).toLocaleString();

    // update numbers
    document.getElementById("total").textContent = data.total;
    document.getElementById("sold").textContent = data.sold;
    document.getElementById("holding").textContent = data.holding;
    document.getElementById("available").textContent = data.available;

    // percent
    const percent = data.total
        ? (data.sold / data.total) * 100
        : 0;

    document.getElementById("soldPercent").textContent =
        percent.toFixed(2) + "%";

    document.getElementById("progress-bar").style.width =
        percent + "%";

    // =========================
    // SOLD DELTA (phần bạn cần)
    // =========================
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

    // update lại previousSold
    previousSold = data.sold;
    localStorage.setItem("previousSold", previousSold);
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

                <p>Total: ${value.total}</p>

                <div class="category-progress">
                    <div class="category-progress-bar"
                        style="width:${percent}%"></div>
                </div>

                <div class="category-info">
                    <span>Sold: ${value.sold}</span>
                    <span>${percent.toFixed(1)}%</span>
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

    const labels = history.map(item => {
        const d = new Date(item.time);

        return d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    });

    const sold = history.map(item => item.sold);

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
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            },

            scales: {
                x: {
                    ticks: { color: "#cbd5e1" },
                    grid: { color: "#334155" }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#cbd5e1" },
                    grid: { color: "#334155" }
                }
            }
        }
    });
}

loadData();
setInterval(loadData, 30000);