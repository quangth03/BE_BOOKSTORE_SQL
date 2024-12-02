const db = require("../models");
module.exports = {
  // Thêm sách vào danh sách yêu thích
  addItem: async (req, res) => {
    try {
      // Kiểm tra đầu vào
      if (!req.body.book_id) {
        return res.status(400).send({ message: "Book ID can not be empty!" });
      }
  
      // Tìm hoặc tạo danh sách yêu thích
      let wishList = await db.wishList.findOrCreate({
        where: { user_id: req.user_id },
        defaults: { user_id: req.user_id }, // Nếu không tìm thấy thì tạo mới
      });
      wishList = wishList[0]; // `findOrCreate` trả về [instance, created]
  
      // Kiểm tra sách tồn tại
      const book = await db.books.findOne({ where: { id: req.body.book_id } });
      if (!book) {
        return res.status(400).send({ message: "Book not found!" });
      }
  
      // Kiểm tra sách trong danh sách yêu thích
      const wishListBook = await db.wishList_books.findOne({
        where: {
          wishList_id: wishList.id,
          book_id: book.id,
        },
      });
  
      if (!wishListBook) {
        // Thêm sách nếu chưa tồn tại
        await db.wishList_books.create({
          wishList_id: wishList.id,
          book_id: book.id,
        });
        return res.status(200).send({ message: "Book added to wishlist successfully!" });
      } else {
        return res.status(400).send({ message: "Book already in wishlist!" });
      }
    } catch (error) {
      console.error("Error adding book to wishlist:", error);
      res.status(500).send({
        message: error.message || "Some error occurred while adding book to wishlist.",
      });
    }
  },

  // Xóa sách khỏi danh sách yêu thích
  removeItem: async (req, res) => {
    const bookId = req.params.bookId;  // Lấy book_id từ URL
    
    if (!bookId) {
      return res.status(400).send({
        message: "Book ID can not be empty!",
      });
    }
  
    // Lấy wishlist của người dùng
    let wishList = await db.wishList.findOne({
      where: {
        user_id: req.user_id,  // Xác định wishlist của người dùng
      },
    });
  
    if (wishList == null) {
      return res.status(400).send({
        message: "Wishlist not found for the user!",
      });
    }
  
    const item = {
      wishList_id: wishList.id,
      book_id: bookId,  // Sử dụng bookId từ URL
    };
  
    try {
      // Xóa sách khỏi danh sách yêu thích
      await db.wishList_books.destroy({
        where: {
          wishList_id: item.wishList_id,
          book_id: item.book_id,
        },
      });
  
      res.status(200).send({
        message: "Book removed from wishlist successfully!",
      });
    } catch (error) {
      res.status(500).send({
        message: error.message || "Some error occurred while removing book from wishlist.",
      });
    }
  },

  // Lấy danh sách yêu thích của người dùng
  getWishlist: async (req, res) => {
    let data = await db.wishList.findOne({
      where: {
        user_id: req.user_id,
      },
      include: [
        {
          model: db.books,
          as: 'booksInWishLists',  // Đảm bảo alias đúng
          attributes: [
            "id",
            "title",
            "author",
            "price",
            "discount",
            "description",
            "publication_date",
            "image",
          ],
          through: { attributes: [] },  // Không cần các thuộc tính khác trong bảng liên kết
        },
      ],
    });

    if (!data || !data.booksInWishLists || data.booksInWishLists.length === 0) {
      // Nếu không có danh sách yêu thích, trả về danh sách trống
      return res.status(200).send([]);
    }

    res.status(200).send(data.booksInWishLists); // Trả về danh sách sách
  },
};
