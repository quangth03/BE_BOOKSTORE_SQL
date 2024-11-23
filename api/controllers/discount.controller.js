const db = require("../models");
const { Op } = require("sequelize"); // Để sử dụng Op.gte trong điều kiện query

module.exports = {
    createDiscount: (req, res) => {
    if (!req.body.value || !req.body.expiredAt) {
      res.status(400).send({
        message: "Value and expiration date are required!",
      });
      return;
    }

    const discount = {
      value: req.body.value,
      description: req.body.description,
      minimumOrderValue: req.body.minimumOrderValue,
      expiredAt: req.body.expiredAt,
    };

    db.discount
      .create(discount)
      .then((data) => {
        res.status(200).send({
          message: "Discount was created successfully.",
          discount: data,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while creating the discount.",
        });
      });
  },

  getAllDiscounts: async (req, res) => {
    try {
      const data = await db.discount.findAll();
      if (!data) {
        return res.status(404).send({
          message: "No discounts found!",
        });
      }
      res.status(200).json(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving discounts.",
      });
    }
  },

  getDiscountById: async (req, res) => {
    const id = req.params.id;
    
    try {
      const data = await db.discount.findOne({ where: { id: id } });
      if (!data) {
        return res.status(404).send({
          message: "Discount not found!",
        });
      }
      res.status(200).json(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving the discount.",
      });
    }
  },

  updateDiscount: (req, res) => {
    const id = req.params.id;
    
    db.discount
      .update(req.body, {
        where: { id: id },
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Discount was updated successfully.",
          });
        } else {
          res.send({
            message: `Cannot update discount with id=${id}. Maybe discount was not found or req.body is empty!`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while updating the discount.",
        });
      });
  },

  deleteDiscount: (req, res) => {
    const id = req.params.id;

    db.discount
      .destroy({
        where: { id: id },
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Discount was deleted successfully!",
          });
        } else {
          res.send({
            message: `Cannot delete discount with id=${id}. Maybe discount was not found!`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while deleting the discount.",
        });
      });
  },

  getValidDiscounts: async (req, res) => {
    const currentDate = new Date();

    try {
      const data = await db.discount.findAll({
        where: {
          expiredAt: {
            [Op.gte]: currentDate, // Chỉ lấy các mã giảm giá chưa hết hạn
          },
        },
      });

      if (data.length === 0) {
        return res.status(404).send({
          message: "No valid discounts found!",
        });
      }

      res.status(200).json(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving valid discounts.",
      });
    }
  }
};
