const { date } = require("joi");
const db = require("../models");

module.exports = {
  create: (req, res) => {
    if (
      !req.body.title ||
      !req.body.author ||
      !req.body.price ||
      !req.body.description ||
      !req.body.publication_date ||
      !req.body.image ||
      !req.body.quantity
    ) {
      res.status(400).send({
        message: "req.body can not be empty!",
      });
      return;
    }

    // get data from request body

    const categories = req.body.categories || [];

    // save book in the database
    db.books
      .create(req.body)
      .then((data) => {
        categories.forEach((item) => {
          db.book_category
            .create({ book_id: data.id, category_id: item })
            .catch((err) => {
              res.status(500).send({
                message:
                  err.message || "Some error occurred while creating the Book.",
              });
            });
        });
        res.status(200).send({
          message: "Book was created successfully.",
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Book.",
        });
      });
  },

  update: (req, res) => {
    if (
      !req.body.title ||
      !req.body.author ||
      !req.body.price ||
      !req.body.description ||
      !req.body.publication_date ||
      !req.body.image ||
      !req.body.quantity
    ) {
      res.status(400).send({
        message: "req.body can not be empty!",
      });
    }

    db.books
      .update(req.body, {
        where: { id: req.params.id },
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Book was updated successfully.",
          });
        } else {
          res.send({
            message: `Cannot update Book with id = ${req.params.id}. Maybe Book was not found !`,
          });
        }
      });
  },

  restore: (req, res) => {
    db.books
      .update(req.body, {
        where: { id: req.params.id },
      })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Book was updated successfully.",
          });
        } else {
          res.send({
            message: `Cannot update Book with id = ${req.params.id}. Maybe Book was not found !`,
          });
        }
      });
  },

  delete: (req, res) => {
    const id = req.params.id;

    db.books
      .update(
        { isDelete: 1 },
        {
          where: { id: id },
        }
      )
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Book was deleted successfully!",
          });
        } else {
          res.send({
            message: `Cannot delete Book with id = ${id}. Maybe Book was not found!`,
          });
        }
      });
  },

  addBook_Category: async (req, res) => {
    try {
      const book_id = req.params.id;
      const categories = req.body.id;

      // Kiểm tra nếu không có danh sách thể loại hoặc không phải mảng
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).send({
          message: "Categories must be a non-empty array.",
        });
      }

      // Kiểm tra xem sách có tồn tại không
      const bookExists = await db.books.findOne({ where: { id: book_id } });
      if (!bookExists) {
        return res.status(400).send({
          message: "Book not found.",
        });
      }

      let unSuccess = [];

      // Lặp qua danh sách thể loại
      for (const item of categories) {
        const category = await db.category.findByPk(item);
        if (category) {
          const data = await db.book_category.findOne({
            where: { book_id: book_id, category_id: item },
          });

          // Nếu chưa tồn tại, thêm mới
          if (!data) {
            await db.book_category.create({
              book_id: book_id,
              category_id: item,
            });
          } else {
            unSuccess.push(item); // Đã tồn tại
          }
        } else {
          unSuccess.push(item); // Không tìm thấy thể loại
        }
      }

      // Trả về thông báo nếu có thất bại
      if (unSuccess.length > 0) {
        return res.status(400).send({
          message: "Some categories not found or already exist.",
          data: unSuccess,
        });
      }

      // Thành công
      return res.status(200).send({
        message: "Categories added successfully.",
      });
    } catch (error) {
      // Bắt lỗi và phản hồi với thông báo lỗi
      console.error(error);
      return res.status(500).send({
        message: "An error occurred while processing your request.",
      });
    }
  },

  removeBook_Category: (req, res) => {
    const book_id = req.params.id;
    const categories = req.body.id;

    if (!db.books.findOne({ where: { id: book_id } })) {
      return res.status(400).send({
        message: "Book not found.",
      });
    }

    categories.forEach((item) => {
      db.book_category.destroy({
        where: { book_id: book_id, category_id: item },
      });
    });

    res.status(200).send({
      message: "successfully.",
    });
  },

  adminFindAll: (req, res) => {
    let author = req.query.author;
    let title = req.query.title;
    let from = req.query.from;
    let to = req.query.to;
    let year = req.query.year;
    let page = req.query.page;
    let sortD = req.query.sortD;
    let sortBy = req.query.sort;
    let limit = parseInt(req.query.limit);

    author = author ? author : "";
    title = title ? title : "";
    from = from ? from : 0;
    to = to ? to : 1000000000; // 1 tỷ =)))
    let yearEnd = 0;
    if (!year || year < 1970) {
      year = 1970;
      yearEnd = 3000;
    } else {
      yearEnd = parseInt(year) + 1;
    }

    if (from > to) {
      let temp = from;
      from = to;
      to = temp;
    }
    if (!page || page <= 0) page = 1;
    if (!limit || limit <= 0) limit = 10;
    sortD = sortD ? sortD : "ASC";
    sortBy = sortBy ? sortBy : "id";

    db.books
      .findAll({
        where: {
          author: {
            [db.Op.substring]: author,
          },
          title: {
            [db.Op.substring]: title,
          },
          price: {
            [db.Op.between]: [from, to],
          },
          publication_date: {
            [db.Op.between]: [new Date(year, 0, 0), new Date(yearEnd, 0, 0)],
          },
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: [
          ["createdAt", "DESC"], // Thêm phần này để sắp xếp theo ngày tạo (mới nhất)
          [sortBy, sortD], // Giữ phần sắp xếp theo các tiêu chí khác (nếu có)
        ],
      })
      .then((data) => {
        if (data.length > 0) {
          res.json(data);
        } else {
          res.send({
            message: "No books found !",
          });
        }
      });
  },

  findAll: (req, res) => {
    let author = req.query.author;
    let title = req.query.title;
    let from = req.query.from;
    let to = req.query.to;
    let year = req.query.year;
    let page = req.query.page;
    let sortD = req.query.sortD;
    let sortBy = req.query.sort;
    let limit = parseInt(req.query.limit);
    let cat = req.query.cat;

    cat = cat ? cat.split('-').map(num => Number(num)) : null;
    author = author ? author : "";
    title = title ? title : "";
    from = from ? from : 0;
    to = to ? to : 1000000000; // Giá trị mặc định cho từ đến
    let yearEnd = 0;

    if (!year || year < 1970) {
      year = 1970;
      yearEnd = 3000;
    } else {
      yearEnd = parseInt(year) + 1;
    }

    if (from > to) {
      let temp = from;
      from = to;
      to = temp;
    }

    if (!page || page <= 0) page = 1;
    if (!limit || limit <= 0) limit = 1000;

    sortD = sortD ? sortD : "ASC";
    sortBy = sortBy ? sortBy : "id";

    let queryOptions = {
      where: {
        author: {
          [db.Op.substring]: author,
        },
        isDelete: 0,
        title: {
          [db.Op.substring]: title,
        },
        price: {
          [db.Op.between]: [from, to],
        },
        publication_date: {
          [db.Op.between]: [new Date(year, 0, 0), new Date(yearEnd, 0, 0)],
        },
      },
      offset: (page - 1) * limit,
      limit: limit,
      order: [[sortBy, sortD]],
    };

    if (cat) {
      queryOptions.include = [
        {
          model: db.category,
          where: { id: cat }, 
        },
      ];
    }

    db.books
      .findAll(queryOptions)
      .then((data) => {
        if (data.length > 0) {
          res.json(data);
        } else {
          res.send({
            message: "No books found!",
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send({
          message: "Error retrieving books.",
        });
      });
  },

  findByid: (req, res) => {
    const id = req.params.id;

    db.books
      .findByPk(id, {
        include: {
          model: db.category,
        },
      })
      .then((data) => {
        if (data) {
          res.json(data);
        } else {
          res.send({
            message: `Cannot find Book with id = ${id}.`,
          });
        }
      });
  },
  findAroundByid: async (req, res) => {
    try {
      const caters = await db.book_category.findAll({
        where: { book_id: req.params.id },
      });

      const catersID = caters.map((item) => item.category_id);

      const books = await db.books.findAll({
        where: { quantity: { [db.Op.gt]: 0 } },
        limit: 4,
        include: {
          model: db.category,
          where: {
            id: catersID,
          },
        },
        order: [[db.sequelize.fn("RAND")]],
      });
      res.json(books);
    } catch (error) {
      res.status(500).send({
        message: `Error retrieving books: ${error.message}`,
      });
    }
  },

  findByCategory: (req, res) => {
    let author = req.query.author;
    let title = req.query.title;
    let from = req.query.from;
    let to = req.query.to;
    let year = req.query.year;
    let page = req.query.page;
    let sortD = req.query.sortD;
    let sortBy = req.query.sort;
    let limit = req.query.limit;

    const categories = req.body.categories || [];

    author = author ? author : "";
    title = title ? title : "";
    from = from ? from : 0;
    to = to ? to : 1000000000; // 1 tỷ =)))
    let yearEnd = 0;
    if (!year || year < 1970) {
      year = 1970;
      yearEnd = 3000;
    } else {
      yearEnd = parseInt(year) + 1;
    }

    if (from > to) {
      let temp = from;
      from = to;
      to = temp;
    }
    if (!page || page <= 0) page = 1;
    if (!limit || limit <= 0) limit = 10;
    sortD = sortD ? sortD : "ASC";
    sortBy = sortBy ? sortBy : "id";

    db.category
      .findAll({
        where: {
          id: {
            [db.Op.in]: categories,
          },
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: [[sortBy, sortD]],
        include: [
          {
            model: db.books,
            where: {
              author: {
                [db.Op.substring]: author,
              },
              title: {
                [db.Op.substring]: title,
              },
              price: {
                [db.Op.between]: [from, to],
              },
              publication_date: {
                [db.Op.between]: [
                  new Date(year, 0, 0),
                  new Date(yearEnd, 0, 0),
                ],
              },
            },
          },
        ],
      })
      .then((data) => {
        if (data.length > 0) {
          res.json(data);
        } else {
          res.send({
            message: "No books found !",
          });
        }
      });
  },

  commentFindByBook: (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.comment
      .findAll({
        where: { book_id: id },
        include: [{ model: db.user }],
        order: [["createdAt", "DESC"]],
      })
      .then((data) => {
        if (data) {
          res.json(data);
        } else {
          res.send({
            message: `Cannot find Book with id = ${id}.`,
          });
        }
      });
  },

  comment: (req, res) => {
    (req.body.user_id = req.user_id),
      db.comment.create(req.body).then((data) => {
        if (data) {
          console.log("rs ==>", data);
          res.json(data);
        } else {
          res.send({
            message: `Cannot find Book with id = ${id}.`,
          });
        }
      });
  },
  checkComment: (req, res) => {
    db.user
      .findOne({
        where: { id: req.user_id, isAdmin: 0 },
        include: [
          {
            model: db.order,
            include: [
              {
                model: db.books,
                where: { id: parseInt(req.params.id, 10) },
              },
            ],
          },
        ],
      })
      .then((user) => {
        if (!user || user.orders.length == 0) {
          res.json(false);
        } else {
          res.json(true);
        }
      })
      .catch((error) => {
        console.error("Lỗi truy vấn:", error);
      });
  },
};
