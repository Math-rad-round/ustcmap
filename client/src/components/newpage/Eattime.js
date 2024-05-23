import React, { Component } from "react";
let table=[
  ["2分21秒","<1分钟","2分20秒","1分55秒","1分23秒"],
  ["5分01秒","<1分钟","4分14秒","4分55秒","8分31秒"],
  ["<1分钟","<1分钟","-----","2分","<1分钟"],
  ["1分32秒","<1分钟","1分30秒","2分05秒","-----"],
  ["3分35秒","<1分钟","5分","3分40秒","7分35秒"],
  ["<1分钟","<1分钟","-----","2分","-----"]
];
class Eattime extends Component{
  constructor(props){
    super(props);
  }
  render(){
    console.log("thishappen");
    let day=new Date();
    var s = day.getHours();
    var f = day.getMinutes();
    var x = day.getSeconds();
    let k=s*60+f;
    let o=0;
    if(k<=700)o=0;
    else if(k<=750)o=1;
    else if(k<=840)o=2;
    else if(k<=1070)o=3;
    else if(k<=1120)o=4;
    else o=5;
    return (
      <div>
        <a href="https://welcome.ustc.edu.cn/yinshi/statistics" target="_blank">食堂实时就餐人数</a>
        <table>
          <thead>
            <tr>
              <th>本食堂就餐时间</th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>汤面</th>
              <th>称重荤素*2</th>
              <th>小碗菜*2</th>
              <th>常规菜品*4</th>
              <th>拌饭</th>
            </tr>
            <tr>
              <td>{table[o][0]+"分钟"}</td>
              <td>{table[o][1]+"分钟"}</td>
              <td>{table[o][2]+"分钟"}</td>
              <td>{table[o][3]+"分钟"}</td>
              <td>{table[o][4]+"分钟"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default Eattime;

