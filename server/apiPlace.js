

const express = require("express");
const Place = require("./models/Place.js");
const router = express.Router();
router.get('/nearby', async (req, res) => {
  const { latitude, longitude, maxDistance = 100,num=10 } = req.query;
  console.log('收到查询附近地点请求，位置：', latitude, longitude, '最大距离：', maxDistance);
  Place.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance 
      }
    }
  }).limit(num).then((places) => {
    res.status(200).send(places);
  }).catch((err) => {
    console.error(err);
    res.status(500).send(error);
  });
});

router.post("/savepos", (req, res) => {
    const newplace = new Place({
        name:req.body.name,
        pos:req.body.pos,
        location:{
            type: "Point",
            coordinates: [req.body.longitude, req.body.latitude],
        }
    });
    newplace.save().then((reply) => res.send(reply))
        .catch((error) => {
         console.log(error);
        res.status(500).send(error); });
});

module.exports = router;
