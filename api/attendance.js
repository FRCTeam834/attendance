export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json([]);
  }
  if (req.method === "POST") {
    try {
      const { name, action } = req.body || {};
      if (!name || !action) {
        return res.status(400).json({ error: "Missing name or action" });
      }
      return res.status(200).json({ message: `${name} ${action} recorded` });
    } catch (e) {
      return res.status(500).json({ error: "Bad JSON body" });
    }
  }
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}
