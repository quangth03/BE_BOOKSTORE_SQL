// models/wishList_books.model.js
module.exports = (sequelize, DataTypes) => {
  const wishList_books = sequelize.define(
    "wishList_books",
    {
      wishList_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Mặc định là thời gian hiện tại
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Mặc định là thời gian hiện tại
      },
    },
    {
      tableName: "wishlist_books", // 👈 PHẢI KHỚP TÊN BẢNG TRONG MYSQL
    }
  );
  return wishList_books;
};
