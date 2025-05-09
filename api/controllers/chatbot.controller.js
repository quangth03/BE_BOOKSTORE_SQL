const db = require("../models");
const { extractIntentFromMessage } = require("../utils/chatbot");
const { getTopSellingBooks } = require("./book.controller");

module.exports = {
  ask: async (req, res) => {
    const { message } = req.body;

    try {
      const { intent, title, author, category, orderCode } =
        await extractIntentFromMessage(message);

      let reply = "";

      switch (intent) {
        case "get_discount_books": {
          const books = await db.books.findAll({
            where: { discount: { [db.Op.gt]: 0 } },
            order: db.sequelize.random(),
            limit: 20,
          });
          reply = books.length
            ? `Các sách đang giảm giá: ${books.map((b) => b.title).join(", ")}`
            : "Hiện không có sách nào đang giảm giá.";
          break;
        }
        case "get_best_seller_books": {
          const topSellingBooks = await db.order_details.findAll({
            attributes: [
              [
                db.sequelize.fn(
                  "SUM",
                  db.sequelize.col("order_detail.quantity")
                ), // Tính tổng số lượng bán
                "total_sold",
              ],
            ],
            include: [
              {
                model: db.books, // Liên kết với bảng books để lấy thông tin sách
                attributes: ["id", "title", "image", "price", "discount"], // Lấy các thuộc tính title, image, price, discount từ bảng books
              },
            ],
            group: ["book_id"], // Nhóm theo book_id
            order: [[db.sequelize.literal("total_sold"), "DESC"]], // Sắp xếp theo tổng số lượng bán
            limit: 5, // Giới hạn số lượng sách
          });
          const topBook = topSellingBooks.map((item) => ({
            id: item.book.id,
            title: item.book.title, // Lấy tên sách từ model book
            image: item.book.image, // Lấy ảnh sách từ model book
            price: item.book.price, // Lấy giá sách từ model book
            discount: item.book.discount, // Lấy giảm giá sách từ model book
            totalSold: item.get("total_sold"), // Lấy tổng số lượng bán
          }));
          reply = `Top sách bán chạy: ${topBook
            .map((b) => b.title)
            .join(", ")}`;
          break;
        }
        // case "check_order_status": {
        //   const order = await Order.findOne({ code: orderCode });
        //   reply = order
        //     ? `Đơn hàng ${order.code} hiện đang ở trạng thái: ${order.status}`
        //     : "Không tìm thấy đơn hàng.";
        //   break;
        // }
        // case "find_by_author": {
        //   const books = await Book.find({ author: new RegExp(author, "i") });
        //   reply = books.length
        //     ? `Các sách của ${author}: ${books.map((b) => b.title).join(", ")}`
        //     : `Không tìm thấy sách của ${author}.`;
        //   break;
        // }
        // case "find_by_category": {
        //   const books = await Book.find({
        //     category: new RegExp(category, "i"),
        //   });
        //   reply = books.length
        //     ? `Các sách thuộc thể loại ${category}: ${books
        //         .map((b) => b.title)
        //         .join(", ")}`
        //     : `Không có sách trong thể loại ${category}.`;
        //   break;
        // }
        // case "book_price": {
        //   const book = await Book.findOne({ title: new RegExp(title, "i") });
        //   reply = book
        //     ? `Giá của sách '${
        //         book.title
        //       }' là ${book.price.toLocaleString()} VND`
        //     : `Không tìm thấy sách '${title}'.`;
        //   break;
        // }
        case "book_availability": {
          const book = await Book.findOne({ title: new RegExp(title, "i") });
          reply = book
            ? `${book.title} ${book.inStock ? "còn hàng" : "đã hết hàng"}`
            : `Không tìm thấy sách '${title}'.`;
          break;
        }
        case "faq_return_policy": {
          reply =
            "Bạn có thể đổi trả sách trong vòng 7 ngày nếu còn nguyên tem, chưa sử dụng.";
          break;
        }
        case "faq_shipping_time": {
          reply = "Thời gian giao hàng dự kiến từ 2-4 ngày làm việc.";
          break;
        }
        default:
          reply = "Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn.";
      }

      return res.json({ reply });
    } catch (err) {
      console.error("Gemini chatbot error:", err);
      // Nếu lỗi 503 từ Gemini
      if (err.status === 503 || err.message?.includes("503")) {
        return res
          .status(503)
          .json({ reply: "Gemini chatbot is currently unavailable." });
      }
      res.status(500).json({ error: "Lỗi phân tích từ Gemini." });
    }
  },
};
