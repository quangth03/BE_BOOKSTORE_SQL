module.exports = (sequelize, DataTypes) => {
  const UserViewedBook = sequelize.define(
    "user_viewed_book",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      viewed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["user_id", "book_id"],
        },
      ],
      timestamps: false,
    }
  );

  return UserViewedBook;
};
