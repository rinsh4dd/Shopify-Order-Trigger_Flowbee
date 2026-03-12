import fs from "fs";
import path from "path";

/**
 * Logs data to a local file.
 * @param {string} message - The message or data to log.
 * @param {string} [filename='orders.log'] - The filename to save the log.
 */
export function logToFile(message, filename = "orders.log") {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logPath = path.join(logDir, filename);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${typeof message === "object" ? JSON.stringify(message, null, 2) : message}\n---\n`;

  fs.appendFileSync(logPath, logEntry, "utf8");
}
