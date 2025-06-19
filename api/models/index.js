const config = require("../config/db.config");
const { Sequelize, DataTypes, Op } = require("sequelize");

const sequelize = new Sequelize(
  config.db.DB_NAME,
  config.db.DB_USER,
  config.db.DB_PASS,
  {
    host: config.db.DB_HOST,
    port: config.db.DB_PORT,
    dialect: config.db.dialect,
    dialectOptions: {
      connectTimeout: 60000, // Thời gian kết nối tối đa
    },
    operatorsAliases: false,

    pool: {
      max: config.db.pool.max,
      min: config.db.pool.min,
      acquire: config.db.pool.acquire,
      idle: config.db.pool.idle,
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.Op = Op;
db.sequelize = sequelize;

db.books = require("./book.model.js")(sequelize, Sequelize, DataTypes);
db.user = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.cart = require("./cart.model.js")(sequelize, Sequelize, DataTypes);
db.user_viewed_book = require("./userViewedBook.model.js")(
  sequelize,
  Sequelize,
  DataTypes
);
db.cart_details = require("./cart_details.model.js")(
  sequelize,
  Sequelize,
  DataTypes
);
db.order = require("./order.model.js")(sequelize, Sequelize, DataTypes);
db.order_details = require("./order_details.model.js")(
  sequelize,
  Sequelize,
  DataTypes
);
db.category = require("./category.model.js")(sequelize, Sequelize, DataTypes);
db.book_category = require("./book_category.model.js")(
  sequelize,
  Sequelize,
  DataTypes
);
db.comment = require("./comment.model.js")(sequelize, Sequelize, DataTypes);
db.discount = require("./discount.model.js")(sequelize, Sequelize, DataTypes);
db.wishList = require("./wishList.model.js")(sequelize, Sequelize, DataTypes);
db.wishList_books = require("./wishList_books.model.js")(
  sequelize,
  Sequelize,
  DataTypes
);
// RELATIONSHIPS
// Books vs Category N-N
db.books.belongsToMany(db.category, {
  through: db.book_category,
  foreignKey: "book_id",
});
db.category.belongsToMany(db.books, {
  through: db.book_category,
  foreignKey: "category_id",
});

// Books vs Cart N-N
db.books.belongsToMany(db.cart, {
  through: db.cart_details,
  foreignKey: "book_id",
});
db.cart.belongsToMany(db.books, {
  through: db.cart_details,
  foreignKey: "cart_id",
});

// Books vs Order N-N
db.books.belongsToMany(db.order, {
  through: db.order_details,
  foreignKey: "book_id",
});
db.order.belongsToMany(db.books, {
  through: db.order_details,
  foreignKey: "order_id",
});

// User vs cart
db.user.hasMany(db.cart, { foreignKey: "user_id" });
db.cart.belongsTo(db.user, { foreignKey: "user_id" });

// User vs order
db.user.hasMany(db.order, { foreignKey: "user_id" });
db.order.belongsTo(db.user, { foreignKey: "user_id" });

// comment vs user
db.user.hasMany(db.order, { foreignKey: "user_id", onDelete: "CASCADE" });
db.comment.belongsTo(db.user, { foreignKey: "user_id" });

// comment vs book
db.books.hasMany(db.comment, { foreignKey: "book_id", onDelete: "CASCADE" });
db.comment.belongsTo(db.books, { foreignKey: "book_id" });

//Book Quan hệ với bảng OrderDetail
db.books.hasMany(db.order_details, { foreignKey: "book_id" });
db.order_details.belongsTo(db.books, {
  foreignKey: "book_id",
});

// User và WishList
db.user.hasMany(db.wishList, { foreignKey: "user_id" });
db.wishList.belongsTo(db.user, { foreignKey: "user_id" });

// WishList và WishList_books
db.wishList.hasMany(db.wishList_books, {
  foreignKey: "wishList_id",
  as: "wishListItems",
});
db.wishList_books.belongsTo(db.wishList, {
  foreignKey: "wishList_id",
  as: "wishList",
});

// Books và WishList_books
db.books.hasMany(db.wishList_books, {
  foreignKey: "book_id",
  as: "bookWishLists",
});
db.wishList_books.belongsTo(db.books, { foreignKey: "book_id", as: "book" });

// WishList và Books (Mối quan hệ nhiều-nhiều)
db.wishList.belongsToMany(db.books, {
  through: db.wishList_books,
  foreignKey: "wishList_id",
  as: "booksInWishLists",
});
db.books.belongsToMany(db.wishList, {
  through: db.wishList_books,
  foreignKey: "book_id",
  as: "wishLists",
});

db.user.belongsToMany(db.books, {
  through: db.user_viewed_book,
  foreignKey: "user_id",
  as: "viewedBooks",
});
db.books.belongsToMany(db.user, {
  through: db.user_viewed_book,
  foreignKey: "book_id",
  as: "usersViewed",
});

module.exports = db;
