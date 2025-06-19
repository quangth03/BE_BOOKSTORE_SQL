const db = require("../models");
const { createPayment, getPaymented } = require("../utils/payment");

module.exports = {
  createOrder: async (req, res) => {
    const updateUserStatusToVIP = async (userId, userEmail) => {
      try {
        const totalValue = await db.order.sum("total", {
          where: { user_id: userId },
        });
        const user = await db.user.findByPk(userId);

        if (totalValue >= 3000000 && !user.isVip) {
          const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: "lequangsang08102003@gmail.com",
              pass: "oybv dfcq egmp tloa", // dùng app password
            },
          });

          await transporter.sendMail({
            from: '"Book Store" <lequangsang08102003@gmail.com>',
            to: userEmail,
            subject: "Chúc mừng bạn trở thành thành viên VIP!",
            html: `
          <p>Xin chúc mừng! Tổng giá trị đơn hàng của bạn đã đạt ${totalValue.toLocaleString()} VND.</p>
          <p>Tài khoản của bạn đã được nâng cấp lên thành viên VIP với nhiều ưu đãi hấp dẫn.</p>
        `,
          });

          await db.user.update({ isVip: true }, { where: { id: userId } });
          console.log("User updated to VIP and email sent.");
        }
      } catch (error) {
        console.error("Error updating VIP status or sending email:", error);
      }
    };
    try {
      // 1. Kiểm tra user & giỏ hàng
      if (!req.user_id) {
        return res.status(400).json({ message: "Missing user_id" });
      }

      const cart = await db.cart.findOne({ where: { user_id: req.user_id } });
      if (!cart || cart.total === 0) {
        return res.status(400).json({ message: "Cart is empty!" });
      }

      // 2. Tạo đơn hàng trong DB
      const discount = req.body.value ?? 0;
      const paymentMethod = req.body.payment_method; // 'online' | 'cash'
      const status = req.body.status; // 1 | 2 | …

      const {
        note,
        to_name,
        to_phone,
        to_address,
        to_ward_code,
        to_district_id,
        service_type_id,
        payment_type_id,
        required_note,
        cod_amount,
        weight,
        items,
        ghn_fee,
      } = req.body;

      const ghn_info = {
        note,
        to_name,
        to_phone,
        to_address,
        to_ward_code,
        to_district_id,
        service_type_id,
        payment_type_id,
        required_note,
        cod_amount,
        weight,
        items,
      };
      console.log("GHN FEE:", ghn_fee); // check có ra số không

      const order = await db.order.create({
        user_id: req.user_id,
        total: cart.total - discount,
        total_quantity: cart.total_quantity,
        discount,
        payment_method: paymentMethod,
        status,
        ghn_info,
        ghn_fee,
      });

      // 3. Copy items sang order_details & trừ tồn kho
      const cartItems = await db.cart_details.findAll({
        where: { cart_id: cart.id },
      });

      for (const item of cartItems) {
        await db.order_details.create({
          order_id: order.id,
          book_id: item.book_id,
          quantity: item.quantity,
          total: item.total,
        });

        // cập nhật tồn kho
        await db.books.increment(
          { quantity: -item.quantity },
          { where: { id: item.book_id } }
        );
      }

      // 4. Xoá giỏ hàng
      await db.cart.destroy({ where: { id: cart.id } });

      // 5. Nếu thanh toán ONLINE → tạo PayUrl (MoMo)
      if (paymentMethod === "online") {
        const paymentRS = await createPayment(order.id, order.total); // => { payUrl, ... }

        if (!paymentRS) {
          return res.status(500).json({ message: "Payment error" });
        }

        await db.order.update(
          { pay_url: paymentRS.payUrl },
          { where: { id: order.id } }
        );
        return res.status(200).json(paymentRS); // <- DỪNG TẠI ĐÂY
      }

      const user = await db.user.findByPk(req.user_id);
      await updateUserStatusToVIP(req.user_id, user.email);
      // 6. Nếu COD → trả về kết quả ngay
      return res
        .status(200)
        .json({ message: "Create order success", orderId: order.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
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

  updateOrder: async (req, res) => {
    try {
      const { id, status, ...data } = req.body;

      // Cập nhật trạng thái đơn hàng trước
      await db.order.update({ status, ...data }, { where: { id } });

      // Lấy đơn hàng để dùng tiếp
      const order = await db.order.findByPk(id);

      // ✅ Trường hợp status = 7 → hủy đơn GHN
      if (status == 7) {
        const orderDetails = await db.order_details.findAll({
          where: { order_id: id },
        });

        for (const item of orderDetails) {
          await db.books.increment(
            { quantity: item.quantity },
            { where: { id: item.book_id } }
          );
        }

        // Nếu có đơn GHN, thì hủy luôn:
        if (order?.ghn_code) {
          try {
            await fetch(
              "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel",
              {
                method: "POST",
                headers: {
                  Token: process.env.GHN_TOKEN,
                  ShopId: process.env.GHN_SHOP_ID,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  order_codes: [order.ghn_code],
                }),
              }
            );
          } catch (err) {
            console.error("GHN cancel error:", err);
          }
        }
      }

      // ✅ Nếu status = 3 → tạo đơn GHN
      if (status == 3) {
        if (!order || !order.ghn_info) {
          return res
            .status(400)
            .json({ message: "Order or ghn_info not found" });
        }

        const ghnPayload = {
          ...order.ghn_info,
          client_order_code: String(order.id),
        };

        const ghnRes = await fetch(
          "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Token: process.env.GHN_TOKEN,
              ShopId: process.env.GHN_SHOP_ID,
            },
            body: JSON.stringify(ghnPayload),
          }
        );

        const ghnJson = await ghnRes.json();

        if (ghnJson.code !== 200) {
          return res
            .status(500)
            .json({ message: "GHN create failed", detail: ghnJson });
        }

        await db.order.update(
          {
            ghn_response: ghnJson.data,
            ghn_code: ghnJson.data.order_code,
          },
          { where: { id } }
        );
      }

      return res.status(200).json({ message: "Order updated successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Error while updating order",
      });
    }
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
        // console.log(data);
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
    console.log(req.body);
    //thanh toan thanh cong thi goi callback
    //req.body: orderId, resultCode, signature,...
    try {
      if (req.body.resultCode == 0) {
        await db.order.update(
          { status: 2 },
          { where: { id: req.body.orderId } }
        );
      }
      if (req.body.resultCode == 1002) {
        await db.order.update(
          { status: 8 },
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

  checkTransitionPayment: async (req, res) => {
    const result = await getPaymented(req.body.orderId);
    // const json = await result.json();
    res.json(result);
  },
};
