
const express = require("express"); 
const mongoose = require("mongoose");
const path = require("path"); 
const api_app = require("./apiApp");
const api_comment = require("./apiComment");
const api_reply = require("./apiReply");
const api_user = require("./apiUser");
const api_guess = require("./apiGuess");

const api_room = require("./apiRoom");
const api_talk = require("./apiTalk");
const api_vr = require("./apiVr");
const api_login = require("./apiLogin");
const mongoConnectionURL ="mongodb+srv://mathdaren:return0@cluster0.jgao0jj.mongodb.net/";
//process.env.databaseurl;
               
const databaseName = "cluster0";
const options = { useNewUrlParser: true, useUnifiedTopology: true, dbName: databaseName};

// connect to mongodb
mongoose
  .connect(mongoConnectionURL, options)
  .then(() => console.log("Connected to MongoDB,WOW!"))
  .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));

const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json({limit: "100mb"}));
app.use(bodyParser.urlencoded({extended:true, limit: "100mb"}))

//express.json() 必须位于两条 limit 之后，否则不起作用，上传文件时将出现 413 payload too large
//这玩意查了一下午，傻逼
app.use(express.json());

const resourcePath = path.join(__dirname, "upload");
app.use(express.static(resourcePath));

const reactPath = path.resolve(__dirname, "..", "client", "dist");

const publicPath = path.resolve(__dirname, "..", "public");

app.use(express.static(reactPath));

// connect user-defined routes
app.use("/api", api_user);
app.use("/api", api_app);
app.use("/api",api_comment);
app.use("/api", api_reply);
app.use("/api",api_talk);
app.use("/guess",api_guess);
app.use("/askvr",api_vr);
app.use("/api", api_login);
app.use("/askroom", api_room);
// // load the compiled react files, which will serve /index.html and /bundle.js

app.get('/upload/:dir1/:name', (req, res) => {
  res.sendFile(path.join(resourcePath, req.params.dir1, req.params.name), options, (err) => {
    if(err){
      // console.log("fuck"+err);
      // res.status(err.status).end();
      res.sendFile(path.join(publicPath, "logo_default.png"), options, (err) => {
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
  res.sendFile(path.join(resourcePath, req.params.dir1, req.params.dir2, req.params.name), options, (err) => {
    if(err){
      console.log("fuck"+err);
      res.status(err.status).end();
    }
    else{
      console.log('Sent:', req.params.name);
    }
  });
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
