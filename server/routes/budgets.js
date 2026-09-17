import express from "express";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
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

function validateAmount(amount) {
  const parsedAmount = Number(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return { error: "Ngân sách phải là số nguyên lớn hơn 0." };
  }
  return { amount: parsedAmount };
}

function normalizeCategoryName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

async function findExpenseCategory(userId, categoryId) {
  return Category.findOne({
    where: { id: categoryId, userId, type: "expense" },
  });
}

function calculateSpent(transactions, categoryName, month, year) {
  return transactions
    .filter((transaction) => {
      const date = new Date(transaction.date);
      return (
        normalizeCategoryName(transaction.category) === normalizeCategoryName(categoryName) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month
      );
    })
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0);
}

async function serializeBudgets(userId, budgets) {
  const transactions = await Transaction.findAll({
    where: { userId, type: "expense" },
    attributes: ["category", "amount", "date"],
  });

  return budgets.map((budget) => {
    const categoryName = budget.category?.name || "";
    const spentAmount = calculateSpent(transactions, categoryName, budget.month, budget.year);
    const amount = Number(budget.amount);
    return {
      ...budget.toJSON(),
      category: budget.category,
      spentAmount,
      remainingAmount: amount - spentAmount,
      usagePercent: amount > 0 ? Math.round((spentAmount / amount) * 100) : 0,
    };
  });
}

const budgetInclude = [{
  model: Category,
  as: "category",
  attributes: ["id", "name", "type"],
}];

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

    const budgets = await Budget.findAll({
      where: { userId: req.user.id, month: period.month, year: period.year },
      include: budgetInclude,
      order: [["createdAt", "ASC"]],
    });
    res.json(await serializeBudgets(req.user.id, budgets));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { categoryId, month, year, amount } = req.body;
    const period = parsePeriod(month, year);
    const validatedAmount = validateAmount(amount);
    if (period.error || validatedAmount.error) {
      return res.status(400).json({ message: period.error || validatedAmount.error });
    }

    const category = await findExpenseCategory(req.user.id, categoryId);
    if (!category) {
      return res.status(400).json({ message: "Chỉ được lập ngân sách cho danh mục chi tiêu của bạn." });
    }

    const duplicate = await Budget.findOne({
      where: { userId: req.user.id, categoryId, month: period.month, year: period.year },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Ngân sách cho danh mục và tháng này đã tồn tại." });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      categoryId,
      month: period.month,
      year: period.year,
      amount: validatedAmount.amount,
    });
    await budget.reload({ include: budgetInclude });
    res.status(201).json((await serializeBudgets(req.user.id, [budget]))[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { categoryId, month, year, amount } = req.body;
    const period = parsePeriod(month, year);
    const validatedAmount = validateAmount(amount);
    if (period.error || validatedAmount.error) {
      return res.status(400).json({ message: period.error || validatedAmount.error });
    }

    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) {
      return res.status(404).json({ message: "Không tìm thấy ngân sách." });
    }

    const category = await findExpenseCategory(req.user.id, categoryId);
    if (!category) {
      return res.status(400).json({ message: "Chỉ được lập ngân sách cho danh mục chi tiêu của bạn." });
    }

    const duplicate = await Budget.findOne({
      where: { userId: req.user.id, categoryId, month: period.month, year: period.year },
    });
    if (duplicate && duplicate.id !== budget.id) {
      return res.status(409).json({ message: "Ngân sách cho danh mục và tháng này đã tồn tại." });
    }

    await budget.update({
      categoryId,
      month: period.month,
      year: period.year,
      amount: validatedAmount.amount,
    });
    await budget.reload({ include: budgetInclude });
    res.json((await serializeBudgets(req.user.id, [budget]))[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedCount = await Budget.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deletedCount) {
      return res.status(404).json({ message: "Không tìm thấy ngân sách." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
