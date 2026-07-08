const mongoose = require("mongoose");

const SavegameSchema = new mongoose.Schema({
  regdate: String,
  visdate: String,
  gamename: String,
  savename: String, 
  gamedata: Object,
  parent: String,
  times: { type: Number, default: 0 },
  otherdata: Object
});

module.exports = mongoose.model("Savegame", SavegameSchema);