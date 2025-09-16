// server/src/routes/support.route.ts
import { Router } from "express";
const router = Router();

router.post("/contact", async (req, res) => {
  const { name, email, phone, subject, department, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  // TODO: send email or store in DB
  console.log("Contact message:", { name, email, phone, subject, department, message });
  return res.json({ ok: true });
});
export default router;
