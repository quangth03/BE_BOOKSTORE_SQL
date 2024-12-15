const db = require("../models");

module.exports = {
  addItem: async (req, res) => {
    if (!req.body.book_id) {
      return res.status(400).send({
        message: "Content can not be empty!",
      });
    }

    let quantity = req.body.quantity == null ? 1 : parseInt(req.body.quantity);
    let cart = await db.cart.findOne({
      where: {
        user_id: req.user_id,
      },
    });

    if (!cart) {
      cart = await db.cart.create({
        user_id: req.user_id,
      });
    }

    let book = await db.books.findOne({
      where: {
        id: req.body.book_id,
      },
    });

    if (book == null) {
      return res.status(400).send({
        message: "Book not found!",
      });
    }

    try {
      let cart_details = await db.cart_details.findOne({
        where: {
          cart_id: cart.id,
          book_id: book.id,
        },
      });

      if (cart_details == null) {
        if (quantity <= 0) {
          return res.status(400).send({
            message:
              "Quantity must be greater than zero! Book haven't added to cart",
          });
        } else {
          db.cart_details.create({
            cart_id: cart.id,
            book_id: book.id,
            quantity: quantity,
          });
        }
      } else {
        if (quantity < 0 && cart_details.quantity <= Math.abs(quantity)) {
          await db.cart_details.destroy({
            where: {
              cart_id: cart.id,
              book_id: book.id,
            },
            individualHooks: true,
          });

          return res.status(200).send({
            message: "Item was removed successfully!",
          });
        } else {
          const sellPrice = book.price * (1 - book.discount / 100);
          await db.cart_details.update(
            {
              quantity: cart_details.quantity + quantity,
              total: cart_details.total + parseInt(sellPrice) * quantity,
            },
            {
              where: {
                cart_id: cart.id,
                book_id: book.id,
              },
            }
          );

          await db.cart.update(
            {
              total: cart.total + parseInt(sellPrice) * quantity,
              total_quantity: cart.total_quantity + quantity,
            },
            {
              where: {
                id: cart.id,
              },
            }
          );
        }
      }

      res.status(200).send({
        message: "Item was update successfully!",
      });
    } catch (error) {
      res.status(500).send({
        message: error.message || "Some error occurred while retrieving carts.",
      });
    }
  },
  update: async (req, res) => {
    if (!req.body.book_id) {
      return res.status(400).send({
        message: "Content can not be empty!",
      });
    }
    if (!req.body.quantity) {
      return res.status(400).send({
        message: "Content can not be empty!",
      });
    }

    try {
      // Tìm giỏ hàng của người dùng
      let cart = await db.cart.findOne({
        where: {
          user_id: req.user_id,
        },
      });
      if (!cart) {
        return res.status(400).send({ message: "Cart not found!" });
      }

      // Tìm chi tiết giỏ hàng
      let cartItem = await db.cart_details.findOne({
        where: { cart_id: cart.id, book_id: req.body.book_id },
        include: [{ model: db.books }],
      });
      if (!cartItem) {
        return res.status(400).send({ message: "Cart item not found!" });
      }

      // Tính toán total_quantity và cập nhật giỏ hàng
      const updatedTotalQuantity =
        cart.total_quantity + (req.body.quantity - cartItem.quantity);

      await db.cart.update(
        {
          total_quantity: updatedTotalQuantity,
        },
        {
          where: {
            user_id: req.user_id,
          },
        }
      );

      // Sau khi total_quantity đã được cập nhật, tính toán total
      const updatedTotal =
        cart.total +
        (req.body.quantity * cartItem.books.price -
          cartItem.quantity * cartItem.books.price);

      // Cập nhật chi tiết giỏ hàng
      await db.cart_details.update(
        {
          quantity: req.body.quantity,
          total: req.body.quantity * cartItem.books.price,
        },
        {
          where: {
            cart_id: cart.id,
            book_id: req.body.book_id,
          },
        }
      );

      // Cập nhật giỏ hàng với total
      await db.cart.update(
        {
          total: updatedTotal,
        },
        {
          where: {
            user_id: req.user_id,
          },
        }
      );

      res.status(200).send({
        message: "Cart updated successfully!",
      });
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while updating the cart.",
      });
    }
  },

  removeItem: async (req, res) => {
    if (!req.body.book_id) {
      return res.status(400).send({
        message: "Content can not be empty!",
      });
    }

    let cart = await db.cart.findOne({
      where: {
        user_id: req.user_id,
      },
    });

    if (cart == null) {
      db.cart.create({
        user_id: req.user_id,
      });
    }

    // get data from request body
    const item = {
      cart_id: cart.id,
      book_id: req.body.book_id,
    };

    try {
      await db.cart_details.destroy({
        where: {
          cart_id: item.cart_id,
          book_id: item.book_id,
        },
        individualHooks: true,
      });

      res.status(200).send({
        message: "Item was removed successfully!",
      });
    } catch (error) {
      res.status(500).send({
        message: error.message || "Some error occurred while retrieving carts.",
      });
    }
  },

  getCart: async (req, res) => {
    let data = await db.cart.findOne({
      where: {
        user_id: req.user_id,
      },
      include: [
        {
          model: db.books,
          attributes: [
            "id",
            "title",
            "author",
            "price",
            "discount",
            "description",
            "publication_date",
            "image",
            "quantity",
          ],
          through: { attributes: ["quantity", "total", "createdAt"] },
        },
      ],
    });

    if (data == null || data == []) {
      data = await db.cart.create({
        user_id: req.user_id,
      });
      return res.status(200).send(data);
    }

    res.status(200).send(data);
  },
};
