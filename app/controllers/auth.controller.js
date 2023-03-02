const config = require("../config/index");
const USER = require("../models/user.model");

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

function getTime() {
  let today = new Date();
  let date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let dateTime = time + ' ' + date;
  return dateTime;
}

exports.signup = async (req, res) => {
  try {
    const checkPhone = USER.findOne({ phone: req.body.phone });
    if (checkPhone) {
      res.status(400).send({ message: "Số điện thoại đã tồn tại !" });
    } else {
      const user = new USER({
        fullName: req.body.fullName,
        phone: req.body.phone,
        avatar: req.body.avatar,
        password: bcrypt.hashSync(req.body.password, 8),
        createAt: getTime(),
        lastAccess: getTime(),
        requestContact: [],
        contacts: []
      });
      await user.save();
      res.status(200).send({ message: "Đăng ký tài khoản mới thành công !!!" });
    }
  } catch (error) {
    console.error(error);
  }
};

// Làm phần SignIn, SignOut