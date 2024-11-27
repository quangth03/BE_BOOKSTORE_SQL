const db = require("../models");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

module.exports = {
  signup: async (req, res) => {
    const salt = bcrypt.genSaltSync(7);

    const hashPass = bcrypt.hashSync(req.body.password, salt);

    // get data from request body
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hashPass,
      phone_number: req.body.phone_number,
      full_name: req.body.full_name,
      address: req.body.address,
      avatar: req.body.avatar,
      isDelete: req.body.isDelete
    };

    // save user in the database
    db.user
      .create(user)
      .then((data) => {
        res.status(200).send({
          message: "User was registered successfully!",
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the user.",
        });
      });
  },

  signin: (req, res) => {
    if (!req.body.username && !req.body.password) {
      res.status(400).send({
        message: "Content can not be empty!",
      });
      return;
    }

    // get data from request body
    const user = {
      username: req.body.username,
      password: req.body.password,
    };

    // save user in the database
    db.user
      .findOne({
        where: {
          username: user.username,
        },
      })
      .then((data) => {
        if (!data) {
          return res.status(404).send({
            message: "User Not found.",
          });
        }
        if (data.isDelete) {
          return res.status(403).send({
            message: "Your account has been blocked.",
          });
        }

        if (!bcrypt.compareSync(user.password, data.password)) {
          return res.status(401).send({
            message: "Wrong Password!",
          });
        }
        const token1 = config.secret; // Chuỗi token cần mã hóa
        const encodedToken = Buffer.from(token1).toString("base64");
        var token = jwt.sign(
          { id: data.id, isAdmin: data.isAdmin, token: encodedToken },
          config.secret,
          {
            expiresIn: 60 * 60 * 24, // 24 hours,
          }
        );

        res.status(200).send({
          authToken: token,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the user.",
        });
      });
  },

  updateProfile: (req, res) => {
    if (!req.body) {
      return res.status(400).send({
        message: "Content can not be empty!",
      });
    }
    // save user in the database
    db.user
      .update(req.body, {
        where: {
          id: req.user_id,
        },
      })
      .then((data) => {
        res.status(200).send({
          message: "User was updated successfully!",
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while updating the user.",
        });
      });
  },

  findAll: (req, res) => {
    db.user
      .findAll({
        attributes: { exclude: ["password"] },
        where: { isAdmin: 0 },
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

  findByid: (req, res) => {
    const id = req.user_id;

    db.user
      .findByPk(id, {
        attributes: { exclude: ["password"] },
      })
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: "Error retrieving user with id=" + id,
        });
      });
  },

  changePassword: async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user_id;

    // Check if required data is provided
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .send({ message: "Old password and new password are required." });
    }

    try {
      // Find user by id from database
      const user = await db.user.findByPk(userId);

      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }

      // Check if old password is correct
      const isPasswordCorrect = bcrypt.compareSync(oldPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).send({ message: "Invalid old password." });
      }

      // Hash new password and update in database
      const salt = bcrypt.genSaltSync(7);
      const hashPass = bcrypt.hashSync(newPassword, salt);

      await db.user.update({ password: hashPass }, { where: { id: userId } });

      return res
        .status(200)
        .send({ message: "Password updated successfully." });
    } catch (error) {
      return res
        .status(500)
        .send({ message: "An error occurred while updating password." });
    }
  },
  forgotPassword: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required." });
    }

    try {
      // Tìm người dùng theo email
      const user = await db.user.findOne({ where: { email } });

      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }

      // Tạo mật khẩu ngẫu nhiên
      const newPassword = crypto.randomBytes(4).toString("hex");
      const salt = bcrypt.genSaltSync(7);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);

      // Cập nhật mật khẩu mới trong cơ sở dữ liệu
      await db.user.update(
        { password: hashedPassword },
        { where: { id: user.id } }
      );

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "lequangsang08102003@gmail.com", 
          pass: "oybv dfcq egmp tloa", 
        },
      });

      await transporter.sendMail({
        from: '"Book Store" <your_email@gmail.com>',
        to: email,
        subject: "Mật khẩu Mới Của Bạn",
        html: `<p>Mật khẩu của bạn đã được đặt lại. Đây là mật khẩu mới của bạn:</p>
               <p><strong>${newPassword}</strong></p>
               <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay lập tức.</p>`,
      });

      res.status(200).send({
        message: "A new password has been sent to your email.",
      });
    } catch (error) {
      res.status(500).send({
        message: "An error occurred while processing your request.",
      });
    }
  },

  delete: (req, res) => {
    const id = req.params.id;
    db.user
      .update(
        { isDelete: 1 },
        {
          where: { id: id },
        }
      )
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "User was deleted successfully!",
          });
        } else {
          res.send({
            message: `Cannot delete User with id = ${id}. Maybe User was not found!`,
          });
        }
      });
  },

  restore: (req, res) => {
    db.user
      .update(req.body, {
        where: { id: req.params.id },
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "User was updated successfully.",
          });
        } else {
          res.send({
            message: `Cannot update User with id = ${req.params.id}. Maybe User was not found !`,
          });
        }
      });
  },
};
