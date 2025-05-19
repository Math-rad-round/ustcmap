
const express = require("express");
const router = express.Router();
const path = require("path");
const databaseName = "cluster0";
const Cache = require("./models/Cache.js");

const options = { useNewUrlParser: true, useUnifiedTopology: true, dbName: databaseName};
const publicPath = path.resolve(__dirname, "..", "public");
router.get('/pos', (req, res) => {
    Cache.findOne({id: req.query.id}).then((tmp)=>{res.send(tmp)}).catch((error) => {
      console.log("cache base not found: \n"+error);
      res.status(404).send({});
    });
});
router.post('/del',(req,res)=>{
  const Onehourago= new Date(Date.now() - 60 * 60 * 1000);
  Cache.deleteMany({ date: { $lt: Onehourago } })
    .then(() => {
      console.log('Old documents deleted successfully');
      res.status(200).send('Old documents deleted successfully');
    })
    .catch((error) => {
      console.error('Error deleting old documents:');
      res.status(500).send('Error deleting old documents');
    });
});
router.get('/:id/*/:name', (req, res) => {
  const dirs = req.params[0].split('/').filter(Boolean);
  const filePath = path.join(publicPath, ...dirs, req.params.name);
 // console.log("dirs", dirs);
  Cache.findOneAndUpdate(
      { id: req.params.id }, // 查询条件
      { 
        $set: { 
          date: new Date(), // 将 date 字段设置为当前时间
          content: dirs[2]
        }
      },
      {
        upsert: true,    // 如果不存在则创建
      }
    ).then(()=>
      res.sendFile(filePath, options, (err) => {
        if(err){
          console.error("bugvr");
          res.status(err.status || 500).end();
        } else {
        // console.log('Sent:', req.params.name);
        }
      })
    ).catch((error) => {
      console.log("cache base not found: \n"+error);
      res.status(404).send({});
    });
});
module.exports = router;
