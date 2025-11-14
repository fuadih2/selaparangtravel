// main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const dbFunctions = require("./src/database");
const XLSX = require("xlsx");
const fs = require("fs");

require("@electron/remote/main").initialize();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  require("@electron/remote/main").enable(mainWindow.webContents);
  mainWindow.loadFile("src/index.html");
  // mainWindow.webContents.openDevTools(); // Buka untuk debugging
}

app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");
  if (dbFunctions.initializeDatabase(userDataPath)) {
    createWindow();
  } else {
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- IPC Handlers: Database ---
ipcMain.handle("get-all-transactions", () => dbFunctions.getAllTransactions());
ipcMain.handle("add-transaction", (event, transaction) =>
  dbFunctions.addTransaction(transaction)
);
ipcMain.handle("delete-transaction", (event, id) =>
  dbFunctions.deleteTransaction(id)
);
ipcMain.handle("get-monthly-report", (event, year, month) =>
  dbFunctions.getMonthlyReport(year, month)
);
ipcMain.handle("get-monthly-transactions", (event, year, month) =>
  dbFunctions.getMonthlyTransactions(year, month)
);

// --- IPC Handlers untuk Laporan Berdasarkan Kategori (BARU) ---
ipcMain.handle("get-monthly-report-by-type", (event, year, month, travelType) =>
  dbFunctions.getMonthlyReportByType(year, month, travelType)
);
ipcMain.handle(
  "get-monthly-transactions-by-type",
  (event, year, month, travelType) =>
    dbFunctions.getMonthlyTransactionsByType(year, month, travelType)
);

// --- IPC Handlers: Fungsi Export & Backup (SUDAH DIPERBAIKI) ---

ipcMain.handle("export-to-excel", async (event, data, sheetName) => {
  // PERBAIKAN: Tangkap objek hasil dialog dengan benar
  const result = await dialog.showSaveDialog({
    filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
  });
  // PERBAIKAN: Ambil properti 'filePath' dari objek
  const filePath = result.filePath;
  if (!filePath) return { success: false }; // User membatalkan dialog

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filePath);
    return { success: true };
  } catch (error) {
    console.error("Export to Excel failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("backup-database", async () => {
  const dbPath = path.join(app.getPath("userData"), "travel_manager.db");
  // PERBAIKAN: Tangkap objek hasil dialog dengan benar
  const result = await dialog.showSaveDialog({
    filters: [{ name: "Database Files", extensions: ["db"] }],
    defaultPath: "travel_manager_backup.db",
  });
  const filePath = result.filePath;
  if (!filePath) return { success: false };

  try {
    fs.copyFileSync(dbPath, filePath);
    return { success: true };
  } catch (error) {
    console.error("Backup failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("restore-database", async () => {
  const dbPath = path.join(app.getPath("userData"), "travel_manager.db");
  // PERBAIKAN: Tangkap objek hasil dialog dengan benar
  const result = await dialog.showOpenDialog({
    filters: [{ name: "Database Files", extensions: ["db"] }],
    properties: ["openFile"],
  });
  // PERBAIKAN: Periksa apakah user membatalkan
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { success: false };
  }
  const filePath = result.filePaths[0];

  try {
    fs.copyFileSync(filePath, dbPath);
    return { success: true };
  } catch (error) {
    console.error("Restore failed:", error);
    return { success: false, error: error.message };
  }
});

// --- Handler untuk mendapatkan path database (tidak perlu perubahan) ---
ipcMain.handle("get-db-path", () =>
  path.join(app.getPath("userData"), "travel_manager.db")
);
