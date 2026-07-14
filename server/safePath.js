const path = require("path");

function normalizeForCompare(value) {
  return process.platform === "win32" ? value.toLowerCase() : value;
}

function safeResolve(rootDir, ...parts) {
  const root = path.resolve(rootDir);
  const target = path.resolve(root, ...parts);
  const rootCheck = normalizeForCompare(root);
  const targetCheck = normalizeForCompare(target);
  const rootWithSep = rootCheck.endsWith(path.sep) ? rootCheck : rootCheck + path.sep;

  if (targetCheck !== rootCheck && !targetCheck.startsWith(rootWithSep)) {
    return null;
  }

  return target;
}

module.exports = {
  safeResolve,
};
