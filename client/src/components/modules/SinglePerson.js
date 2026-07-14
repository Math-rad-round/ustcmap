import React, { Component } from "react";
import { Link } from "react-router-dom";

import { get } from "../../utilities.js";

class SinglePerson extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { per } = this.props; // 从 props 中解构出 per（对应传入的 person 对象）
    
    return (
      <div className="project">
        {/* 头像 */}
        <img className="project-logo" src={"/upload/userlogo/" + per._id} alt={per.name} />
        
        {/* 姓名（链接到个人主页） */}
        <div className="project-title">
          <Link to={"/user/" + per._id}>
            <span>{per.name}</span>
          </Link>
        </div>

        {/* 个人简介（截取前150字符） */}
        <div className="project-overview">
          {per.intro==""?"还没有个人介绍":per.intro?.substring(0, 150)}
        </div>

        {/* 进入个人主页的链接 */}
        <Link className="project-entry" to={"/user/" + per._id}>
          <span>查看详情 &gt;&gt;</span>
        </Link>
      </div>
    );
  }
}

export default SinglePerson;