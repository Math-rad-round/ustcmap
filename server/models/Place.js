const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: String,
  pos:String,
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: {
      type: [Number], // 经度、纬度
      required: true
    }
  }
});

placeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Place', placeSchema);

