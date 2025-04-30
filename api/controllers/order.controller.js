const db = require("../models");
const { createPayment } = require("../utils/payment");
const { findAll } = require("./category.controller");

module.exports = {
  createOder: async (req, res) => {
    if (!req.user_id) {
      res.status(400).send({
        message: "Content can not be empty!",
      });
      return;
    }

    let cart = await db.cart.findOne({
      where: {
        user_id: req.user_id,
      },
    });

    if (cart != null) {
      if (cart.total == 0) {
        return res.status(400).send({
          message: "Cart is empty!",
        });
      }
    } else {
      return res.status(400).send({
        message: "Cart is empty!",
      });
    }
    // discount
    const discount = req.body.value ?? 0;
    const payment_method = req.body.payment_method;
    const status = req.body.status;
    let order = await db.order.create({
      user_id: req.user_id,
      total: cart.total - discount,
      total_quantity: cart.total_quantity,
      discount: discount,
      payment_method: payment_method,
      status: status,
    });

    const cartIteam = await db.cart_details.findAll({
      where: {
        cart_id: cart.id,
      },
    });

    cartIteam.forEach(async (item) => {
      // Thêm chi tiết đơn hàng
      await db.order_details.create({
        order_id: order.id,
        book_id: item.book_id,
        quantity: item.quantity,
        total: item.total,
      });

      // Cập nhật số lượng sản phẩm trong kho
      let book = await db.books.findByPk(item.book_id);
      if (book) {
        await db.books.update(
          { quantity: book.quantity - item.quantity }, // Trừ số lượng trong kho
          { where: { id: item.book_id } }
        );
      }
    });

    try {
      db.cart.destroy({
        where: { id: cart.id },
      });
    } catch (error) {
      return res.status(500).send({
        message: err.message || "Some error occurred while destroy the cart.",
      });
    }

    const paymentRS = await createPayment(order.id, order.total);
    if (!paymentRS) {
      return res.status(500).send({
        message: err.message || "payment error",
      });
    }
    await db.order.update(
      { pay_url: paymentRS.payUrl },
      { where: { id: order.id } }
    );
    res.status(200).send(paymentRS);
  },

  deleteOrder: (req, res) => {
    const id = req.params.id;
    db.order
      .destroy({
        where: { id: id },
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Order was deleted successfully!",
          });
        } else {
          res.send({
            message: `Cannot delete Order with id=${id}. Maybe Order was not found!`,
          });
        }
      });
  },

  getAllOder: (req, res) => {
    db.order
      .findAll({
        include: [{ model: db.user, attributes: ["full_name"] }],
        order: [["createdAt", "DESC"]], // Thêm dòng này để sắp xếp theo createdAt giảm dần
      })
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving Order.",
        });
      });
  },

  updateOrder: (req, res) => {
    let { id, ...data } = req.body;
    db.order
      .update(data, { where: { id: id } })
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving Order.",
        });
      });
  },
  getOders: async (req, res) => {
    let user_id = null;
    if (req.isAdmin) {
      user_id = await req.params.id;
    } else {
      user_id = await req.user_id;
    }

    db.order
      .findAll({
        where: { user_id: user_id },
        order: [["createdAt", "DESC"]],
      })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving Order.",
        });
      });
  },

  getOderDetails: (req, res) => {
    db.order
      .findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.books,
            attributes: ["id", "title", "author", "price", "image"],
            through: { attributes: ["quantity", "total"] },
          },
          {
            model: db.user, // Nếu cần thông tin user
            attributes: ["full_name", "address", "phone_number"],
          },
        ],
      })
      .then((data) => {
        if (data) {
          res.send(data);
        } else {
          res.status(400).send({
            message: "Order not found!",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving Order.",
        });
      });
  },
  createPay: async (req, res) => {
    try {
      // check order id in user
      const order = await db.order.findOne({
        where: { user_id: req.user_id, id: req.body.id },
      });
      if (!order) {
        return res.status(400).send({
          message: "Order not found!",
        });
      }
      const paymentRS = await createPayment(order.id, order.total);
      if (!paymentRS) {
        return res.status(500).send({
          message: err.message || "payment error",
        });
      }
      res.status(200).send(paymentRS);
    } catch (error) {
      return res.status(500).send({
        message: "serve not error!",
      });
    }
  },
  payCallback: async (req, res) => {
    try {
      if (req.body.resultCode == 0) {
        await db.order.update(
          { status: 2 },
          { where: { id: req.body.orderId } }
        );
      }
      return res.status(200).json(req.body);
    } catch (error) {
      return res.status(500).send({
        message: "Order not found!",
      });
    }
  },
};
