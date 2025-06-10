// models/wishList.model.js
module.exports = (sequelize, DataTypes) => {
  const wishList = sequelize.define(
    "wishList",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    {
      tableName: "wishlists", // 👈 KHÔNG ĐƯỢC THIẾU
    }
  );

  return wishList;
};
