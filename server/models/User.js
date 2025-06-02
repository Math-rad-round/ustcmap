const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  intro: String,
  type:String,
  regdate:String,
  visdate:String,
  projects:Array,
  links:Array,
  password: String,
  logo: String,
  alldev: { type: Number, default: 0 },  // 默认值 0
  times: { type: Number, default: 0 },
  studytime: { type: Number, default: 0 }
});

// compile model from schema
module.exports = mongoose.model("User", UserSchema);
