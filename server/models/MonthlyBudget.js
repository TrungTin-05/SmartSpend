import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";

const MonthlyBudget = sequelize.define(
  "MonthlyBudget",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "monthly_budgets",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId", "month", "year"] }],
  }
);

MonthlyBudget.belongsTo(User, { foreignKey: "userId" });
User.hasMany(MonthlyBudget, { foreignKey: "userId" });

export default MonthlyBudget;
