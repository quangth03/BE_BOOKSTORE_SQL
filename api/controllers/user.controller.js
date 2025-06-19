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

    // Tạo token xác nhận
    const verificationToken = crypto.randomBytes(16).toString("hex");

    // get data from request body
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hashPass,
      phone_number: req.body.phone_number,
      full_name: req.body.full_name,
      address: req.body.address,
      avatar: req.body.avatar,
      isDelete: req.body.isDelete,
      verificationToken, // Lưu token vào cơ sở dữ liệu
    };

    // save user in the database
    db.user
      .create(user)
      .then((data) => {
        // Gửi email xác nhận
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            // user: "lequangsang08102003@gmail.com",
            // pass: "oybv dfcq egmp tloa",
            user: process.env.EMAIL_USER, // Lấy từ .env
            pass: process.env.EMAIL_PASS, // Lấy từ .env
          },
        });

        const confirmationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;

        transporter.sendMail({
          from: '"Book Store" <your-email@gmail.com>',
          to: user.email,
          subject: "Xác nhận email đăng ký",
          html: `<p>Chào ${user.full_name},</p>
                 <p>Vui lòng nhấp vào liên kết sau để xác nhận email của bạn:</p>
                 <p>
                  <a  href="${confirmationUrl}" style="
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    margin-left: 100px;
                    font-size: 14px;
                    padding: 8px 12px;
                    text-align: center;
                    text-decoration: none;
                    border-radius: 4px;
                  ">
                    Xác nhận email
                  </a>
                </p>`,
        });
        -res.status(200).send({
          message:
            "User was registered successfully! Please check your email to verify your account.",
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the user.",
        });
      });
  },

  verifyEmail: async (req, res) => {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send({ message: "Token is required." });
    }

    try {
      const user = await db.user.findOne({
        where: { verificationToken: token },
      });

      if (!user) {
        return res.status(404).send({ message: "Invalid or expired token." });
      }

      // Cập nhật trạng thái xác nhận email
      await db.user.update(
        { isVerified: true, verificationToken: null },
        { where: { id: user.id } }
      );

      res
        .status(200)
        .send({ message: "Your email has been verified successfully." });
    } catch (error) {
      res
        .status(500)
        .send({ message: "An error occurred while verifying the email." });
    }
  },

  signin: (req, res) => {
    if (!req.body.username || !req.body.password) {
      return res.status(400).send({ message: "Content can not be empty!" });
    }

    const user = {
      username: req.body.username,
      password: req.body.password,
    };

    const getTotalOrderValue = async (userId) => {
      const result = await db.order.sum("total", {
        where: { user_id: userId },
      });
      return result || 0;
    };
    const updateUserStatusToVIP = async (userId, userEmail) => {
      try {
        const totalValue = await getTotalOrderValue(userId);
        const user = await db.user.findByPk(userId);

        if (totalValue >= 3000000 && !user.isVip) {
          // Tạo transporter gửi mail (có thể cấu hình lại)
          const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: "lequangsang08102003@gmail.com",
              pass: "oybv dfcq egmp tloa", // nhớ thay bằng mật khẩu ứng dụng thực tế
            },
          });

          // Gửi mail báo trước
          await transporter.sendMail({
            from: '"Book Store" <lequangsang08102003@gmail.com>',
            to: userEmail,
            subject: "Chúc mừng bạn trở thành thành viên VIP!",
            html: `<p>Xin chúc mừng! Do tổng giá trị đơn hàng của bạn đạt ${totalValue} VND, bạn đã được nâng cấp lên thành viên VIP.</p>
                <p>Tài khoản của bạn mua hàng sẽ được giảm giá gấp 2 lần tài khoản thường.</p>
               <p>Cảm ơn bạn đã ủng hộ chúng tôi!</p>`,
          });

          // Cập nhật trạng thái VIP sau khi gửi mail thành công
          await db.user.update({ isVip: true }, { where: { id: userId } });

          console.log("User updated to VIP and email sent.");
        }
      } catch (error) {
        console.error("Error updating VIP status or sending email:", error);
      }
    };
    db.user
      .findOne({ where: { username: user.username } })
      .then(async (data) => {
        if (!data) {
          return res
            .status(401)
            .send({ message: "Incorrect username or password." });
        }
        if (!data) {
          return res.status(404).send({ message: "User not found." });
        }

        if (data.isDelete) {
          return res
            .status(403)
            .send({ message: "Your account has been blocked." });
        }

        if (!data.isVerified) {
          return res
            .status(400)
            .send({ message: "Please verify your email first." });
        }

        if (!bcrypt.compareSync(user.password, data.password)) {
          return res.status(401).send({ message: "Wrong Password!" });
        }
        await updateUserStatusToVIP(data.id, data.email);
        const token1 = config.secret;
        const encodedToken = Buffer.from(token1).toString("base64");
        var token = jwt.sign(
          {
            id: data.id,
            isAdmin: data.isAdmin,
            isVip: data.isVip,
            token: encodedToken,
          },
          config.secret,
          { expiresIn: 60 * 60 * 24 }
        );

        res.status(200).send({
          authToken: token,
        });
      })
      .catch((err) => {
        res
          .status(500)
          .send({ message: err.message || "Some error occurred." });
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
        where: { isAdmin: 0, isVerified: 1 },
        order: [["createdAt", "DESC"]],
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

  findByid: async (req, res) => {
    const id = req.user_id;

    try {
      const user = await db.user.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }

      const totalOrderValue = await db.order.sum("total", {
        where: { user_id: id },
      });

      // Gộp thông tin user và tổng tiền
      res.send({
        ...user.toJSON(),
        totalOrderValue: totalOrderValue || 0,
      });
    } catch (err) {
      res.status(500).send({
        message: "Error retrieving user with id=" + id,
      });
    }
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

  blockUserAndSendEmail: async (req, res) => {
    const { userId, blockReason } = req.body;

    if (!userId || !blockReason) {
      return res
        .status(400)
        .send({ message: "User ID and Block Reason are required." });
    }

    try {
      // Tìm người dùng theo userId
      const user = await db.user.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }

      // Cập nhật trạng thái chặn người dùng trong cơ sở dữ liệu
      await db.user.update(
        { isDelete: true, blockReason }, // Giả sử bạn có trường isBlocked và blockReason
        { where: { id: user.id } }
      );

      // Tạo transporter cho Nodemailer (sử dụng Gmail SMTP hoặc một dịch vụ khác)
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "lequangsang08102003@gmail.com",
          pass: "oybv dfcq egmp tloa", // Thay bằng mật khẩu app cụ thể hoặc OAuth
        },
      });

      // Gửi email thông báo về việc chặn tài khoản
      await transporter.sendMail({
        from: '"Book Store" <your-email@gmail.com>',
        to: user.email,
        subject: "Thông báo về việc chặn tài khoản của bạn",
        html: `
        <p>Chào ${user.full_name},</p>
        <p>Tài khoản của bạn đã bị chặn vì lý do sau:</p>
        <p><strong>${blockReason}</strong></p>
        <p>Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
        <p>Trân trọng,</p>
        <p>Admin Book Store</p>
      `,
      });

      // Trả về phản hồi thành công
      res.status(200).send({
        message:
          "User has been blocked and an email has been sent to the user.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "An error occurred while processing your request.",
      });
    }
  },
};
