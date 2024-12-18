const userController = require("../controllers/user.controller");
const bookController = require("../controllers/book.controller");
const categoryController = require("../controllers/category.controller");
const orderController = require("../controllers/order.controller");
const cartController = require("../controllers/cart.controller");
const dashboardController = require("../controllers/dashboard.controller");
const commentController = require("../controllers/comment.controller");
const discountController = require("../controllers/discount.controller");
const { upload } = require("../middlewares/cloudinary");
const router = require("express").Router();
const verify = require("../middlewares/authJwt").verifyToken_Admin;

module.exports = (app) => {
  // get profile
  router.get("/profile", verify, userController.findByid);

  // update user
  router.put("/profile", verify, userController.updateProfile);

  // get all users
  router.get("/users", verify, userController.findAll);
  router.delete("/users/:id", verify, userController.delete);
  router.put("/users/restore/:id", verify, userController.restore);

  // get user's profile
  router.get("/users/:id", verify, userController.findByid);

  // add category
  router.post("/categories", verify, categoryController.create);

  // update category
  router.put("/categories/:id", verify, categoryController.update);

  // delete category
  router.delete("/categories/:id", verify, categoryController.delete);
  // get all categories
  router.get("/categories", categoryController.adminFindAll);

  // Create a new Book
  router.post("/books", verify, bookController.create);

  // Update a Book with id
  router.put("/books/id/:id", verify, bookController.update);
  router.put("/books/restore/:id", verify, bookController.restore);
  // find books by category
  router.post("/books/category", bookController.findByCategory);

  // Delete a Book with id
  router.delete("/books/:id", verify, bookController.delete);

  // Retrieve all Books
  router.get("/books", bookController.adminFindAll);

  // find a single book with id
  router.get("/books/:id", bookController.findByid);

  // add category to book
  router.post("/books/:id/categories", bookController.addBook_Category);

  // remove category from book

  router.delete(
    "/books/:id/categories",
    verify,
    bookController.removeBook_Category
  );

  // get All Oders
  router.get("/order/all", verify, orderController.getAllOder);

  router.post("/order/update", verify, orderController.updateOrder);

  // get order by user id
  router.get("/order/user/:id", verify, orderController.getOders);

  // get order by id
  router.get("/order/:id", verify, orderController.getOderDetails);

  // change password
  router.put("/password", verify, userController.changePassword);

  // get category by id
  router.get("/categories/:id", categoryController.findById);
  router.get("/stats", dashboardController.getDashboardStats);

  // get all cmt
  router.get("/comments", verify, commentController.findAll);

  router.delete("/comment/:id", verify, commentController.delete);
  router.get("/discounts", discountController.getAllDiscounts);
  router.get("/discounts/valid", discountController.getValidDiscounts);
  router.get("/discounts/:id", discountController.getDiscountById);
  router.post("/discounts", discountController.createDiscount);
  router.put("/discounts/:id", discountController.updateDiscount);
  router.delete("/discounts/:id", discountController.deleteDiscount);

  router.post("/blockUserAndSendEmail", userController.blockUserAndSendEmail);

  router.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }
    res.status(200).send({ imageUrl: req.file.path });
  });

  app.use("/admin", router);
};
