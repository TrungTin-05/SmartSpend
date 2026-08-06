import dotenv from "dotenv";
import { Sequelize } from "sequelize";

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

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("SQL Server connected");
  } catch (error) {
    console.error("SQL Server connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
