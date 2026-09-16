import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./User.js";

const Category = sequelize.define(
  "Category",
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
      defaultValue: "expense",
    },
  },
  {
    tableName: "categories",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "type", "name"],
      },
    ],
  }
);

Category.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Category, { foreignKey: "userId" });

export default Category;
