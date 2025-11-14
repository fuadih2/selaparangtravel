// src/database.js
const Database = require("better-sqlite3");
const path = require("path");

let db;

function initializeDatabase(userDataPath) {
  try {
    const dbPath = path.join(userDataPath, "travel_manager.db");
    db = new Database(dbPath);
    db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                passenger_name TEXT NOT NULL,
                passenger_phone TEXT,
                booking_date TEXT NOT NULL,         -- KOLOM BARU
                travel_type TEXT,
                flight_number TEXT,                  -- KOLOM BARU
                departure TEXT,
                arrival TEXT,
                travel_date TEXT NOT NULL,
                adult_price INTEGER,
                infant_price INTEGER,
                total_amount INTEGER NOT NULL,
                cost_price INTEGER NOT NULL,
                profit INTEGER,
                created_at TEXT NOT NULL
            );
        `);
    console.log("Database initialized successfully at:", dbPath);
    return true;
  } catch (error) {
    console.error("Error initializing database:", error.message);
    return false;
  }
}

function addTransaction(transaction) {
  const stmt = db.prepare(`
        INSERT INTO transactions (
            passenger_name, passenger_phone, booking_date, travel_type, flight_number,
            departure, arrival, travel_date, adult_price, infant_price, total_amount, cost_price, profit, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
  return stmt.run(
    transaction.passengerName,
    transaction.passengerPhone,
    transaction.bookingDate,
    transaction.travelType,
    transaction.flightNumber,
    transaction.departure,
    transaction.arrival,
    transaction.travelDate,
    transaction.adultPrice,
    transaction.infantPrice,
    transaction.totalAmount,
    transaction.cost_price,
    transaction.profit
  );
}

function getAllTransactions() {
  return db
    .prepare("SELECT * FROM transactions ORDER BY created_at DESC")
    .all();
}

function deleteTransaction(id) {
  return db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
}

function getMonthlyReport(year, month) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  const stmt = db.prepare(`
        SELECT SUM(total_amount) as totalRevenue, SUM(cost_price) as totalCost,
               SUM(profit) as totalProfit, COUNT(*) as totalPassengers
        FROM transactions WHERE travel_date BETWEEN ? AND ?
    `);
  return stmt.get(startDate, endDate);
}

function getMonthlyTransactions(year, month) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  return db
    .prepare(
      `
        SELECT * FROM transactions
        WHERE travel_date BETWEEN ? AND ?
        ORDER BY travel_date ASC
    `
    )
    .all(startDate, endDate);
}

// ... fungsi lainnya ...

// --- FUNGSI LAPORAN BERDASARKAN KATEGORI (BARU) ---
function getMonthlyReportByType(year, month, travelType) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  let query = `
        SELECT SUM(total_amount) as totalRevenue, SUM(cost_price) as totalCost,
               SUM(profit) as totalProfit, COUNT(*) as totalPassengers
        FROM transactions WHERE travel_date BETWEEN ? AND ?
    `;
  let params = [startDate, endDate];

  // Jika kategori bukan 'all', tambahkan filter
  if (travelType !== "all") {
    query += ` AND travel_type = ?`;
    params.push(travelType);
  }

  const stmt = db.prepare(query);
  return stmt.get(...params);
}

function getMonthlyTransactionsByType(year, month, travelType) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  let query = `
        SELECT * FROM transactions
        WHERE travel_date BETWEEN ? AND ?
    `;
  let params = [startDate, endDate];

  // Jika kategori bukan 'all', tambahkan filter
  if (travelType !== "all") {
    query += ` AND travel_type = ?`;
    params.push(travelType);
  }

  query += ` ORDER BY travel_date ASC`;

  return db.prepare(query).all(...params);
}

module.exports = {
  initializeDatabase,
  addTransaction,
  getAllTransactions,
  deleteTransaction,
  getMonthlyReport,
  getMonthlyTransactions,
  getMonthlyReportByType, // Export fungsi baru
  getMonthlyTransactionsByType, // Export fungsi baru
};
