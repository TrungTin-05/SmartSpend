import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "smartspend-secret";
const JWT_EXPIRES_IN = "7d";
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được đăng ký." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      preferences: { theme: "light", startupPage: "/dashboard" },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        preferences: user.preferences,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu." });
    }

    const user = await User.findOne({ where: { email: normalizeEmail(email) } });
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        preferences: user.preferences,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const response = {
      message: "Nếu tài khoản tồn tại, hướng dẫn khôi phục đã được tạo.",
    };

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Vui lòng nhập email." });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.json(response);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await user.update({
      resetPasswordTokenHash: hashResetToken(resetToken),
      resetPasswordExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    if (process.env.NODE_ENV !== "production") {
      response.developmentResetUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}/reset-password?token=${resetToken}`;
      response.developmentOnly = true;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token và mật khẩu mới là bắt buộc." });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự." });
    }

    const user = await User.findOne({
      where: { resetPasswordTokenHash: hashResetToken(token) },
    });
    if (!user || !user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt) <= new Date()) {
      return res.status(400).json({ message: "Token khôi phục không hợp lệ hoặc đã hết hạn." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await user.update({
      passwordHash,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
    });

    res.json({ message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới." });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["passwordHash"] },
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
