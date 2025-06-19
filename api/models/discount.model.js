module.exports = (sequelize, DataTypes) => {
  const Discount = sequelize.define(
    "Discount", // Tên model
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0.01, // Giá trị giảm giá phải lớn hơn 0
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true, // Có thể để trống
      },
      minimumOrderValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0.0, // Giá trị mặc định
        validate: {
          min: 0.0, // Không cho phép giá trị âm
        },
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
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: false, // Bắt buộc phải có giá trị
        validate: {
          isAfter: `${new Date().toISOString()}`, // Ngày hết hạn phải sau thời gian hiện tại
        },
      },
    },
    {
      timestamps: true, // Tự động quản lý createdAt và updatedAt
      tableName: "discounts", // Tên bảng trong cơ sở dữ liệu
    }
  );

  return Discount;
};
