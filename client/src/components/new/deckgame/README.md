Deckgame MVP 使用说明
=====================

概述
-----
这是一个最小可运行的 Deck Building 桌游引擎 Demo（MVP）。
结构位于 `client/src/components/new/deckgame/`：

- `engine/`：游戏逻辑（`GameEngine.js`, `GameState.js`）
- `model/`：简单数据模型（`Deck.js`, `Card.js`）
- `data/`：JSON 配置（`courses.json`，包含 10 张牌）
- `ui/`：React 外壳（`DeckGameUI.js`）
- `DeckGame.js`：组件入口导出

如何运行（在项目根目录）
--------------------------------
1. 安装依赖（如未安装）：
```bash
npm install
```
2. 启动开发服务器（与你当前项目一致）：
```bash
npm run dev
# 或
npm run start
```
3. 在要展示的页面中导入并挂载组件，例如：
```js
import DeckGame from './client/src/components/new/deckgame/DeckGame';

// 在 JSX 中：
<DeckGame />
```

核心概念
---------
- Command Driven：React 不直接修改游戏数据，所有变更通过 `GameEngine.execute(command)` 完成。
- Data Driven：卡牌数据位于 `data/courses.json`，Engine 负责解释这些对象。

常用命令（示例）
-----------------
- `START_SEMESTER`：开始学期，参数 `{ type: 'START_SEMESTER', draw: 5 }`，Engine 会先进入事件阶段；事件/温习结束后抽 `draw` 张课程牌，计算 counts 与 score，返回更新后的 `GameState`。

开发建议
--------
- 若要在页面中显示初始状态，可以在组件挂载时读取 `this.engine.getState()` 并手动 setState。
- 后续可以把 `GameEngine` 的实例放入更高层的 context，以便多人/AI/录像系统复用。
