# AI 毕业评语提示词

## 调用方式

前端使用已有封装调用：

```js
post("/ai/parse", { text: parseText })
  .then((data) => {
    console.log('AI解析成功:', data);
  });
```

其中 `parseText` 由“固定提示词 + 游戏毕业档案 JSON”组成。

## parseText 模板

```text
你是 USTC Deckgame 的毕业评语系统。

请根据下面的结构化游戏结果，写一段中文游戏结算评语。

要求：
1. 使用中文，长度控制在 150-250 字。
2. 先概括玩家的大学路线、优势和主要积累。
3. 点出一个遗憾、短板或风险，但语气温和，不要嘲讽玩家。
4. 提到 1-2 个具体事实，例如某次考试、某个项目、某个成果、某类课程倾向。
5. 不要改变任何分数、评级、成就点和目标完成结果。
6. 不要编造 JSON 中不存在的项目、课程、成果或考试。
7. 风格像游戏毕业结算评语，不要像真实学校行政评价。

请只输出评语正文，不要输出 Markdown 标题，不要复述 JSON。

下面是游戏毕业档案：
{{GRADUATION_PROFILE_JSON}}
```

## 推荐发送的数据

不要发完整存档。本地先整理“毕业档案摘要”，再 `JSON.stringify` 进提示词。

```js
const graduationProfile = {
  game: "USTC Deckgame",
  result: {
    semesterEnded: 8,
    finalAchievementPoints: state.achievementPoints,
    totalExamScore: state.totalExamScore,
    finalExam: { name, score, achievementAward, rating },
  },
  goals: { immediate, final },
  academicProfile: { symbols, ownedCoursesCount, notableCourses },
  projects: { activeCount, completedCount, completedLargeProjectCount, active, completed },
  permanents: { count, names },
  exams: examHistory,
  chanceTools: { cramUsed, retakeUsed, examRerollUsed },
  playstyleSignals: { strongestSymbol, weakestSymbol, courseLean, projectLean, riskStyle, consistency },
};
```

## 组装示例

```js
const parseText = promptTemplate.replace(
  "{{GRADUATION_PROFILE_JSON}}",
  JSON.stringify(graduationProfile, null, 2)
);

post("/ai/parse", { text: parseText })
  .then((data) => {
    console.log('AI解析成功:', data);
  });
```

## 不建议发送

- 完整牌堆顺序。
- 云端存档 `_id`、用户 id 或登录信息。
- 未展示给玩家的随机池。
- 过长的逐条日志原文。

AI 只负责生成评语，不负责决定分数、成就点或目标是否完成。
