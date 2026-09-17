import express from "express";
import { Op } from "sequelize";
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

router.get("/monthly-expenses", async (req, res, next) => {
  try {
    const now = new Date();
    const period = parsePeriod(
      req.query.month || now.getMonth() + 1,
      req.query.year || now.getFullYear()
    );
    if (period.error) {
      return res.status(400).json({ message: period.error });
    }

    const monthText = String(period.month).padStart(2, "0");
    const firstDay = `${period.year}-${monthText}-01`;
    const lastDay = new Date(Date.UTC(period.year, period.month, 0))
      .toISOString()
      .slice(0, 10);
    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.between]: [firstDay, lastDay] },
      },
      attributes: ["type", "amount", "category", "date"],
    });
    const expenseTotals = new Map();
    let totalExpense = 0;
    let totalIncome = 0;

    transactions.forEach((transaction) => {
      const amount = Math.abs(Number(transaction.amount));
      if (transaction.type === "expense") {
        totalExpense += amount;
        expenseTotals.set(
          transaction.category,
          (expenseTotals.get(transaction.category) || 0) + amount
        );
      } else if (transaction.type === "income") {
        totalIncome += amount;
      }
    });

    const categories = Array.from(expenseTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 10000) / 100 : 0,
      }))
      .sort((left, right) => right.amount - left.amount);

    res.json({
      month: period.month,
      year: period.year,
      totalExpense,
      totalIncome,
      difference: totalIncome - totalExpense,
      categories,
      transactionCount: transactions.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
