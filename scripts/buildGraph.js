const fs = require("fs");
const xml2js = require("xml2js");
const xml = fs.readFileSync("./public/guide/pano.xml", "utf-8");


xml2js.parseString(xml, (err, result) => {
  if (err) {
    console.error("XML 解析失败", err);
    return;
  }

  const graph = {};

  // tour -> panorama[]
  const panoramas = result.tour.panorama || [];

  panoramas.forEach(pano => {
    const currentId = pano.$.id;
    graph[currentId] = {};

    const hotspots =
      pano.hotspots &&
      pano.hotspots[0] &&
      pano.hotspots[0].hotspot
        ? pano.hotspots[0].hotspot
        : [];

    hotspots.forEach(hs => {
      // 目标节点：url="{node5}"
      if (!hs.$.url) return;

      const targetMatch = hs.$.url.match(/\{(.+?)\}/);
      if (!targetMatch) return;

      const targetId = targetMatch[1];

      // 查找 len
      let len = null;
      if (hs.custompropertyvalue) {
        hs.custompropertyvalue.forEach(p => {
          if (p.$.variablename === "len") {
            len = parseFloat(p.$.value);
          }
        });
      }

      // len = -1 认为不可通行
      if (len === null || len < 0) return;

      graph[currentId][targetId] = len;
    });
  });

  fs.writeFileSync(
    "./client/dist/assets/route/graph.json",
    JSON.stringify(graph, null, 2),
    "utf-8"
  );

  console.log("graph.json 构建完成");
});
