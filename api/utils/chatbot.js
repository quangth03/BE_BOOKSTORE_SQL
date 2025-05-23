const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractIntentFromMessage(message) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

  const prompt = `
                  Bạn là chatbot dành riêng cho một cửa hàng sách. Nhiệm vụ của bạn là phân tích nội dung câu hỏi người dùng và trích xuất ý định (intent) cùng thông tin liên quan (nếu có). Trả về kết quả dưới dạng JSON với các trường:

                  - intent: tên ý định (ví dụ: get_discount_books, get_best_seller_books, check_order_status, find_by_author, find_by_category, book_price, book_availability, faq_return_policy, faq_shipping_time)
                  - title: tên sách nếu người dùng hỏi về sách cụ thể
                  - author: tên tác giả nếu người dùng đề cập đến tác giả
                  - category: thể loại nếu người dùng đề cập đến thể loại sách
                  - orderCode: mã đơn hàng nếu người dùng hỏi về đơn hàng

                  Ví dụ:
                  Câu: \"Có sách nào đang khuyến mãi không?\"  
                  → { \"intent\": \"get_discount_books\", \"title\": null, \"author\": null, \"category\": null, \"orderCode\": null }

                  Câu: \"Sách Dế Mèn Phiêu Lưu Ký còn hàng không?\"  
                  → { \"intent\": \"book_availability\", \"title\": \"Dế Mèn Phiêu Lưu Ký\", \"author\": null, \"category\": null, \"orderCode\": null }

                  Chỉ trả về kết quả JSON đúng định dạng trên. Không giải thích gì thêm.

                  Câu hỏi: "${message}"
                  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  console.log("Gemini raw response:", response);

  // Loại bỏ markdown code block nếu có
  const cleaned = response
    .replace(/```json\n?/, "") // Xóa mở đầu ```json
    .replace(/```/, "") // Xóa kết thúc ```
    .trim();
  console.log("cleaned", cleaned);

  return JSON.parse(cleaned);
}

module.exports = { extractIntentFromMessage };
