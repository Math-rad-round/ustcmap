let HOTSPOT_YAW_MAP = null;
let hotspotYawReady = false;

function loadHotspotYawMap() {
  return fetch("/assets/route/hotspot_yaw.json")
    .then(res => {
      if (!res.ok) {
        throw new Error("hotspot_yaw.json 加载失败");
      }
      return res.json();
    })
    .then(data => {
      HOTSPOT_YAW_MAP = data;
      hotspotYawReady = true;
      console.log("✅ hotspot_yaw.json loaded");
    })
    .catch(err => {
      console.error("❌ hotspot_yaw.json 加载失败", err);
    });
}
let currentPan = null;
let currentFov = null;


let panoReady = false;
let currentRoute = [];
let currentNodeId = null;

/* ===============================
 * ⭐ 箭头系统相关配置
 * =============================== */
const ARROW_MARGIN = 5;      // 视野边缘缓冲角度
const UPDATE_INTERVAL = 100;

let arrowTimer = null;

/* ===============================
 * 工具：角度归一化
 * =============================== */
function normalizeAngle(angle) {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/* ===============================
 * 工具：更新 Skin 箭头变量
 * =============================== */
function updateArrow(direction) {
  if (!window.pano) return;
  window.pano.setVariableValue(
    "left",
    direction === "LEFT" ? 1 : 0
  );
  window.pano.setVariableValue(
    "right",
    direction === "RIGHT" ? 1 : 0
  );
}

/* ===============================
 * ⭐ 核心：更新箭头方向
 * =============================== */
function updateRouteArrow() {
  if (!panoReady || !currentNodeId || !currentRoute.length) {
    updateArrow("NONE1");
    return;
  }

  const index = currentRoute.indexOf(currentNodeId);
  if (index === -1) {
    updateArrow("NONE2");
    return;
  }

  const nextNodeId = currentRoute[index + 1];
  if (!nextNodeId) {
    updateArrow("NONE3");
    return;
  }

  const targetYaw = getHotspotYaw(currentNodeId, nextNodeId);
  if (typeof targetYaw !== "number") {
    updateArrow("NONE4");
    return;
  }
  // ✅ 正确的相机参数获取方式
  const cameraYaw = pano.getPan();
  const fov = pano.getFov();
  //  console.log(`[route.js] Camera yaw=${cameraYaw}, fov=${fov}`);
  if (typeof cameraYaw !== "number" || typeof fov !== "number") {
    updateArrow("NONE5");
    return;
  }
  const deltaYaw =- normalizeAngle(targetYaw - cameraYaw);
  const halfFov = fov / 2;
  const DEAD = ARROW_MARGIN;

  let direction = "NONE";
  if (Math.abs(deltaYaw) > halfFov + DEAD) {
    direction = deltaYaw > 0 ? "RIGHT" : "LEFT";
  }

  updateArrow(direction);
}

/* ===============================
 * ⭐ 启动 / 停止箭头更新
 * =============================== */
function startArrowLoop() {
  if (arrowTimer) return;
  arrowTimer = setInterval(updateRouteArrow, UPDATE_INTERVAL);
}

function stopArrowLoop() {
  if (arrowTimer) {
    clearInterval(arrowTimer);
    arrowTimer = null;
  }
  updateArrow("NONE");
}

/* ===============================
 * 等待 pano ready
 * =============================== */
(function waitForPanoReady() {
  if (
    window.pano &&
    window.pano.isLoaded === true &&
    typeof window.pano.setVariableValue === "function"
  ) {
    panoReady = true;
    console.log("✅ iframe: pano READY");
    loadHotspotYawMap();
    window.parent.postMessage({ type: "PANO_READY" }, "*");

    bindNodeChangeListener();
    startArrowLoop();
    return;
  }
  setTimeout(waitForPanoReady, 50);
})();

/* ===============================
 * 接收 React 路径
 * =============================== */
window.addEventListener("message", (e) => {
  if (!panoReady || !e.data) return;

  if (e.data.type === "SET_ROUTE") {
    currentRoute = e.data.route || [];
    console.log("[route.js] route received:", currentRoute);

    currentNodeId = currentRoute[0] || null;

    if (currentNodeId) {
      updateHighlightByNode(currentNodeId);
    }
  }
});

/* ===============================
 * 监听节点变化
 * =============================== */
function bindNodeChangeListener() {
  window.pano.on("changenode", function () {
    const nodeId = window.pano.getCurrentNode();
    console.log("current route", currentRoute);
    console.log("[route.js] changenode → current node:", nodeId);
    
    if (!nodeId) return;

    currentNodeId = nodeId;
    updateHighlightByNode(nodeId);
  });
}


/* ===============================
 * 根据当前 nodeId 决定高亮
 * =============================== */
function updateHighlightByNode(nodeId) {
  if (!currentRoute.length) {
    clearHighlight();
    return;
  }

  const index = currentRoute.indexOf(nodeId);
  if (index === -1) {
    
    // 发送消息给上层页面，告知需要重新加载路径
    const message = {
      type: 'RELOAD_NAVIGATION',
      currentNode: nodeId  // 将目标节点ID传递给上层
    };
    console.log("[route.js] Sending message to parent:", message);
    // 使用 postMessage 向上层页面发送消息
    window.parent.postMessage(message, "*");
    clearHighlight();
    return;
  }

  const nextNode = currentRoute[index + 1];
  if (!nextNode) {
    clearHighlight();
        const message = {
      type: 'FINISH',
    };
    // 使用 postMessage 向上层页面发送消息
    window.parent.postMessage(message, "*");
    return;
  }

  setHighlightNode(nextNode);
}

/* ===============================
 * 设置 / 清除高亮
 * =============================== */
function setHighlightNode(nodeId) {
  const value = `{${nodeId}}`;
  window.pano.setVariableValue("highlight_id", value);
  console.log("[route.js] highlight_id =", value);
}

function clearHighlight() {
  window.pano.setVariableValue("highlight_id", "");
  console.log("[route.js] highlight cleared");
}


function getHotspotYaw(currentNodeId, nextNodeId) {
  return (
    HOTSPOT_YAW_MAP?.[currentNodeId]?.[nextNodeId]?.yaw
    ?? null
  );
}
