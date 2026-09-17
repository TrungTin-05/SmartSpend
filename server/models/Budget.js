import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";
import Category from "./Category.js";

const Budget = sequelize.define(
  "Budget",
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
    categoryId: {
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
    tableName: "budgets",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId", "categoryId", "month", "year"] }],
  }
);

Budget.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Budget, { foreignKey: "userId" });
Budget.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Budget, { foreignKey: "categoryId", as: "budgets" });

export default Budget;
