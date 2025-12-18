const fs = require("fs");
const xml2js = require("xml2js");

const xml = fs.readFileSync("./public/guide/pano.xml", "utf-8");

xml2js.parseString(xml, (err, result) => {
  if (err) {
    console.error("XML 解析失败", err);
    return;
  }

  const graph = {};
  const hotspotYawMap = {}; // ⭐ 新增

  const panoramas = result.tour.panorama || [];

  panoramas.forEach(pano => {
    const currentId = pano.$.id;

    graph[currentId] = {};
    hotspotYawMap[currentId] = {}; // ⭐ 新增

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

      /* ========== len（原有逻辑） ========== */
      let len = null;
      if (hs.custompropertyvalue) {
        hs.custompropertyvalue.forEach(p => {
          if (p.$.variablename === "len") {
            len = parseFloat(p.$.value);
          }
        });
      }

      // len = -1 不可通行
      if (len === null || len < 0) return;

      graph[currentId][targetId] = len;

      /* ========== ⭐ hotspot yaw ========== */
      if (hs.$.pan !== undefined) {
        const yaw = parseFloat(hs.$.pan);
        if (!Number.isNaN(yaw)) {
          hotspotYawMap[currentId][targetId] = {
            yaw
          };
        }
      }
    });

    // 如果某个节点没有可用热点，可以删掉空对象（可选）
    if (Object.keys(hotspotYawMap[currentId]).length === 0) {
      delete hotspotYawMap[currentId];
    }
  });

  /* ===============================
   * 输出文件
   * =============================== */
  fs.writeFileSync(
    "./client/dist/assets/route/graph.json",
    JSON.stringify(graph, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    "./client/dist/assets/route/hotspot_yaw.json",
    JSON.stringify(hotspotYawMap, null, 2),
    "utf-8"
  );

  console.log("✅ graph.json 构建完成");
  console.log("✅ hotspot_yaw.json 构建完成");
});
