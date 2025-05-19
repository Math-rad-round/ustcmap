const mongoose = require("mongoose");

const GuessSchema = new mongoose.Schema({
    nodename: String,
    nodeId: String,
    posx: Number,
    posy: Number,
    meetnum: Number,
    tag:String,
    div: Number
});

module.exports = mongoose.model("Guess", GuessSchema);
