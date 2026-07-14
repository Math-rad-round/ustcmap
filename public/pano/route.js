(function () {
  function waitForPanoReady(cb) {
    const timer = setInterval(() => {
      if (window.pano && typeof window.pano.setVariableValue === "function") {
        clearInterval(timer);
        cb(window.pano);
      }
    }, 50);
  }

  waitForPanoReady((pano) => {
    console.log("✅ route.js: pano ready");

    // 对外暴露一个方法，方便 React / 控制台调用
    window.highlightHotspot = function (id) {
      console.log("✨ highlight hotspot:", id);
      pano.setVariableValue("highlight_id", id);
    };

    // 👉 测试：页面加载后直接高亮 5_12
    window.highlightHotspot("5_12");
  });

  // 接收 React iframe postMessage
  window.addEventListener("message", (e) => {
    if (e.data?.type === "HIGHLIGHT") {
      window.highlightHotspot(e.data.id);
    }
  });
})();
