const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const dbconfig = require("./api/config/db.config");

app.use(helmet()); // bảo mật http

// const corsOptions = {
//     origin: "http://localhost:8080"
// };

app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// database
const db = require("./api/models");
db.sequelize.sync({ alter: false }); // tạo bảng mới nếu chưa có, không thay đổi bảng đã có

//routes
require("./api/routes/auth.router")(app);
require("./api/routes/admin.router")(app);
require("./api/routes/user.router")(app);

require("./api/utils/autoCancel");

const port = dbconfig.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

console.log("RESTful API server started on: " + port);
