import express from "express";
import Transaction from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

function validateTransactionInput({ type, amount, category, name, date }) {
  if (!['income', 'expense'].includes(type)) {
    return 'Loại giao dịch không hợp lệ.';
  }

  if (!name?.trim() || !category?.trim() || !date) {
    return 'Vui lòng điền đầy đủ thông tin giao dịch.';
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return 'Số tiền phải lớn hơn 0.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) {
    return 'Ngày giao dịch không hợp lệ.';
  }

  return null;
}

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
    const validationError = validateTransactionInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
      category: category.trim(),
      name: name.trim(),
      note: note || "",
      date,
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const validationError = validateTransactionInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    const { type, amount, category, name, note, date } = req.body;
    await transaction.update({
      type,
      amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
      category: category.trim(),
      name: name.trim(),
      note: note || "",
      date,
    });

    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedCount = await Transaction.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deletedCount) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
