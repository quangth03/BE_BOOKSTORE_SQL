module.exports = (sequelize, Sequelize, DataTypes) => {
  const order = sequelize.define(
    "order", // Model name
    {
      // Attributes
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      total: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      discount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      pay_url: {
        type: DataTypes.STRING,
      },
      payment_method: {
        type: DataTypes.ENUM("Online", "Tiền mặt"),
        allowNull: false,
        defaultValue: "Tiền mặt", // Giá trị mặc định
      },
    },
    {
      // Options
    }
  );

  return order;
};
