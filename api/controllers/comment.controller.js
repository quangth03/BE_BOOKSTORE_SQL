const db = require("../models");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

module.exports = {
  findAll: (req, res) => {
    db.comment
      .findAll({
        order: [
          ["createdAt", "DESC"], // Thêm phần này để sắp xếp theo ngày tạo (mới nhất)
        ],
        // attributes: { exclude: ["password"] },
        include: [
          {
            model: db.user,
            attributes: ["full_name"],
          },
          {
            model: db.books,
            attributes: ["title", "image"],
          },
        ],
      })
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving users.",
        });
      });
  },
  delete: (req, res) => {
    const id = req.params.id; // Lấy ID từ params

    db.comment
      .destroy({
        where: { id: id }, // Xóa bình luận theo ID
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Comment was deleted successfully!",
          });
        } else {
          res.send({
            message: `Cannot delete Comment with id=${id}. Maybe Comment was not found!`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: "Could not delete Comment with id=" + id,
        });
      });
  },
};
