const fs = require("node:fs");
const path = require("node:path");

const docsDir = path.resolve(__dirname, "../../docs");
const indexPath = path.join(docsDir, "index.html");
const notFoundPath = path.join(docsDir, "404.html");

fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
}
