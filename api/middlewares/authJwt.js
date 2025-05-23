const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

module.exports = {
  verifyToken_Admin: (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(403).send({ message: "No token provided!" });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .send({ message: `Unauthorized! Error: ${err.message}` });
      } else if (!decoded.isAdmin) {
        return res.status(403).send({ message: "Require Admin Role!" });
      }
      req.user_id = decoded.id;
      req.isAdmin = decoded.isAdmin;
      req.isVip = decoded.isVip;
      next();
    });
  },

  verifyToken_User: (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(403).send({ message: "No token provided!" });
    }
    jwt.verify(token, config.secret, (err, decoded) => {
      //decoded là thông tin đã giải mã từ token
      if (err) {
        return res
          .status(401)
          .send({ message: `Unauthorized! Error: ${err.message}` });
      }
      req.user_id = decoded.id;
      req.isVip = decoded.isVip;
      return next();
    });
  },
};
