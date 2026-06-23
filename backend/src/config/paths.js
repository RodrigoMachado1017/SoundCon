const path = require("path");
const fs = require("fs");

const backendRoot = path.join(__dirname, "..", "..");
const uploadsDir = path.join(backendRoot, "uploads");
const outputDir = path.join(backendRoot, "output");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

module.exports = {
  backendRoot,
  uploadsDir,
  outputDir,
};
