let panoReady = false;
let currentRoute = [];
let currentNodeId = null;

/* 等待 pano ready */
(function waitForPanoReady() {
  if (
    window.pano &&
    window.pano.isLoaded === true &&
    typeof window.pano.setVariableValue === "function"
  ) {
    panoReady = true;
    console.log("✅ iframe: pano READY");

    // 通知 React
    window.parent.postMessage({ type: "PANO_READY" }, "*");

    bindNodeChangeListener();
    return;
  }
  setTimeout(waitForPanoReady, 50);
})();

/* 接收 React 路径 */
window.addEventListener("message", (e) => {
  if (!panoReady || !e.data) return;

  if (e.data.type === "SET_ROUTE") {
    currentRoute = e.data.route || [];
    console.log("[route.js] route received:", currentRoute);
    console.log("[route.js] current node id:", currentNodeId);
    currentNodeId = currentRoute[0];

    // ✅ 现在一定能命中
    if (currentNodeId) {
      updateHighlightByNode(currentNodeId);
    }
  }
});

/* 监听节点变化 */
function bindNodeChangeListener() {
  window.pano.on("changenode", function (e) {
    const nodeId = window.pano.getCurrentNode();
    console.log("[route.js] changenode → current node:", nodeId);

    if (!nodeId) return;

    currentNodeId = nodeId;
    updateHighlightByNode(nodeId);
  });
}


/* 根据当前 nodeId 决定高亮 */
function updateHighlightByNode(nodeId) {
  if (!currentRoute.length) {
    clearHighlight();
    return;
  }
console.log("[route.js] updateHighlightByNode:", nodeId);
  const index = currentRoute.indexOf(nodeId);

  if (index === -1) {
    clearHighlight();
    return;
  }

  const nextNode = currentRoute[index + 1];
  if (!nextNode) {
    clearHighlight();
    return;
  }

  setHighlightNode(nextNode);
}

/* 设置 Skin 变量 */
function setHighlightNode(nodeId) {
  const value = `{${nodeId}}`; // ⚠️ 必须加 {}
  window.pano.setVariableValue("highlight_id", value);
  console.log("[route.js] highlight_id =", value);
}

function clearHighlight() {
  window.pano.setVariableValue("highlight_id", "");
  console.log("[route.js] highlight cleared");
}
