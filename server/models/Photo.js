const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
    parent:String,
    content:mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model("Photo", PhotoSchema);
