const userController = require("../controllers/user.controller");
const bookController = require("../controllers/book.controller");
const categoryController = require("../controllers/category.controller");
const orderController = require("../controllers/order.controller");
const cartController = require("../controllers/cart.controller");
const discountController = require("../controllers/discount.controller");
const wishListController = require("../controllers/wishList.controller");
const router = require("express").Router();
const verify = require("../middlewares/authJwt").verifyToken_User;

module.exports = (app) => {
  // get profile
  router.get("/profile", verify, userController.findByid);

  // update user
  router.put("/profile", verify, userController.updateProfile);

  // Retrieve all Books
  router.get("/books", bookController.findAll);

  // find a single book with id
  router.get("/books/id/:id", bookController.findByid);
  router.get("/arrr-books/id/:id", bookController.findAroundByid);

  // find books by category
  router.post("/books/category", bookController.findByCategory);
  router.get("/books/categories/:id", bookController.findAllByCat);

  // get all categories
  router.get("/categories", categoryController.findAll);

  // get cart
  router.get("/cart", verify, cartController.getCart);

  // add item to cart
  router.post("/cart", verify, cartController.addItem);
  router.put("/cart", verify, cartController.update);

  // remove item from cart
  router.delete("/cart", verify, cartController.removeItem);

  // create order
  router.post("/order", verify, orderController.createOder);

  // delete order
  // router.delete("/order", verify, orderController.deleteOrder);

  // get all orders
  router.get("/order", verify, orderController.getOders);

  // get order by id
  router.get("/order/:id", verify, orderController.getOderDetails);

  // get category by id
  router.get("/categories/:id", categoryController.findById);
  // get category by id
  router.get("/comment/book/:id", bookController.commentFindByBook);
  router.get("/comment/check/book/:id", verify, bookController.checkComment);
  router.post("/comment", verify, bookController.comment);
  router.post("/createPay", verify, orderController.createPay);
  router.post("/momoCallBack", orderController.payCallback);

  router.get("/discounts/valid", discountController.getValidDiscounts);

  router.get("/wishList", verify, wishListController.getWishlist);
  router.post("/wishList", verify, wishListController.addItem);
  router.delete("/wishList/:bookId", verify, wishListController.removeItem);

  router.get("/topBooks", verify, bookController.getTopSellingBooks);
  app.use("/user", router);
};
