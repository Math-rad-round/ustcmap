
const m3u8Make = require("./m3u8Maker.js");

//asdfsda

const express = require("express");
//asdsfaf
const checker = require('./jwtThings.js');
const User = require("./models/User.js");
const App = require("./models/App.js");
const Photo = require("./models/Photo.js");
const Tags = require("./models/Tags.js");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const ObjectId = require('mongoose').Types.ObjectId;
const isValid = (id) => {
  console.log("check is valid: "+id);
  if(id && ObjectId.isValid(id)){
        if((String)(new ObjectId(id)) === id)
            return true;
        return false;
    }
    return false;
}
// router.get("/test",(req, res)=>{
//   console.log(req.query);
//   let e=checkAuthorityApp(req.query.token,req.query._id);
//   console.log(e);
//   res.send(e);
// });

router.get("/tags", (req, res) => {
  Tags.find({}).then((tags) => res.send(tags))
               .catch((error) => res.status(500).send(error));
})

router.get("/appinfo", (req, res) => {
    if(!isValid(req.query._id)){
      res.status(500).send("fuck you wrong id format");
      return;
    }
    App.findOne({_id: req.query._id})
    .then((tmp)=>{res.send(tmp)})
    .catch((error) => {
      console.log("data base not found: \n"+error);
      res.status(404).send({});
    });
});

router.get("/appdescribe", (req, res) => {
    if(!isValid(req.query._id)){
      res.status(500).send("fuck you wrong id format");
      return;
    }
    App.findOne({_id: req.query._id})
    .then((tmp)=>{res.send(tmp)})
    .catch((error) => {
      console.log("data base not found: \n"+error);
      res.status(404).send({});
    });
});
router.get("/appdownload", (req, res) => {
    if(!isValid(req.query._id)){
      res.status(500).send("fuck you wrong id format");
      return;
    }
    App.findOne({_id: req.query._id})
    .then((tmp)=>{res.send(tmp)})
    .catch((error) => {
      console.log("data base not found: \n"+error);
      res.status(404).send({});
    });
});

const getTagsByTagIds = async function (tagIds){
  return await Promise.all(
    tagIds.map((tagId) => {
      return (async() => {
        return await Tags.findOne({_id: tagId})
      })();
    }),
  );

}

router.post("/appinfo", (req, res) => {
    if(!req.body.Authorization || req.body.Authorization == ""){
      res.status(403).send("please login first");
      return;
    }
  
    User.find({_id: checker.getID(req.body.Authorization)})
    .then((users) => {
        if(users.length != 1){
          res.status(403).send("user not found");
          return;
        }
        const user = users[0];
        if(user.type!="高级用户"){
          
          res.status(403).send("no auther");
          return;
        }
        let nowDate = new Date().toLocaleDateString();
      
        if(req.body._id === undefined){
            getTagsByTagIds(req.body.tags)
            .then((tags) => new App({
                name: req.body.name,
                realname: req.body.realname,
//                authors: [{name: "qwerty", _id: 123}],//TODO: 
                authors: [{name: user.name, _id: user._id}],
                describe: req.body.description,
                createdate: nowDate,
                updatedate: nowDate,
            }).save())
            .then((app) => {
                fs.copyFileSync(path.join(__dirname, "upload", "defaultapplogo.jpg"),
                                path.join(__dirname, "upload", "applogo", String(app._id)));
                console.log("success");
                res.send(app);
            })
            .catch((error) => {
              console.log(error);
              res.status(500).send(error);
              return;
            });
        }
        else{
          if(!isValid(req.body._id)){
            res.status(500).send("fuck you wrong id format");
            return;
          }
          
          App.find({_id: req.body._id}).then((apps) => {
              if(apps.length != 1){
                  res.status(403).send("app not found");
                  return;
              }
              if(!apps[0].authors.map((author) => (String(author._id))).includes(user.id)){
                  res.status(403).send("permission deny");
                  return;
              }
              getTagsByTagIds(req.body.tags)
              .then((tags) => App.findOneAndUpdate({_id:req.body._id},{
                  links: req.body.links,
                  tags: tags,
                  platforms: req.body.platforms,
                  describe: req.body.description,
                  updatedate: nowDate,
                  web: req.body.web,
              },{new: true}))
              .then((app) => {
                  console.log("success");
                  res.send(app);
              })
              .catch((error) => {
                  console.log(error);
                  res.status(500).send(error);
                  return;
              });
          });
        }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("user not found");
    })
});

const multer = require("multer");
const logoStorage = multer.diskStorage({
  destination: function(req, file, cb){
    return cb(null, path.join(__dirname, "upload", "applogo"));
  },
  filename: function(req, file, cb){
    return cb(null, file.fieldname+'-'+Date.now()+"."+file.mimetype.split('/')[1]);
  },
});
const videoStorage = multer.diskStorage({
  destination: function(req, file, cb){
    return cb(null, path.join(__dirname, "upload", "appvideo"));
  },
  filename: function(req, file, cb){
    return cb(null, file.fieldname+'-'+Date.now());
  },
});
const downloadStorage = multer.diskStorage({
  destination: function(req, file, cb){
    return cb(null, path.join(__dirname, "upload", "appdownload"));
  },
  filename: function(req, file, cb){
    return cb(null, file.fieldname+'-'+Date.now()+"-"+file.originalname);
  },
});
const fileFilter = (req, file, callback) => {//中文编码支持
  file.originalname = Buffer.from(file.originalname, "latin1").toString("utf-8");
  callback(null, true);
}
const videoUpload = multer({ storage: videoStorage, limits: {fileSize: 1024*1024*100}, fileFilter});
const logoUpload = multer({ storage: logoStorage, limits: {fileSize: 1024*1024*10} });
const downloadUpload = multer({ storage: downloadStorage, limits: {fileSize: 1024*1024*100}, fileFilter });

router.post("/appinfo/logo", logoUpload.single("file"), (req, res) => {
  let { size, mimetype } = req.file;
  const allowType = ["jpeg", "jpg", "png"];
  const yourType = mimetype.split('/')[1];
  
  if(size > 1024*1024*10){
    return res.status(500).send("size too large");
  }
  else if(allowType.indexOf(yourType) === -1){
    return res.status(500).send("wrong photo format");
  }
  else{
    //TODO: check Authorization
    checker.checkAuthorityApp(req.body.Authorization,req.body._id).then(()=>{
      fs.renameSync(path.join(__dirname, "upload", "applogo", req.file.filename),
                    path.join(__dirname, "upload", "applogo", req.body._id));
      res.send({status: "success"});
    }).catch((error) => {res.status(422).send(error);});
  }
});

router.get("/search2", (req, res) => {
  App.findOne({realname:req.query.realname}). then((app)=>res.send({project:app})).catch((err)=>res.status(422).send("nofile"+error));});

router.get("/search", (req, res) => {
    let option={};
    if(req.query.content!="") {option["name"]={$regex:req.query.content};}
    if(req.query.platform!="all")option["platforms"]=req.query.platform;
    if(req.query.tag!="all")option["tags"]={$elemMatch:{name:req.query.tag}}
    App.find(option). then((app)=>res.send({projects:app})).catch((err)=>res.status(422).send("nofile"+error));
});
//neraefads  
router.get("/applist",(req,res)=>{
 // console.log(App.find({}).sort({createdate:1,name:1}));
  App.find({}).sort({createdate:1,name:1}).then((app)=>{res.send(app)});
})
router.post("/appdelete",(req,res)=>{
  // console.log(req.body);
  // console.log(req.query);
  checker.checkAuthorityApp(req.body.Authorization,req.body._id).then((result)=>{
    App.deleteOne({_id:req.body._id}).then(res.status(200).send({ans:"完成"})).catch(()=>console.log("error"));
  }).catch((error)=>res.status(422).send(error));
});
router.post("/deletephoto",(req,res)=>{
  checker.checkAuthorityApp(req.body.Authorization,req.body._id).then((rest)=>{
    Photo.deleteOne({parent:req.body._id}).then(res.status(200).send({ans:"完成"})).catch(()=>console.log("error"));
  }).catch((error)=>res.status(422).send(error));
});
router.post("/loadphoto",(req,res)=>{
  console.log("alerting");
   console.log(req.body.type);
  // console.log(req.query);
  checker.checkAuthorityApp(req.body.Authorization,req.body._id).then((rest)=>{
    Photo.findOne({parent:req.body._id,type:req.body.type}).then((result)=>{
      console.log("upping");
      if(result!=null){
        console.log("begina-----------------");
        console.log(result.content.length);
        result.content.push(req.body.content[0]);
          console.log(result.content.length);
        Photo.findOneAndUpdate({parent:req.body._id,type:req.body.type},{$set:{content:result.content}}).then(res.status(200).send({ans:"完成"}));
      }else{
        const newphoto = new Photo({
          parent:req.body._id,
          type:req.body.type,
          content:req.body.content
        });
        console.log(newphoto.type);
        newphoto.save()
        .then((news) => res.status(200).send({ans:"完成"}))
          .catch((error) => {
            console.log(error);
            res.status(500).send(error);});
        }
      console.log("ok");
    });

  }).catch((error)=>res.status(422).send(error));
});
router.get("/getphoto",(req,res)=>{
  Photo.findOne({parent:req.query._id,type:req.query.type}).then((tmp)=>{
    let e=tmp.content.length;
    let k=Math.floor((Math.random()*e)); 
    res.send({str:tmp.content[k]});
  }).catch((error)=>res.status(422).send(error));
});
module.exports = router;
