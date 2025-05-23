const db = require("../models"); // Đảm bảo đúng đường dẫn tới Sequelize models
const { Op } = require("sequelize");

const CANCEL_TIME_MINUTES = 104; // 1 giờ 40 phút
const JOB_INTERVAL_MINUTES = 5; // Kiểm tra mỗi 5 phút

const autoCancelExpiredOrders = async () => {
  const now = new Date();
  const expireThreshold = new Date(
    now.getTime() - CANCEL_TIME_MINUTES * 60 * 1000
  );

  try {
    const expiredOrders = await db.order.findAll({
      where: {
        status: 1, // Chờ thanh toán
        payment_method: "online",
        createdAt: {
          [Op.lt]: expireThreshold,
        },
      },
    });

    for (const order of expiredOrders) {
      console.log(
        "Đơn tạo lúc:",
        order.createdAt,
        "→ So với:",
        expireThreshold
      );
      await db.order.update(
        { status: 7 }, // Đơn hàng đã huỷ
        { where: { id: order.id } }
      );
    }
  } catch (err) {
    console.error("❗Lỗi khi huỷ đơn hàng hết hạn:", err);
  }
};

// Chạy định kỳ mỗi X phút
setInterval(autoCancelExpiredOrders, JOB_INTERVAL_MINUTES * 60 * 1000);

// Chạy ngay 1 lần khi server khởi động
autoCancelExpiredOrders();
