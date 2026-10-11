const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

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
  const id = req.query.id;
  // Chan path traversal: id chi duoc chua chu/so/gach ngang, khop ten file thuc.
  if (typeof id !== "string" || !/^[a-z0-9-]+$/.test(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }
  const filePath = path.join(TEMPLATES_DIR, `${id}.json`);
  if (!filePath.startsWith(TEMPLATES_DIR) || !fs.existsSync(filePath)) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  try {
    const template = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.status(200).json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      thumbnail: toAbsoluteUrl(req, template.thumbnail),
      updatedAt: template.updatedAt,
      graph: template.graph,
    });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: String(err && err.message) });
  }
};
