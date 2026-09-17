import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ override: true });

const DB_NAME = process.env.DB_NAME || "smartspend";
const DB_USER = process.env.DB_USER || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
let DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
let DB_INSTANCE = process.env.DB_INSTANCE || "";

if (!DB_INSTANCE && DB_HOST.includes("\\")) {
  const [host, instance] = DB_HOST.split("\\", 2);
  DB_HOST = host;
  DB_INSTANCE = instance;
}

const DB_AUTH_TYPE = process.env.DB_AUTH_TYPE || "sql";
const DB_DOMAIN = process.env.DB_DOMAIN || process.env.USERDOMAIN || process.env.COMPUTERNAME || "";

const sequelizeOptions = {
  host: DB_HOST,
  dialect: "mssql",
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      instanceName: DB_INSTANCE || undefined,
    },
  },
  logging: false,
};

if (DB_PORT) {
  sequelizeOptions.port = DB_PORT;
}

if (DB_AUTH_TYPE === "windows") {
  sequelizeOptions.dialectOptions.authentication = {
    type: "ntlm",
    options: {
      domain: DB_DOMAIN,
      userName: DB_USER || process.env.USERNAME || "",
      password: DB_PASSWORD || "",
    },
  };
} else {
  if (!DB_USER || !DB_PASSWORD) {
    console.error("Missing DB_USER or DB_PASSWORD. Set DB_USER and DB_PASSWORD in server/.env for SQL Authentication.");
    process.exit(1);
  }
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, sequelizeOptions);

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const walletMigration = fs.readFileSync(
  path.join(currentDirectory, "../migrations/002_add_wallets_and_transaction_wallet.sql"),
  "utf8"
);
const budgetMigration = fs.readFileSync(
  path.join(currentDirectory, "../migrations/003_add_budgets.sql"),
  "utf8"
);
const monthlyBudgetMigration = fs.readFileSync(
  path.join(currentDirectory, "../migrations/004_add_monthly_budgets.sql"),
  "utf8"
);

const backfillTransactionWallets = `
  INSERT INTO [wallets] ([userId], [name], [type], [initialBalance])
  SELECT [u].[id], N'Tài khoản mặc định', N'other', 0
  FROM [users] AS [u]
  WHERE NOT EXISTS (
    SELECT 1 FROM [wallets] AS [w] WHERE [w].[userId] = [u].[id]
  );

  UPDATE [t]
  SET [walletId] = [w].[id]
  FROM [transactions] AS [t]
  INNER JOIN [wallets] AS [w]
    ON [w].[userId] = [t].[userId]
    AND [w].[name] = N'Tài khoản mặc định'
  WHERE [t].[walletId] IS NULL;
`;

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query(walletMigration);
    await sequelize.query(budgetMigration);
    await sequelize.query(monthlyBudgetMigration);
    await sequelize.sync();
    await sequelize.query(backfillTransactionWallets);
    console.log("SQL Server connected");
  } catch (error) {
    console.error("SQL Server connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
