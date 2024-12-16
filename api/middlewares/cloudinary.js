require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cấu hình cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.SECRET_KEY,
});

// Cấu hình storage với multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Tên folder trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"], // Định dạng file cho phép
  },
});

// Tạo middleware upload
const upload = multer({ storage });

module.exports = { upload };
