USTC DBG
========

`client/src/components/new/dbg/` 是一个新的传统 DBG 原型。

核心循环
--------

- 每回合抽 5 张牌。
- 打出手牌获得下载点、上传点、防护/机动/反击，或者抽牌，升级，删牌效果。
- 你也可以把任意手牌当作1防护使用
- 上传点是分数，累计64获胜。
- 下载点用于购买装备牌，购买的牌进入弃牌堆，之后洗回抽牌堆。
- 有两个装备市场，基础装备可以随意挑选，进阶装备场上会刷出3个，每回合移除最左侧的替换。
- 每回合抽一张威胁牌，威胁牌根据你的机动/反击不同，有一个3*3的表格决定攻击力
- 你的防护初始为12，但是每回合，承受衰退（4次衰退就会降低1防护），很多威胁牌也会给予衰退
- 回合结束时，如果攻击力大于防护，每3点扣减1生命值，扣减第一点会拿取1晕眩，第二点会拿取伤口，第三点会降低游戏胜利评分，第四点会失败。余数部分拿取等量的晕眩
（晕眩回合结束时如果停留在手牌移除，伤口没有任何作用）
- 受到累计4点生命值失败；先达到分数目标则胜利。

结构
----

- `engine/DBGEngine.js`：命令驱动引擎。
- `engine/DBGState.js`：可序列化状态。
- `data/Start_cards.json`：初始牌组。
- `data/Basic_cards.json`：基础装备。
- `data/Up_cards.json`：进阶装备。
- `data/Attack_cards.json`：攻击牌库，用尽重洗。
- `data/Status_cards.json`：状态牌。
- `data/Character_cards.json`：角色牌与起始设置。
- `data/GameConfig.json`：基础数值配置。
- `ui/DBGGameUI.js`：React 界面。

可用命令
--------

- `{ type: 'SELECT_CHARACTER', characterId }`
- `{ type: 'PLAY_CARD', handIndex, modeId? }`
- `{ type: 'DISCARD_FOR_BLOCK', handIndex }`
- `{ type: 'PLAY_ALL' }`
- `{ type: 'BUY_CARD', marketType: 'basic' | 'up', index }`
- `{ type: 'USE_CHARACTER_ABILITY', abilityIndex, optionId? }`
- `{ type: 'CONVERT_RESOURCE', index }`
- `{ type: 'END_TURN' }`
- `{ type: 'RESET_GAME' }`
