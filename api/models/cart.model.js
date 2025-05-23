module.exports = (sequelize, Sequelize, DataTypes) => {
  const cart = sequelize.define(
    "cart", // Model name
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
    },
    {
      // Triggers
      hooks: {
        beforeDestroy: async (cart, options) => {
          await sequelize.models.cart.create({ user_id: cart.user_id });
        },
      },
    }
  );

  return cart;
};
