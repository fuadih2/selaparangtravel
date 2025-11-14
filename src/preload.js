// src/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // --- Fungsi Database ---
  getAllTransactions: () => ipcRenderer.invoke("get-all-transactions"),
  addTransaction: (transaction) =>
    ipcRenderer.invoke("add-transaction", transaction),
  deleteTransaction: (id) => ipcRenderer.invoke("delete-transaction", id),
  getMonthlyReport: (year, month) =>
    ipcRenderer.invoke("get-monthly-report", year, month),
  getMonthlyTransactions: (year, month) =>
    ipcRenderer.invoke("get-monthly-transactions", year, month),
  // --- Fungsi Database Berdasarkan Kategori (BARU) ---
  getMonthlyReportByType: (year, month, travelType) =>
    ipcRenderer.invoke("get-monthly-report-by-type", year, month, travelType),
  getMonthlyTransactionsByType: (year, month, travelType) =>
    ipcRenderer.invoke(
      "get-monthly-transactions-by-type",
      year,
      month,
      travelType
    ),

  // --- Fungsi Dialog ---
  showSaveDialog: () => ipcRenderer.invoke("show-save-dialog"),
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),

  // --- Fungsi Export & Backup ---
  getDbPath: () => ipcRenderer.invoke("get-db-path"),
  exportToExcel: (data, sheetName) =>
    ipcRenderer.invoke("export-to-excel", data, sheetName),
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  restoreDatabase: () => ipcRenderer.invoke("restore-database"),
});
