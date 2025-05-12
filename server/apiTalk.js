

const express = require("express");
const User = require("./models/User.js");
const Talk = require("./models/Talk.js");
const router = express.Router();
const checker = require('./jwtThings.js');
router.get("/talks", (req, res) => {
    Talk.find({parent: req.query._id}).then((tmp)=>{res.send(tmp)}).catch((error) => {
      console.log("data base not found: \n"+error);
      res.status(404).send({});
    });
});


router.post("/talk", (req, res) => {
  if(!req.body.Authorization || req.body.Authorization == ""){
    res.status(403).send("please login first");
    return;
  }
    const id=checker.getID(req.body.Authorization);
    User.findOne({_id:id}).then((per)=>{
    const newTalk = new Talk({
        author:{
            name:per.name,
            _id:id,
        },
        date:req.body.date,
        content:req.body.content,
        sequence:req.body.sequence,
        parent: req.body.parent,
    });
    newTalk.save()
           .then((newTalk) => res.send(newTalk))
           .catch((error) => {
             console.log(error);
             res.status(500).send(error);
           });
    });
});

module.exports = router;
