
const express = require("express");
const router = express.Router();
const path = require("path");
const databaseName = "cluster0";
const options = { useNewUrlParser: true, useUnifiedTopology: true, dbName: databaseName};
const publicPath = path.resolve(__dirname, "..", "public");

const checker = require('./jwtThings.js');
const User = require("./models/User.js");
router.post("/addtime", (req,res)=>{
  if(!req.body.Authorization || req.body.Authorization == ""){
    res.status(200).send("no user");
    return;
  }
  User.findOneAndUpdate(
    {_id:checker.getID(req.body.Authorization)},
    {$inc:{studytime:req.body.time}},
    {new:true}
  ).then((user)=>{
    res.send(user);
  }).catch((error) => {
    console.log("data base not found: \n"+error);
    res.status(404).send({});
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
      console.error("bugvrroom", err);
      res.status(err.status || 500).end();
    } else {
      console.log('Sent:', req.params.name);
    }
  });
});
module.exports = router;
