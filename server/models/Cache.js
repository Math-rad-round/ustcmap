const mongoose = require("mongoose");

const CacheSchema = new mongoose.Schema({
    Date: Date,
    content: String,
    id: String,
});

// compile model from schema
module.exports = mongoose.model("Cache", CacheSchema);
