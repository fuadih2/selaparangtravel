// src/main_logic.js
// TIDAK ADA require DI SINI LAGI

// --- ELEMEN DOM ---
const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".nav-link");

// --- ELEMEN MODAL ---
const detailModal = document.getElementById("detailModal");
const modalCloseBtn = document.querySelector(".modal-close-btn");

// --- ELEMEN PENCARIAN & FILTER ---
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const resetFilterBtn = document.getElementById("resetFilterBtn");

// --- FUNGSI DINAMIS UNTUK TRANSPORTASI ---
function updateTransportField() {
  const travelType = document.getElementById("travelType").value;
  const transportLabel = document.getElementById("transportLabel");
  const transportInput = document.getElementById("flightNumber");
  switch (travelType) {
    case "Pesawat":
      transportLabel.textContent = "Nomor Penerbangan";
      transportInput.placeholder = "Contoh: GA 123";
      break;
    case "Kapal":
      transportLabel.textContent = "Nama Kapal";
      transportInput.placeholder = "Contoh: KM Labobar";
      break;
    case "Bus":
      transportLabel.textContent = "Nama Bus";
      transportInput.placeholder = "Contoh: Shantika";
      break;
    default:
      transportLabel.textContent = "Nomor Penerbangan";
      transportInput.placeholder = "Contoh: GA 123";
      break;
  }
}

// --- FUNGSI MODAL ---
function showModal(transaction) {
  document.getElementById("detail-name").textContent =
    transaction.passenger_name;
  document.getElementById("detail-phone").textContent =
    transaction.passenger_phone;
  document.getElementById("detail-booking-date").textContent =
    transaction.booking_date;
  document.getElementById("detail-type").textContent = transaction.travel_type;
  document.getElementById("detail-flight-number").textContent =
    transaction.flight_number || "-";
  document.getElementById(
    "detail-route"
  ).textContent = `${transaction.departure} - ${transaction.arrival}`;
  document.getElementById("detail-travel-date").textContent =
    transaction.travel_date;
  document.getElementById("detail-adult-price").textContent = `Rp ${parseInt(
    transaction.adult_price
  ).toLocaleString("id-ID")}`;
  document.getElementById("detail-infant-price").textContent = `Rp ${parseInt(
    transaction.infant_price
  ).toLocaleString("id-ID")}`;
  document.getElementById("detail-amount").textContent = `Rp ${parseInt(
    transaction.total_amount
  ).toLocaleString("id-ID")}`;
  detailModal.classList.add("active");
}

function hideModal() {
  detailModal.classList.remove("active");
}

// --- NAVIGASI ---
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetPage = link.getAttribute("data-page");
    showPage(targetPage);
  });
});

function showPage(pageId) {
  pages.forEach((page) => page.classList.remove("active"));
  navLinks.forEach((link) => link.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  document.querySelector(`[data-page="${pageId}"]`).classList.add("active");
}

// --- DASHBOARD ---
async function updateDashboard() {
  const now = new Date();
  const report = await window.electronAPI.getMonthlyReport(
    now.getFullYear(),
    now.getMonth() + 1
  );
  document.getElementById("totalPassengersThisMonth").textContent =
    report.totalPassengers || 0;
  document.getElementById("totalRevenueThisMonth").textContent = `Rp ${(
    report.totalRevenue || 0
  ).toLocaleString("id-ID")}`;
}

// --- TRANSAKSI ---
const transactionForm = document.getElementById("transactionForm");
const adultPriceInput = document.getElementById("adultPrice");
const infantPriceInput = document.getElementById("infantPrice");
const totalAmountInput = document.getElementById("totalAmount");

function calculateTotal() {
  const adult = parseInt(adultPriceInput.value) || 0;
  const infant = parseInt(infantPriceInput.value) || 0;
  const amount = adult - infant;
  totalAmountInput.value = amount.toLocaleString("id-ID");
}
adultPriceInput.addEventListener("input", calculateTotal);
infantPriceInput.addEventListener("input", calculateTotal);

transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const adult = parseInt(adultPriceInput.value) || 0;
  const infant = parseInt(infantPriceInput.value) || 0;
  const amount = adult - infant;

  const newTransaction = {
    passengerName: document.getElementById("passengerName").value,
    passengerPhone: document.getElementById("passengerPhone").value,
    bookingDate: document.getElementById("bookingDate").value,
    travelType: document.getElementById("travelType").value,
    flightNumber: document.getElementById("flightNumber").value,
    departure: document.getElementById("departure").value,
    arrival: document.getElementById("arrival").value,
    travelDate: document.getElementById("travelDate").value,
    adultPrice: adultPriceInput.value,
    infantPrice: infantPriceInput.value,
    totalAmount: amount,
    cost_price: 0, // Tetap 0
    profit: 0, // Tetap 0
  };

  await window.electronAPI.addTransaction(newTransaction);
  transactionForm.reset();
  totalAmountInput.value = "";
  alert("Transaksi berhasil disimpan!");
  updateDashboard();
  displayAllData();
});

// --- DATA TABLE (DENGAN PENCARIAN & FILTER) ---
async function displayFilteredData() {
  const searchTerm = searchInput.value.toLowerCase();
  const filterValue = filterType.value;
  let transactions = await window.electronAPI.getAllTransactions();

  // Lakukan filter
  transactions = transactions.filter((trans) => {
    const matchesSearch =
      searchTerm === "" ||
      trans.passenger_name.toLowerCase().includes(searchTerm) ||
      `${trans.departure} - ${trans.arrival}`
        .toLowerCase()
        .includes(searchTerm) ||
      (trans.flight_number &&
        trans.flight_number.toLowerCase().includes(searchTerm));

    const matchesFilter =
      filterValue === "all" || trans.travel_type === filterValue;

    return matchesSearch && matchesFilter;
  });

  // Tampilkan data yang sudah difilter
  const dataBody = document.getElementById("dataBody");
  dataBody.innerHTML = "";
  if (transactions.length === 0) {
    dataBody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Tidak ada data yang cocok dengan filter.</td></tr>';
    return;
  }

  transactions.forEach((trans, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${trans.booking_date}</td>
            <td>${trans.travel_date}</td>
            <td>${trans.passenger_name}</td>
            <td>${trans.departure} - ${trans.arrival}</td>
            <td>${trans.flight_number || "-"}</td>
            <td>
                <button class="view-btn" data-id="${trans.id}">Lihat</button>
                <button class="delete-btn" data-id="${trans.id}">Hapus</button>
            </td>
        `;
    dataBody.appendChild(row);
  });
}

// Fungsi ini sekarang hanya untuk mereset filter dan menampilkan semua data
async function displayAllData() {
  searchInput.value = "";
  filterType.value = "all";
  await displayFilteredData();
}

document.getElementById("dataBody").addEventListener("click", async (e) => {
  const id = e.target.getAttribute("data-id");
  if (e.target.classList.contains("delete-btn")) {
    if (confirm("Hapus data ini?")) {
      await window.electronAPI.deleteTransaction(id);
      displayAllData();
      updateDashboard();
    }
  }
  if (e.target.classList.contains("view-btn")) {
    const transactions = await window.electronAPI.getAllTransactions();
    const transaction = transactions.find((t) => t.id == id);
    if (transaction) {
      showModal(transaction);
    }
  }
});

// --- LAPORAN ---
const reportContent = document.getElementById("reportContent");
document
  .getElementById("generateReportBtn")
  .addEventListener("click", async () => {
    const monthYear = document.getElementById("reportMonth").value;
    if (!monthYear) {
      alert("Pilih bulan dan tahun terlebih dahulu!");
      return;
    }
    const [year, month] = monthYear.split("-");
    const reportCategory = document.getElementById("reportCategory").value;
    const report = await window.electronAPI.getMonthlyReportByType(
      year,
      month,
      reportCategory
    );
    const transactions = await window.electronAPI.getMonthlyTransactionsByType(
      year,
      month,
      reportCategory
    );

    const categoryText =
      reportCategory === "all" ? "Semua Kategori" : reportCategory;
    reportContent.innerHTML = `
        <h3>Laporan Bulan: ${new Date(year, month - 1).toLocaleString("id-ID", {
          month: "long",
          year: "numeric",
        })}</h3>
        <h4>Kategori: ${categoryText}</h4>
        <div class="report-summary">
            <p><strong>Total Pendapatan:</strong> Rp ${(
              report.totalRevenue || 0
            ).toLocaleString("id-ID")}</p>
            <p><strong>Total Harga Pokok:</strong> Rp ${(
              report.totalCost || 0
            ).toLocaleString("id-ID")}</p>
            <p><strong>Laba Kotor:</strong> Rp ${(
              report.totalProfit || 0
            ).toLocaleString("id-ID")}</p>
            <p><strong>Total Penumpang:</strong> ${
              report.totalPassengers || 0
            }</p>
        </div>
        <div class="table-wrapper">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Tgl Booking</th>
                        <th>Tgl Berangkat</th>
                        <th>Nama</th>
                        <th>Rute</th>
                        <th>Transportasi</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions
                      .map(
                        (t, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${t.booking_date}</td>
                            <td>${t.travel_date}</td>
                            <td>${t.passenger_name}</td>
                            <td>${t.departure} - ${t.arrival}</td>
                            <td>${t.flight_number || "-"}</td>
                            <td>Rp ${t.total_amount.toLocaleString(
                              "id-ID"
                            )}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;
  });
document.getElementById("printReportBtn").addEventListener("click", () => {
  if (reportContent.innerHTML === "") {
    alert("Generate laporan terlebih dahulu!");
    return;
  }
  window.print();
});
document
  .getElementById("exportExcelBtn")
  .addEventListener("click", async () => {
    const monthYear = document.getElementById("reportMonth").value;
    if (!monthYear) {
      alert("Pilih bulan/tahun!");
      return;
    }
    const [year, month] = monthYear.split("-");
    const reportCategory = document.getElementById("reportCategory").value;
    const transactions = await window.electronAPI.getMonthlyTransactionsByType(
      year,
      month,
      reportCategory
    );
    const result = await window.electronAPI.exportToExcel(
      transactions,
      "Laporan Bulanan"
    );
    if (result.success) {
      alert("Data berhasil diekspor!");
    } else {
      alert("Gagal mengekspor: " + (result.error || "Unknown error"));
    }
  });

// --- PENGATURAN ---
document.getElementById("exportDataBtn").addEventListener("click", async () => {
  const transactions = await window.electronAPI.getAllTransactions();
  const result = await window.electronAPI.exportToExcel(
    transactions,
    "Semua Data"
  );
  if (result.success) {
    alert("Semua data berhasil diekspor!");
  } else {
    alert("Gagal mengekspor: " + (result.error || "Unknown error"));
  }
});
document.getElementById("backupDbBtn").addEventListener("click", async () => {
  const result = await window.electronAPI.backupDatabase();
  if (result.success) {
    alert("Database berhasil di-backup!");
  } else {
    alert("Gagal mem-backup: " + (result.error || "Unknown error"));
  }
});
document.getElementById("restoreDbBtn").addEventListener("click", async () => {
  const result = await window.electronAPI.restoreDatabase();
  if (result.success) {
    alert("Database berhasil di-restore! Aplikasi akan dimuat ulang.");
    location.reload();
  } else {
    alert("Gagal me-restore: " + (result.error || "Unknown error"));
  }
});

// --- INISIALISASI ---
window.onload = async () => {
  updateTransportField();
  document
    .getElementById("travelType")
    .addEventListener("change", updateTransportField);

  // Event listener untuk modal
  modalCloseBtn.addEventListener("click", hideModal);
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      hideModal();
    }
  });

  // Event listener untuk pencarian dan filter
  searchInput.addEventListener("input", displayFilteredData);
  filterType.addEventListener("change", displayFilteredData);
  resetFilterBtn.addEventListener("click", displayAllData);

  // Fungsi lainnya
  updateDashboard();
  displayAllData();
  document.getElementById("reportMonth").value = new Date()
    .toISOString()
    .slice(0, 7);
};
