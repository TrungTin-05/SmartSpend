import express from "express";
import MonthlyBudget from "../models/MonthlyBudget.js";
import Transaction from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

function parsePeriod(month, year) {
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return { error: "Tháng phải nằm trong khoảng từ 1 đến 12." };
  }
  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    return { error: "Năm không hợp lệ." };
  }
  return { month: parsedMonth, year: parsedYear };
}

function parseAmount(amount) {
  const parsedAmount = Number(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return { error: "Ngân sách tổng phải là số nguyên lớn hơn 0." };
  }
  return { amount: parsedAmount };
}

async function getSpentAmount(userId, month, year) {
  const transactions = await Transaction.findAll({
    where: { userId, type: "expense" },
    attributes: ["amount", "date"],
  });

  return transactions
    .filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;
    })
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0);
}

async function serializeMonthlyBudget(monthlyBudget) {
  const budgetAmount = Number(monthlyBudget.amount);
  const spentAmount = await getSpentAmount(monthlyBudget.userId, monthlyBudget.month, monthlyBudget.year);
  return {
    ...monthlyBudget.toJSON(),
    budgetAmount,
    spentAmount,
    remainingAmount: budgetAmount - spentAmount,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    const period = parsePeriod(
      req.query.month || now.getMonth() + 1,
      req.query.year || now.getFullYear()
    );
    if (period.error) {
      return res.status(400).json({ message: period.error });
    }

    const monthlyBudget = await MonthlyBudget.findOne({
      where: { userId: req.user.id, month: period.month, year: period.year },
    });
    if (!monthlyBudget) {
      return res.json(null);
    }
    res.json(await serializeMonthlyBudget(monthlyBudget));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const period = parsePeriod(req.body.month, req.body.year);
    const amount = parseAmount(req.body.amount);
    if (period.error || amount.error) {
      return res.status(400).json({ message: period.error || amount.error });
    }

    const duplicate = await MonthlyBudget.findOne({
      where: { userId: req.user.id, month: period.month, year: period.year },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Ngân sách tổng cho tháng này đã tồn tại." });
    }

    const monthlyBudget = await MonthlyBudget.create({
      userId: req.user.id,
      month: period.month,
      year: period.year,
      amount: amount.amount,
    });
    res.status(201).json(await serializeMonthlyBudget(monthlyBudget));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const period = parsePeriod(req.body.month, req.body.year);
    const amount = parseAmount(req.body.amount);
    if (period.error || amount.error) {
      return res.status(400).json({ message: period.error || amount.error });
    }

    const monthlyBudget = await MonthlyBudget.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!monthlyBudget) {
      return res.status(404).json({ message: "Không tìm thấy ngân sách tổng." });
    }

    const duplicate = await MonthlyBudget.findOne({
      where: { userId: req.user.id, month: period.month, year: period.year },
    });
    if (duplicate && duplicate.id !== monthlyBudget.id) {
      return res.status(409).json({ message: "Ngân sách tổng cho tháng này đã tồn tại." });
    }

    await monthlyBudget.update({ month: period.month, year: period.year, amount: amount.amount });
    res.json(await serializeMonthlyBudget(monthlyBudget));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedCount = await MonthlyBudget.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deletedCount) {
      return res.status(404).json({ message: "Không tìm thấy ngân sách tổng." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
