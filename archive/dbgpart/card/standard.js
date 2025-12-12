// cards.js - 统一卡牌定义文件
export const cardDefinitions = {
  {
    name: "+1s",
    types: ["startcard"],
    cost: 0,
    description: "获得 1 下载",
    play: (game, player) => {
        player.adddown(1);
    }
 },
  {
    name: "+1s_p",
    types: ["startcard"],
    cost: 0,
    description: "获得 2 下载",
    play: (game, player) => {
        player.adddown(1);
    }
    upgradesreq:-1  ,
 },

   {
    name: "+1m",
    types: ["startcard"],
    cost: 1,
    description: "获得 1 敏捷",
    play: (game, player) => {
        player.adddown(1);
    }
 },
  {
    name: "+1m_p",
    types: ["startcard"],
    cost: 1,
    description: "【保留】获得 1 敏捷，支付 1 下载换 1 敏捷",
    play: (game, player) => {
        game.choose2("1 下载换 1 敏捷",(choice)=>{
            if(choice&&player.getdown()>0){
                player.adddown(-1);
                player.addmove(1);
            }
        });
    }
    keep:true,upgradesreq:-1  ,
 },

 {
    name: "+1a",
    types: ["startcard"],
    cost: 1,
    description: "获得 1 攻击",
    play: (game, player) => {
        player.addatk(1);
    }
 },
  {
    name: "+1a_p",
    types: ["startcard"],
    cost: 1,
    description: "【保留】获得 1 攻击，支付 1 下载换 1 敏捷",
    play: (game, player) => {
        player.addatk(1);
        game.choose2("1 下载换 1 攻击",(choice)=>{
            if(choice&&player.getdown()>0){
                player.adddown(-1);
                player.addatk(1);
            }
        });
    }
    keep:true,upgradesreq:-1  ,
 },

  {
    name: "s_+2f",
    types: ["startcard"],
    cost: 2,
    description: "获得 2 防御",
    play: (game, player) => {
        player.adddef(2);
    }
    upgradesreq:0 ,
 },
  {
    name: "s_+2f_p",
    types: ["startcard"],
    cost: 2,
    description: "【保留】获得 3 防御",
    play: (game, player) => {
        player.adddef(3);
    }
    keep:true,upgradesreq:-1  ,
 },
 {
    name: "s_downdef",
    types: ["startcard"],
    cost: 2,
    description: "获得 1 下载 1 防御",
    play: (game, player) => {
        player.adddown(1);
        player.adddef(1);
    }
 },
  {
    name: "s_downdef_p",
    types: ["startcard"],
    cost: 2,
    description: "获得 2 下载 或 3 防御",
    play: (game, player) => {
        game.choose2("选择 2 下载？",(choice)=>{
            if(choice){
                player.adddown(2);
            }else player.adddef(3);
        );
    }
    upgradesreq:-1  ,
 },

 {
    name: "s_downmov",
    types: ["startcard"],
    cost: 4,
    description: "获得 1 下载 1 移动",
    play: (game, player) => {
        player.adddown(1);
        player.addmov(1);
    }
 },
 {
    name: "s_downmov_p",
    types: ["startcard"],
    cost: 4,
    description: "获得 1 下载 1 移动 1 防御",
    play: (game, player) => {
        player.adddown(1);
        player.addmov(1);
        player.adddef(1);
    }
    upgradesreq:-1  ,
 },


 {
    name: "shock",
    types: ["startcard"],
    cost: 4,
    description: "无效果，自动移除",
    canplay: (game, player) => {
        return false; // 无条件可用
    },
    void: true, // 该卡牌未使用则会被移除
 },
 {
    name: "shock_p",
    types: ["startcard"],
    cost: 4,
    description: "移除并获得 1 上传",
    play: (game, player) => {
        player.adddata(1);
    }
    oneuse:true,
    upgradesreq:-1  ,
 },
};