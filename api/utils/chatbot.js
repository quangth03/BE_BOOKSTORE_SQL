const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

async function extractIntentFromMessage(message) {
  const prompt = `
                  Bạn là chatbot dành riêng cho một cửa hàng sách. Nhiệm vụ của bạn là phân tích nội dung câu hỏi người dùng và trích xuất ý định (intent) cùng thông tin liên quan (nếu có). Trả về kết quả dưới dạng JSON với các trường:

                  - intent: tên ý định (ví dụ: get_discount_books, get_best_seller_books, check_order_status, find_by_author, find_by_category, book_price, book_availability, faq_return_policy, faq_shipping_time, faq_payment_methods, recommend_book, create_description)

                  - title: tên sách nếu người dùng hỏi về sách cụ thể
                  - author: tên tác giả nếu người dùng đề cập đến tác giả
                  - category: thể loại nếu người dùng đề cập đến thể loại sách
                  - orderCode: mã đơn hàng nếu người dùng hỏi về đơn hàng

                  Ví dụ:
                  Câu: "Có sách nào đang khuyến mãi không?"  
                  → { "intent": "get_discount_books", "title": null, "author": null, "category": null, "orderCode": null }

                  Câu: "Sách Dế Mèn Phiêu Lưu Ký còn hàng không?"  
                  → { "intent": "book_availability", "title": "Dế Mèn Phiêu Lưu Ký", "author": null, "category": null, "orderCode": null }

                  Câu: "Bạn có thể tóm tắt sách Nhà Giả Kim không?"
                  → { "intent": "book_summary", "title": "Nhà Giả Kim", "author": null, "category": null, "orderCode": null }

                  Câu: "Tạo mô tả cho sách Nhà Giả Kim của tác giả Paulo Coelho"
                  → { "intent": "create_description", "title": "Nhà Giả Kim", "author": "Paulo Coelho", "category": null, "orderCode": null }

                  Câu: "Có những phương thức thanh toán nào?, Hướng dẫn thanh toántoán"
                  → { "intent": "faq_payment_methods", "title": null, "author": null, "category": null, "orderCode": null }

                  Câu: "Tôi thích sách phiêu lưu và truyện thiếu nhi, bạn gợi ý giúp?"
                  → { "intent": "recommend_book", "title": null, "author": null, "category": "truyện thiếu nhi", "orderCode": null }

                  Câu: "Tôi muốn mua sách về khoa học, bạn có gợi ý không?"
                  → { "intent": "recommend_book", "title": null, "author": null, "category": "khoa học", "orderCode": null }

                  Khi trích xuất tên sách, hãy đảm bảo lấy đúng tiêu đề sách được nhắc đến trong câu hỏi, không tự suy luận hoặc thay đổi tên sách. Nếu không chắc chắn, để title là null.

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

async function getGeminiSummary(title) {
  // const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-pro" });
  const prompt = `
    Hãy tóm tắt ngắn gọn nội dung của cuốn sách có tựa đề "${title}" bằng tiếng Việt.
    Trình bày tối đa 7 dòng và dễ hiểu, truyền cảm cho người đọc.
    Chia thành 1-2 đoạn nhỏ.
    Nếu bạn không biết sách này, hãy trả lời là bạn không chắc chắn về nội dung của nó.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return response.trim();
}

async function getGeminiDescription(title, author) {
  const prompt = `
  Hãy viết một đoạn mô tả ngắn gọn (không quá 3 dòng) bằng tiếng Việt cho cuốn sách có tựa đề "${title}" của tác giả "${author}". 
  Mô tả cần rõ ràng, dễ hiểu, truyền cảm hứng hoặc hấp dẫn người đọc.
  Nếu bạn không có đủ thông tin về cuốn sách này, hãy nói rằng bạn không chắc chắn về nội dung của nó.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return response.trim();
}
module.exports = {
  extractIntentFromMessage,
  getGeminiSummary,
  getGeminiDescription,
};
