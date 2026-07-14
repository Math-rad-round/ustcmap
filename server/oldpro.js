
const express = require("express");
const router = express.Router();
const path = require("path");
const databaseName = "cluster0";
const Guess = require("./models/Guess.js");
const options = { useNewUrlParser: true, useUnifiedTopology: true, dbName: databaseName};
const fs = require('fs');
const xml2js = require('xml2js');

/**
 * 从 pano.xml 同步获取节点经纬度
 * @param {string} xmlPath - XML 文件路径
 * @param {string} nodeId - 节点ID（如 "node28"）
 * @returns { {lat: number, lng: number} | null }
 */
function getNodePositionSync(xmlPath, nodeId) {
    try {
        const xmlData = fs.readFileSync(xmlPath, 'utf-8');
        let result;
        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(xmlData, (err, parsed) => {
            if (!err) result = parsed;
        });
        if (!result) throw new Error("XML 解析失败");

        // 查找目标 panorama 节点（注意：您的格式是 <panorama> 而非 <node>）
        const panoramas = result.tour?.panorama || [];
        const targetPanorama = Array.isArray(panoramas)
            ? panoramas.find(p => p.userdata?.$?.nodeid === nodeId)
            : panoramas.userdata?.$?.nodeid === nodeId ? panoramas : null;

        if (!targetPanorama?.userdata?.$) return null;

        // 从 userdata 提取经纬度
        const lat = parseFloat(targetPanorama.userdata.$.latitude);
        const lng = parseFloat(targetPanorama.userdata.$.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng };
    } catch (error) {
        console.error(`读取位置失败: ${error.message}`);
        return null;
    }
}
const publicPath = path.resolve(__dirname, "..", "public");

router.post("/add", (req, res) => {
  
  const pos=getNodePositionSync(path.join(publicPath,"guess","pano.xml"), req.body.nodeId);
  const newGuess = new Guess({
    nodeId: req.body.nodeId,
    nodename: req.body.nodename,
    posx: pos.lat,
    posy: pos.lng,
    div: 0,
    meetnum: 0,
    tag:null,
  });
  newGuess.save().then((tmp)=>res.send(tmp)).catch((error) => {
   console.log(error);
   res.status(500).send(error);
  });
});
router.get("/gen",  (req, res) => {
  Guess.aggregate([
    { $sample: { size: 1 } },
  ]).then((tmp)=>{
    console.log(tmp);
    res.send(tmp[0]);
  })
  .catch(err => res.status(500).send(err.message));;
});

router.post("/pass", (req, res) => {
  console.log("pass guess");
  Guess.findOneAndUpdate(
    { nodeId: req.body.nodeId },
    { $inc: {div:  req.body.div,meetnum:1}},
    {new: true},
  ).then((tmp)=>res.send(tmp))
  .catch(err => res.status(500).send(err.message));;
});

router.get('/:target/index.html', (req, res) => {
  res.sendFile(path.join(publicPath,"guess","index.html"), options, (err) => {
    if(err){
      console.log("fuck"+err);
      res.status(err.status).end();
    }
    else{
      console.log('Sent:', req.params.name);
    }
  });
});
router.get('/*/:name', (req, res) => {
  let filePath;
  if(req.params[0]!=undefined){
  const dirs = req.params[0].split('/').filter(Boolean);
    filePath = path.join(publicPath, ...dirs, req.params.name);
  }else{
    filePath = path.join(publicPath, req.params.name);
  }
  res.sendFile(filePath, options, (err) => {
    if(err){
      console.error("bugvr", err);
      res.status(err.status || 500).end();
    } else {
      console.log('Sent:', req.params.name);
    }
  });
});
module.exports = router;
