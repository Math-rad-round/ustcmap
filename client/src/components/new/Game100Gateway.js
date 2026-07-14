import React from 'react';

let LocalGame100 = null;
let loadMessage = '本地 100 原型未包含在当前构建中。';

try {
  const context = require.context('.', true, /^\.\/100\/Game100\.js$/);
  const key = context.keys()[0];
  if (key) {
    const module = context(key);
    LocalGame100 = module.default || module;
  }
} catch (error) {
  loadMessage = error?.message || loadMessage;
}

export default function Game100Gateway() {
  if (LocalGame100) return <LocalGame100 />;

  return (
    <main style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      color: '#1b1c22',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
    }}
    >
      <section style={{
        width: 'min(520px, 92vw)',
        display: 'grid',
        gap: 12,
        padding: 18,
        border: '3px solid #1b1c22',
        borderRadius: 8,
        background: '#fffdf5',
      }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>100 本地原型</h1>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          这个页面会在本地存在
          {' '}
          <code>client/src/components/new/100/Game100.js</code>
          {' '}
          时加载游戏。仓库版不会包含该目录，因此这里会安全显示占位内容。
        </p>
        <small style={{ color: '#61636b' }}>{loadMessage}</small>
      </section>
    </main>
  );
}
