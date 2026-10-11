const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

function readAllTemplates() {
  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8");
    return JSON.parse(raw);
  });
}

function toAbsoluteUrl(req, thumbnailPath) {
  if (!thumbnailPath || /^https?:\/\//.test(thumbnailPath)) {
    return thumbnailPath || "";
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}${thumbnailPath}`;
}

module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  try {
    const templates = readAllTemplates();
    const meta = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      thumbnail: toAbsoluteUrl(req, t.thumbnail),
      updatedAt: t.updatedAt,
    }));
    res.status(200).json(meta);
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: String(err && err.message) });
  }
};
