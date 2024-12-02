// models/wishList_books.model.js
module.exports = (sequelize, DataTypes) => {
    const wishList_books = sequelize.define('wishList_books', {
      wishList_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false, // Vô hiệu hóa timestamps
    }
  );
   return wishList_books;
  };
   