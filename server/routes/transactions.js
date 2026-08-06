import express from "express";
import Transaction from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { type, amount, category, name, note, date } = req.body;
    if (!type || !amount || !category || !name || !date) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin giao dịch." });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      name,
      note: note || "",
      date,
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

export default router;
