// api/health.js
module.exports = async (req, res) => {
  try {
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
