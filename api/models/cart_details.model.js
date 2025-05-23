module.exports = (sequelize, Sequelize, DataTypes) => {
  const cart_details = sequelize.define(
    "cart_details", // Model name
    {
      // Attributes
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      // Triggers
      hooks: {
        afterCreate: async (cart_details, options) => {
          const isVip = options.isVip || false;
          const data = await sequelize.models.book.findOne({
            where: { id: cart_details.book_id },
          });
          let priceSell =
            data.price *
            (1 - (isVip ? 2 * data.discount : data.discount) / 100);
          priceSell = Math.ceil(priceSell);
          console.log("priceSell", priceSell);
          let price = priceSell * cart_details.quantity;
          await sequelize.models.cart_details.increment(
            { total: price },
            {
              where: {
                cart_id: cart_details.cart_id,
                book_id: cart_details.book_id,
              },
            }
          );
          await sequelize.models.cart.increment(
            { total: price, total_quantity: cart_details.quantity },
            { where: { id: cart_details.cart_id } }
          );
        },

        beforeDestroy: (cart_details, options) => {
          sequelize.models.cart.decrement(
            {
              total: cart_details.total,
              total_quantity: cart_details.quantity,
            },
            { where: { id: cart_details.cart_id } }
          );
        },
      },
    }
  );

  return cart_details;
};
