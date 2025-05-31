
const express = require("express");
const router = express.Router();
const path = require("path");
const databaseName = "cluster0";
const Guess = require("./models/Guess.js");
const options = { useNewUrlParser: true, useUnifiedTopology: true, dbName: databaseName};

const publicPath = path.resolve(__dirname, "..", "public");
router.post("/add", (req, res) => {
  const newGuess = new Guess({
    nodeId: req.body.nodeId,
    nodename: req.body.nodename,
    posx: req.body.posx,
    posy: req.body.posy,
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
  ]).then((tmp)=>{console.log(tmp);res.send(tmp[0]);})
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
