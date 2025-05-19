const mongoose = require("mongoose");

const TalkSchema = new mongoose.Schema({
    author:{
        name: String,
        _id: String,
    },
    date:Date,
    sequence:Number,
    content:String,
    parent: String,
});

module.exports = mongoose.model("Talk", TalkSchema);
