

const express = require("express");
const User = require("./models/User.js");
const Savegame = require("./models/Savegame.js");
const router = express.Router();
const checker = require('./jwtThings.js');

router.post("/game/loadgame", (req, res) => {
    const userId = checker.getID(req.body.Authorization);
    if(!userId){
      res.send({error:"no user id"});
    }else{
        Savegame.find({parent: userId}).then((tmp)=>res.send(tmp));
    }
});
router.post("/game/savegame", (req, res) => {
    const userId = checker.getID(req.body.Authorization);
    if(!userId){
        res.send({error:"no user id"});
        return;
    }   
    const { gamename, gamedata, times, savename } = req.body;
    
    // 如果没有提供 _id，创建新存档
    if (!req.body._id) {
        const newSaveData = {
            regdate: new Date().toISOString(),
            visdate: new Date().toISOString(),
            gamename: gamename,
            gamedata: gamedata,
            parent: userId,
            times: times || 0,
            savename: savename || "未命名存档",
            otherdata: {}
        };
        
        const newSavegame = new Savegame(newSaveData);
        return newSavegame.save()
            .then((savedGame) => {
                res.status(200).send({
                    success: true,
                    message: "New game saved successfully",
                    data: savedGame
                });
            })
            .catch((error) => {
                console.error("Save game error:", error);
                res.status(500).send({ 
                    error: "Failed to save game", 
                    details: error.message 
                });
            });
    }
    
    // 有 _id，查找并更新现有存档
    const saveId = req.body._id;
    Savegame.findById(saveId)
        .then((existingSave) => {
            // 检查存档是否存在
            if (!existingSave) {
                return res.status(404).send({ 
                    error: "Save game not found" 
                });
            }
            
            // 检查权限：验证 parent 是否与用户ID一致
            if (existingSave.parent !== userId) {
                return res.status(403).send({ 
                    error: "You don't have permission to modify this save" 
                });
            }
            
            // 更新存档数据（保留 regdate 和 _id）
            const updateData = {
                visdate: new Date().toISOString(),
                gamename: gamename || existingSave.gamename,
                gamedata: gamedata || existingSave.gamedata,
                times: times !== undefined ? times : existingSave.times,
                savename: savename || existingSave.savename || "未命名存档",
                // 保留原有的 regdate 和 parent
                regdate: existingSave.regdate,
                parent: existingSave.parent,
                otherdata: existingSave.otherdata || {}
            };
            
            return Savegame.findByIdAndUpdate(
                saveId,
                updateData,
                { new: true }
            );
        })
        .then((updatedGame) => {
            res.status(200).send({
                success: true,
                message: "Game updated successfully",
                data: updatedGame
            });
        })
        .catch((error) => {
            console.error("Update game error:", error);
            res.status(500).send({ 
                error: "Failed to update game", 
                details: error.message 
            });
        });
});
module.exports = router;
