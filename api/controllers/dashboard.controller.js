const db = require("../models"); // Import models

// Hàm lấy thống kê
exports.getDashboardStats = async (req, res) => {
  try {
    // Lấy số lượng người dùng, đơn hàng, sách và thể loại
    const userCount = await db.user.count();
    const orderCount = await db.order.count();
    const bookCount = await db.books.count();
    const genreCount = await db.category.count();

    // Tính tổng doanh thu theo từng tháng
    const revenueByMonth = await db.order.findAll({
      attributes: [
        [
          db.sequelize.fn(
            "DATE_FORMAT",
            db.sequelize.col("createdAt"),
            "%Y-%m"
          ),
          "month",
        ], // Định dạng tháng
        [db.sequelize.fn("SUM", db.sequelize.col("total")), "total_revenue"], // Tính tổng doanh thu
      ],
      group: ["month"], // Nhóm theo tháng
      order: [[db.sequelize.literal("month"), "ASC"]], // Sắp xếp theo tháng
    });

    const revenueData = revenueByMonth.map((item) => ({
      month: item.get("month"),
      total: item.get("total_revenue"),
    }));
    const totalRevenue = await db.order.sum("total");

    const topSellingBooks = await db.order_details.findAll({
      attributes: [
        [db.sequelize.col("book.title"), "title"], // Lấy tên sách
        [
          db.sequelize.fn("SUM", db.sequelize.col("order_detail.quantity")),
          "total_sold",
        ], // Tổng số lượng bán
      ],
      include: [
        {
          model: db.books,
          attributes: [],
        },
      ],
      group: ["book_id"],
      order: [[db.sequelize.literal("total_sold"), "DESC"]],
      limit: 5,
    });

    const topBook = topSellingBooks.map((item) => ({
      title: item.get("title"),
      totalSold: item.get("total_sold"),
    }));

    res.json({
      users: userCount,
      orders: orderCount,
      books: bookCount,
      genres: genreCount,
      revenueByMonth: revenueData,
      totalRevenue: totalRevenue,
      topBook: topBook,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error.message);
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy thống kê",
      error: error.message,
    });
  }
};
