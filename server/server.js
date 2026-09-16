import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ override: true });
import connectDB from "./config/db.js";
import "./models/Category.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import transactionRoutes from "./routes/transactions.js";

const app = express();
connectDB();

const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SmartSpend backend running on http://localhost:${PORT}`);
});
