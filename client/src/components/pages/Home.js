import React from "react";
import { Link } from "react-router-dom";

import ustcLogo from "../unipage/ustc.png";
import vrPreview from "../../../../public/pano/tiles/node1/cf_0/l_1/c_0/tile_0.jpg";
import "./Home.css";

const quickLinks = [
  { to: "/vr/pano", title: "VR 地图", meta: "全景入口", tag: "Map" },
  { to: "/getpos", title: "定位导航", meta: "附近地点", tag: "Nav" },
  { to: "/guide/node7/node13", title: "全景路线", meta: "路线导览", tag: "Guide" },
  { to: "/room/node9", title: "场景房间", meta: "留言交流", tag: "Room" },
];

const featureGroups = [
  {
    title: "探索",
    items: [
      { to: "/vr/pano", title: "全景节点", meta: "Pano" },
      { to: "/room/node9", title: "随机房间", meta: "Room" },
      { to: "/guide/node7/node13", title: "全景路线", meta: "Guide" },
      { to: "/search", title: "搜索目录", meta: "Search" },
    ],
  },
  {
    title: "游戏",
    items: [
      { to: "/game/game", title: "VR Game", meta: "全景挑战" },
      { to: "/guess", title: "猜地点", meta: "Guess" },
      { to: "/ustcgame", title: "DeckGame", meta: "卡牌学期" },
      { to: "/dbg", title: "USTC DBG", meta: "危机构筑" },
    ],
  },
  {
    title: "账号",
    items: [
      { to: "/signin", title: "登录", meta: "Account" },
      { to: "/signup", title: "注册", meta: "Join" },
      { to: "/getpos", title: "定位导航", meta: "Position" },
      { to: "/search", title: "目录搜索", meta: "Search" },
    ],
  },
];

function Home(props) {
  const profilePath = props.userId ? `/user/${props.userId}` : "/signin";
  const profileText = props.userId ? "个人主页" : "登录账号";

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-brand-row">
            <img className="home-logo" src={ustcLogo} alt="USTC" />
            <span>USTC MAP</span>
          </div>
          <h1>从 VR 地图进入校园</h1>
          <div className="home-hero-actions">
            <Link className="home-primary-action" to="/vr/pano">打开 VR 地图</Link>
            <Link className="home-secondary-action" to={profilePath}>{profileText}</Link>
          </div>
        </div>
        <div className="home-vr-panel" aria-label="VR campus preview">
          <img src={vrPreview} alt="VR campus preview" />
          <div className="home-vr-overlay">
            <span>VR Campus</span>
            <strong>全景浏览 / 路线导览 / 场景互动</strong>
          </div>
        </div>
      </section>

      <section className="home-quick-grid" aria-label="Quick links">
        {quickLinks.map((item) => (
          <Link className="home-quick-card" to={item.to} key={item.to}>
            <span>{item.tag}</span>
            <strong>{item.title}</strong>
            <small>{item.meta}</small>
          </Link>
        ))}
      </section>

      <section className="home-groups">
        {featureGroups.map((group) => (
          <div className="home-group" key={group.title}>
            <div className="home-group-title">{group.title}</div>
            <div className="home-link-list">
              {group.items.map((item) => (
                <Link className="home-link-row" to={item.to} key={item.to}>
                  <span>{item.title}</span>
                  <small>{item.meta}</small>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Home;
