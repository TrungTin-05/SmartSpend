import express from "express";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const defaultExpenseCategories = ["Ăn uống", "Di chuyển", "Giải trí", "Khác"];
const defaultIncomeCategories = ["Lương"];

router.use(authMiddleware);

function validateCategoryName(name) {
  const normalizedName = name?.trim();
  if (!normalizedName) {
    return { error: "Tên danh mục không được để trống." };
  }
  if (normalizedName.length > 100) {
    return { error: "Tên danh mục không được vượt quá 100 ký tự." };
  }
  return { name: normalizedName };
}

async function ensureDefaultExpenseCategories(userId) {
  const count = await Category.count({ where: { userId, type: "expense" } });
  if (count > 0) {
    return;
  }

  await Category.bulkCreate(
    defaultExpenseCategories.map((name) => ({ userId, name, type: "expense" }))
  );
}

async function ensureDefaultIncomeCategories(userId) {
  const count = await Category.count({ where: { userId, type: "income" } });
  if (count > 0) {
    return;
  }

  await Category.bulkCreate(
    defaultIncomeCategories.map((name) => ({ userId, name, type: "income" }))
  );
}

router.get("/", async (req, res, next) => {
  try {
    const type = req.query.type || "expense";
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Loại danh mục không hợp lệ." });
    }

    if (type === "expense") {
      await ensureDefaultExpenseCategories(req.user.id);
    } else {
      await ensureDefaultIncomeCategories(req.user.id);
    }

    const categories = await Category.findAll({
      where: { userId: req.user.id, type },
      order: [["name", "ASC"]],
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, type = "expense" } = req.body;
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Loại danh mục không hợp lệ." });
    }

    const result = validateCategoryName(name);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const existingCategories = await Category.findAll({
      where: { userId: req.user.id, type },
      attributes: ["name"],
    });
    const existingCategory = existingCategories.find(
      (category) => category.name.toLowerCase() === result.name.toLowerCase()
    );
    if (existingCategory) {
      return res.status(409).json({ message: "Danh mục này đã tồn tại." });
    }

    const category = await Category.create({
      userId: req.user.id,
      name: result.name,
      type,
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const result = validateCategoryName(req.body.name);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục." });
    }

    const otherCategories = await Category.findAll({
      where: { userId: req.user.id, type: category.type },
      attributes: ["id", "name"],
    });
    const duplicate = otherCategories.find(
      (item) => item.id !== category.id && item.name.toLowerCase() === result.name.toLowerCase()
    );
    if (duplicate && duplicate.id !== category.id) {
      return res.status(409).json({ message: "Danh mục này đã tồn tại." });
    }

    const previousName = category.name;
    await category.update({ name: result.name });
    await Transaction.update(
      { category: result.name },
      {
        where: {
          userId: req.user.id,
          type: category.type,
          category: previousName,
        },
      }
    );

    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục." });
    }

    const transactionInUse = await Transaction.findOne({
      where: {
        userId: req.user.id,
        type: category.type,
        category: category.name,
      },
    });
    if (transactionInUse) {
      return res.status(409).json({
        message: "Không thể xóa danh mục đang được sử dụng bởi giao dịch.",
      });
    }

    await category.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
