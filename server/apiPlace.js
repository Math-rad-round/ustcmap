

const express = require("express");
const Place = require("./models/Place.js");
const router = express.Router();
router.get('/nearby', (req, res) => {
  const { latitude, longitude, maxDistance = 1000, num = 10 } = req.query;
  const baseDistance = maxDistance;
  console.log('收到查询附近地点请求，位置：', latitude, longitude, '基础距离：', baseDistance);
  
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  const baseDist = parseFloat(baseDistance);
  
  Place.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat]
        },
        distanceField: "distance",
        maxDistance: baseDist,
        spherical: true,
        key: "location"
      }
    },
    {
      $addFields: {
        // 直接计算排序得分：距离 ÷ 优先级权重
        sortScore: {
          $switch: {
            branches: [
              { case: { $eq: ["$priority", 1] }, then: "$distance" },        // 距离 ÷ 1
              { case: { $eq: ["$priority", 2] }, then: { $multiply: ["$distance", 2] } }, // 距离 ÷ 0.5
              { case: { $eq: ["$priority", 3] }, then: { $multiply: ["$distance", 3] } }  // 距离 ÷ 0.25
            ],
            default: { $multiply: ["$distance", 4] } // 距离 ÷ 0.125
          }
        },
        // 计算有效搜索范围
        maxAllowedDistance: {
          $switch: {
            branches: [
              { case: { $eq: ["$priority", 1] }, then: baseDist },       // 100%
              { case: { $eq: ["$priority", 2] }, then: baseDist * 0.5 }, // 50%
              { case: { $eq: ["$priority", 3] }, then: baseDist * 0.3333 } // 25%
            ],
            default: baseDist * 0.25 // 12.5%
          }
        }
      }
    },
    {
      // 筛选：距离必须在有效范围内
      $match: {
        $expr: { $lt: ["$distance", "$maxAllowedDistance"] }
      }
    },
    {
      // 按排序得分升序排列（得分越低越靠前）
      $sort: {
        sortScore: 1
      }
    },
    {
      $limit: parseInt(num)
    }
  ])
  .then((places) => {
    console.log(`找到 ${places.length} 个附近地点`);
    res.send(places);
  })
  .catch(err => res.status(500).send(err.message));
});

router.post("/savepos", (req, res) => {
    const newplace = new Place({
        name:req.body.name,
        pos:req.body.pos,
        location:{
            type: "Point",
            coordinates: [req.body.longitude, req.body.latitude],
        },
        priority: req.body.priority || 4,
    });
    newplace.save().then((reply) => res.send(reply))
        .catch((error) => {
         console.log(error);
        res.status(500).send(error); });
});

module.exports = router;
