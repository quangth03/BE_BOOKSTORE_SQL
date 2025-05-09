module.exports = (sequelize, Sequelize, DataTypes) => {
  const User = sequelize.define(
    "user", // Model name
    {
      // Attributes
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      phone_number: {
        type: DataTypes.STRING,
        defaultValue: "0",
      },
      full_name: {
        type: DataTypes.STRING,
        defaultValue: "tên",
      },
      address: {
        type: DataTypes.STRING,
        defaultValue: "địa chỉ",
      },
      avatar: {
        type: DataTypes.STRING,
        defaultValue: "avatar",
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isDelete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      blockReason: {
        type: DataTypes.STRING,
        // allowNull: false, // neu nhu vay no se loi o try trong ham signup
      },
      // Thêm trường isVerified để lưu trạng thái xác nhận email
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // Thêm trường verificationToken để lưu mã xác nhận email
      verificationToken: {
        type: DataTypes.STRING,
      },
    },
    {
      // Triggers
      hooks: {
        afterCreate: (user, options) => {
          console.log("User created: " + user.id);
          sequelize.models.cart.create({ user_id: user.id }).then((cart) => {
            console.log("Cart created: " + cart.id);
          });
        },
      },
    }
  );

  return User;
};
