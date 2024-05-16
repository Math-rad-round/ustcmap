import React, { Component } from "react";
let table=[
  ["1-2","1-2","1-3","1-4","4-6"],
  ["1-3","1-4","1-5","2-6","3-7"],
  ["3-5","4-4","1-5","2-3","3-7"],
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
    if(k<=690)o=0;
    else if(k<=800)o=1;
    else o=2;
    return (
      <div>
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
              <th>第一种食物</th>
              <th>第二种食物</th>
              <th>第三种食物</th>
              <th>第四种食物</th>
              <th>第五种食物</th>
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

