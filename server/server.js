const path = require("path");
const fs = require("fs");
const { safeResolve } = require("./safePath");

const envPath = path.resolve(__dirname, "../.env");

const result = require("dotenv").config({ path: envPath });

const express = require("express"); 
const mongoose = require("mongoose");
const api_app = require("./apiApp");
const api_comment = require("./apiComment");
const api_reply = require("./apiReply");
const api_user = require("./apiUser");
const api_guess = require("./apiGuess");
const api_place = require("./apiPlace");
const api_room = require("./apiRoom");
const api_talk = require("./apiTalk");
const api_vr = require("./apiVr");
const api_login = require("./apiLogin");
const api_game = require("./apiGame");
const parser = require("./AI/parser");
// server.js 或 app.js
const mongoConnectionURL = process.env.MONGODB_NET;
//process.env.databaseurl;
               
const databaseName = "cluster0";
const options = {dbName: databaseName};

// connect to mongodb
mongoose
  .connect(mongoConnectionURL, options)
  .then(() => console.log("Connected to MongoDB,WOW!"))
  .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));

const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json({limit: "100mb"}));
app.use(bodyParser.urlencoded({extended:true, limit: "100mb"}))

app.use(express.json());

const resourcePath = path.join(__dirname, "upload");
app.use(express.static(resourcePath));

const reactPath = path.resolve(__dirname, "..", "client", "dist");

const publicPath = path.resolve(__dirname, "..", "public");
app.use(express.static(reactPath));
app.use(express.static(publicPath));
// connect user-defined routes
app.use("/api", api_user);
app.use("/api", api_app);
app.use("/api",api_comment);
app.use("/api", api_reply);
app.use("/api",api_talk);
app.use("/guess",api_guess);
app.use("/askvr",api_vr);
app.use("/api", api_login);
app.use("/api",api_place);
app.use("/askroom", api_room);
app.use("/ai",parser);
app.use("/api", api_game);
// // load the compiled react files, which will serve /index.html and /bundle.js
app.use
app.get('/upload/:dir1/:name', (req, res) => {
  const filePath = safeResolve(resourcePath, req.params.dir1, req.params.name);
  if (!filePath) {
    return res.status(403).json({ error: 'Invalid path' });
  }

  res.sendFile(filePath, options, (err) => {
    if(err){
      // console.log("fuck"+err);
      // res.status(err.status).end();
      res.sendFile(safeResolve(publicPath, "logo_default.png"), options, (err) => {
        if(err){
          console.log("fucker"+err);
          res.status(err.status).end();
        }
        else{
          console.log('Sent:', req.params.name);
        }
      });
    }
    else{
      console.log('Sent:', req.params.name);
    }
  });
});
app.get('/upload/:dir1/:dir2/:name', (req, res) => {
  const filePath = safeResolve(resourcePath, req.params.dir1, req.params.dir2, req.params.name);
  if (!filePath) {
    return res.status(403).json({ error: 'Invalid path' });
  }

  res.sendFile(filePath, options, (err) => {
    if(err){
      console.log("fuck"+err);
      res.status(err.status).end();
    }
    else{
      console.log('Sent:', req.params.name);
    }
  });
});
app.get('/newgame/*', (req, res) => {
  const subPath = req.params[0];
  
  if (!subPath) {
    return res.status(400).json({ error: 'No path specified' });
  }
  
  // 构建完整文件路径
  const filePath = safeResolve(publicPath, 'newgame', subPath);
  if (!filePath) {
    return res.status(403).json({ error: 'Invalid path' });
  }
  
  // 检查路径是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Path not found' });
  }
  
  // 获取路径统计信息
  const stats = fs.statSync(filePath);
  
  // 如果是目录，返回目录内容列表
  if (stats.isDirectory()) {
    fs.readdir(filePath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return res.status(500).json({ error: 'Failed to read directory' });
      }
      
      // 获取每个文件的详细信息
      const fileDetails = files.map(file => {
        const fullPath = path.join(filePath, file);
        try {
          const fileStats = fs.statSync(fullPath);
          return {
            name: file,
            path: path.join('newgame', subPath, file),
            isDirectory: fileStats.isDirectory(),
            isFile: fileStats.isFile(),
            size: fileStats.isFile() ? fileStats.size : undefined,
            modifiedTime: fileStats.mtime
          };
        } catch (err) {
          return {
            name: file,
            path: path.join('newgame', subPath, file),
            error: 'Failed to read file info'
          };
        }
      });
      
      res.json({
        path: `/newgame/${subPath}`,
        isDirectory: true,
        contents: fileDetails
      });
    });
  } 
  // 如果是文件，返回文件内容
  else if (stats.isFile()) {
    // 更新缓存（类似您原来的逻辑）
    const nowdate = new Date();
    const id = req.query.id || 'newgame_default';
    
    Cache.findOneAndUpdate(
      { id: id },
      { 
        $set: { 
          Date: nowdate,
          content: `/newgame/${subPath}`
        }
      },
      { upsert: true }
    ).then(() => {
      // 根据文件类型决定如何返回
      const ext = path.extname(filePath).toLowerCase();
      
      // 如果是文本文件，可以直接读取内容
      if (['.txt', '.json', '.xml', '.html', '.css', '.js', '.md'].includes(ext)) {
        fs.readFile(filePath, 'utf8', (err, content) => {
          if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read file' });
          }
          res.json({
            path: `/newgame/${subPath}`,
            isFile: true,
            extension: ext,
            content: content,
            size: stats.size,
            modifiedTime: stats.mtime
          });
        });
      } else {
        // 二进制文件直接发送
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error("Error sending file:", err);
            res.status(err.status || 500).end();
          }
        });
      }
    }).catch((error) => {
      console.log("Cache update error:", error);
      // 即使缓存更新失败，也尝试返回文件
      res.sendFile(filePath, (err) => {
        if (err) {
          res.status(404).json({ error: 'File not found' });
        }
      });
    });
  } else {
    res.status(404).json({ error: 'Invalid path' });
  }
});
app.get("*", (req, res) => {
  res.sendFile(path.join(reactPath, "index.html"));
});
//any server errors cause this function to run
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) {
    // 500 means Internal Server Error
    console.log("The server uyyutcessing a request!");
    console.log(err);
  }
  res.status(status);
  res.send({
    status: status,
    message: err.message,
  });
});
// // hardcode port to 3000 for now
const port = 3000;
app.listen(port, () => {
  console.log(`Server runnwfasding on port: ${port}`);
});
//I think it canwork now
