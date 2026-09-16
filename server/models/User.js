import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resetPasswordTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    resetPasswordExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "VND",
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: "{\"theme\":\"light\",\"startupPage\":\"/dashboard\"}",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

export default User;
