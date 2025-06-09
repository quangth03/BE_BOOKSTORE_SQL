const db = require("../models");
const {
  extractIntentFromMessage,
  getGeminiSummary,
  getGeminiDescription,
} = require("../utils/chatbot");

module.exports = {
  ask: async (req, res) => {
    const { message } = req.body;

    try {
      const { intent, title, author, category } =
        await extractIntentFromMessage(message);

      let reply = "";

      switch (intent) {
        case "create_description": {
          try {
            const description = await getGeminiDescription(title, author);
            reply = description;
          } catch (err) {
            console.error("Gemini description error:", err);
            reply =
              "Xin lỗi, không thể tạo mô tả sách do lỗi kết nối đến Gemini.";
          }
          break;
        }
        case "book_summary": {
          if (!title) {
            reply = "Bạn vui lòng cung cấp tên sách cần tóm tắt.";
            break;
          }

          try {
            const summary = await getGeminiSummary(title);
            reply = `Tóm tắt sách "${title}": ${summary}`;
          } catch (err) {
            console.error("Gemini summary error:", err);
            reply =
              "Xin lỗi, không thể tóm tắt sách do lỗi kết nối đến Gemini.";
          }
          break;
        }
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
        // case "recommend_book": {
        //   const book = await db.books.findOne({
        //     where: {
        //       category: {
        //         [Op.like]: `%${category}%`
        //       },
        //       isDelete: 0,
        //     },
        //     order: db.sequelize.random(), // lấy ngẫu nhiên
        //   });
        //   break;
        // }
        case "faq_payment_methods": {
          reply =
            "Chúng tôi hỗ trợ các phương thức thanh toán sau: " +
            "1. Thanh toán tiền mặt, 2. Thanh toán qua ví điện tử Momo";
          break;
        }
        case "book_availability": {
          const book = await db.books.findOne({
            where: db.sequelize.where(
              db.sequelize.fn("LOWER", db.sequelize.col("title")),
              "LIKE",
              `%${title.toLowerCase()}%`
            ),
          });

          console.log(book);
          reply = book
            ? `${book.title} ${book.quantity ? "còn hàng" : "đã hết hàng"}`
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
        case "out_of_scope": {
          reply =
            "Xin lỗi, tôi là chatbot hỗ trợ thông tin liên quan đến cửa hàng sách. Câu hỏi của bạn hiện nằm ngoài phạm vi hỗ trợ của tôi. Bạn vui lòng đặt câu hỏi trong phạm vi đó nhé.";
          break;
        }
        default:
          reply = "Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn.";
      }
      console.log("reply:", reply);
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
