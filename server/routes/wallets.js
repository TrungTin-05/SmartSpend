import express from "express";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const walletTypes = ["cash", "bank", "e_wallet", "card", "other"];

router.use(authMiddleware);

function validateWalletInput({ name, type, initialBalance }) {
  const normalizedName = name?.trim();
  if (!normalizedName) {
    return { error: "Tên ví không được để trống." };
  }
  if (normalizedName.length > 100) {
    return { error: "Tên ví không được vượt quá 100 ký tự." };
  }
  if (type && !walletTypes.includes(type)) {
    return { error: "Loại ví không hợp lệ." };
  }
  if (initialBalance !== undefined && (!Number.isInteger(Number(initialBalance)) || Number(initialBalance) < 0)) {
    return { error: "Số dư ban đầu phải là số nguyên không âm." };
  }
  return { name: normalizedName, type: type || "other", initialBalance: Number(initialBalance || 0) };
}

async function findDuplicateWallet(userId, name, excludedId = null) {
  const wallets = await Wallet.findAll({ where: { userId }, attributes: ["id", "name"] });
  return wallets.find(
    (wallet) => wallet.id !== excludedId && wallet.name.toLowerCase() === name.toLowerCase()
  );
}

router.get("/", async (req, res, next) => {
  try {
    const wallets = await Wallet.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "ASC"], ["name", "ASC"]],
    });
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      attributes: ["walletId", "type", "amount"],
    });
    const totalsByWallet = new Map();

    transactions.forEach((transaction) => {
      if (!transaction.walletId) return;

      const totals = totalsByWallet.get(transaction.walletId) || { incomeTotal: 0, expenseTotal: 0 };
      if (transaction.type === "income") {
        totals.incomeTotal += Math.abs(Number(transaction.amount));
      } else if (transaction.type === "expense") {
        totals.expenseTotal += Math.abs(Number(transaction.amount));
      }
      totalsByWallet.set(transaction.walletId, totals);
    });

    const response = wallets.map((wallet) => {
      const totals = totalsByWallet.get(wallet.id) || { incomeTotal: 0, expenseTotal: 0 };
      const initialBalance = Number(wallet.initialBalance || 0);
      return {
        ...wallet.toJSON(),
        incomeTotal: totals.incomeTotal,
        expenseTotal: totals.expenseTotal,
        balance: initialBalance + totals.incomeTotal - totals.expenseTotal,
      };
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = validateWalletInput(req.body);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    if (await findDuplicateWallet(req.user.id, result.name)) {
      return res.status(409).json({ message: "Ví này đã tồn tại." });
    }

    const wallet = await Wallet.create({
      userId: req.user.id,
      name: result.name,
      type: result.type,
      initialBalance: result.initialBalance,
    });
    res.status(201).json(wallet);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const result = validateWalletInput(req.body);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const wallet = await Wallet.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({ message: "Không tìm thấy ví." });
    }
    if (await findDuplicateWallet(req.user.id, result.name, wallet.id)) {
      return res.status(409).json({ message: "Ví này đã tồn tại." });
    }

    await wallet.update({
      name: result.name,
      type: result.type,
      initialBalance: result.initialBalance,
    });
    res.json(wallet);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({ message: "Không tìm thấy ví." });
    }

    const transaction = await Transaction.findOne({
      where: { userId: req.user.id, walletId: wallet.id },
    });
    if (transaction) {
      return res.status(409).json({
        message: "Không thể xóa ví đang được sử dụng bởi giao dịch.",
      });
    }

    await wallet.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { walletTypes };
export default router;
