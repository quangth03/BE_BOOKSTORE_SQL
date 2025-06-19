const db = require("../models");
const { Op, Sequelize } = require("sequelize");

const UserViewedBook = db.user_viewed_book;
const Book = db.book;

module.exports = {
  // ✅ Ghi nhận lượt xem sách
  recordViewedBook: async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user_id;

    if (!userId || !bookId) {
      return res.status(400).send({
        message: "userId và bookId là bắt buộc!",
      });
    }

    try {
      await UserViewedBook.upsert({
        user_id: userId,
        book_id: bookId,
        viewed_at: new Date(),
      });

      res.status(200).send({
        message: "Đã ghi nhận lượt xem sách.",
      });
    } catch (err) {
      res.status(500).send({
        message: err.message || "Lỗi ghi nhận lượt xem sách.",
      });
    }
  },

  // getBooksByUserView: async (req, res) => {
  //   const user_id = req.user_id;

  //   if (!user_id) {
  //     return res.status(400).send({
  //       message: "Thiếu user_id!",
  //     });
  //   }

  //   try {
  //     const user = await db.user.findByPk(user_id, {
  //       include: [
  //         {
  //           model: db.books,
  //           as: "viewedBooks",
  //           through: {
  //             attributes: ["viewed_at"], // Lấy thời gian đã xem từ bảng trung gian
  //           },
  //         },
  //       ],
  //     });

  //     if (!user || !user.viewedBooks || user.viewedBooks.length === 0) {
  //       return res
  //         .status(404)
  //         .send({ message: "Người dùng chưa xem sách nào." });
  //     }

  //     // Sắp xếp theo thời gian viewed_at từ bảng trung gian
  //     const sortedBooks = user.viewedBooks.sort((a, b) => {
  //       return (
  //         new Date(b.user_viewed_book.viewed_at) -
  //         new Date(a.user_viewed_book.viewed_at)
  //       );
  //     });

  //     res.status(200).json(sortedBooks);
  //   } catch (err) {
  //     res.status(500).send({
  //       message: err.message || "Lỗi truy vấn sách đã xem.",
  //     });
  //   }
  // },
  getBooksByUserView: async (req, res) => {
    const user_id = req.user_id;

    if (!user_id) {
      return res.status(400).send({ message: "Thiếu user_id!" });
    }

    try {
      // Lấy các sách người dùng đã xem
      const user = await db.user.findByPk(user_id, {
        include: [
          {
            model: db.books,
            as: "viewedBooks",
            through: {
              attributes: ["viewed_at"],
            },
          },
        ],
      });

      let viewedBooks = [];
      if (user?.viewedBooks?.length > 0) {
        viewedBooks = user.viewedBooks.sort((a, b) => {
          return (
            new Date(b.user_viewed_book.viewed_at) -
            new Date(a.user_viewed_book.viewed_at)
          );
        });
      }

      // Nếu đã có đủ 10 sách đã xem
      if (viewedBooks.length >= 10) {
        return res.status(200).json(viewedBooks.slice(0, 10));
      }

      let moreBooks = [];
      if (viewedBooks.length > 0) {
        const firstBookId = viewedBooks[0].id;

        // Lấy danh mục của sách đầu tiên
        const caters = await db.book_category.findAll({
          where: { book_id: firstBookId },
        });

        const catersID = caters.map((item) => item.category_id);

        // Lấy thêm sách cùng danh mục nhưng chưa xem
        moreBooks = await db.books.findAll({
          where: {
            quantity: { [db.Sequelize.Op.gt]: 0 },
            id: { [db.Sequelize.Op.notIn]: viewedBooks.map((b) => b.id) },
          },
          include: [
            {
              model: db.category,
              where: { id: catersID },
            },
          ],
          order: [[db.Sequelize.fn("RAND")]],
          limit: 10 - viewedBooks.length,
        });

        // Gán viewed_at giả định để giữ vị trí sau sách đã xem
        moreBooks = moreBooks.map((book) => {
          book.user_viewed_book = { viewed_at: new Date("2025-01-10") };
          return book;
        });
      }

      const finalBooks = [...viewedBooks, ...moreBooks];

      if (finalBooks.length === 0) {
        return res.status(404).send({
          message: "Người dùng chưa xem sách nào và không có sách gợi ý.",
        });
      }

      res.status(200).json(finalBooks.slice(0, 10));
    } catch (err) {
      res.status(500).send({
        message: err.message || "Lỗi truy vấn sách đã xem.",
      });
    }
  },
  // ✅ Xoá toàn bộ lịch sử xem của người dùng (nếu cần)
  deleteViewHistoryByUser: async (req, res) => {
    const { userId } = req.params;

    try {
      const count = await UserViewedBook.destroy({
        where: { user_id: userId },
      });

      if (count > 0) {
        res.send({ message: `Đã xoá ${count} lượt xem.` });
      } else {
        res.send({ message: "Không có lịch sử để xoá." });
      }
    } catch (err) {
      res.status(500).send({
        message: err.message || "Lỗi khi xoá lịch sử xem.",
      });
    }
  },
};
