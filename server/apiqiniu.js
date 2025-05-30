require('dotenv').config();
const express = require('express');
const multer = require('multer');
const qiniu = require('qiniu');
const path = require('path');
const fs = require('fs');

const app = express();
const uploadMiddleware = multer({ dest: 'tmp/' }); // 临时目录
const AK="iMDBprKV-lJtv1CM6G_U5TA4XpVNlWKwqF7UjvAb";
const QB="ustcvrmap";
const QD="";
const mac = new qiniu.auth.digest.Mac(
  AK,
  process.env.QINIU_SECRET_KEY
);
const config = new qiniu.conf.Config();
const bucketManager = new qiniu.rs.BucketManager(mac, config);
const formUploader = new qiniu.form_up.FormUploader(config);

function generateUploadToken() {
  const options = {
    scope: process.env.QINIU_BUCKET,
    expires: 3600 // 1小时有效期
  };
  const putPolicy = new qiniu.rs.PutPolicy(options);
  return putPolicy.uploadToken(mac);
}
app.post('/userinfo/logo', uploadMiddleware.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const token = generateUploadToken();
    const key = `images/${Date.now()}-${req.file.originalname}`; // 生成唯一文件名
    const response = await new Promise((resolve, reject) => {
      formUploader.putFile(
        token,
        key,
        req.file.path,
        new qiniu.form_up.PutExtra(),
        (err, ret) => err ? reject(err) : resolve(ret)
      );
    });
    fs.unlinkSync(req.file.path);
    const imageUrl = `https://${process.env.QINIU_DOMAIN}/${response.key}?t=${Date.now()}`;
    res.json({ url: imageUrl, key: response.key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/userlogo/:key', (req, res) => {
  const { key } = req.params;
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时有效
  const privateUrl = bucketManager.privateDownloadUrl(
    process.env.QINIU_DOMAIN,
    key,
    deadline
  );
  res.redirect(privateUrl); // 302跳转到临时私有链接
});
