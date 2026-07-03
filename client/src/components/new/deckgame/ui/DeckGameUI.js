import React from 'react';
import GameEngine from '../engine/GameEngine';
import courses from '../data/courses.json';

// DeckGameUI: 最简单的 React 外壳，负责发送命令给 Engine 并根据 GameState 渲染
// 设计要点：React 不修改数据；所有修改通过调用 `this.engine.execute(command)` 完成。
export default class DeckGameUI extends React.Component {
  constructor(props) {
    super(props);
    // 用 JSON 数据实例化 Engine
    this.engine = new GameEngine(courses);
    // 本地 state 仅用于触发 React 渲染（来源于 Engine.state）
    this.state = {
      hand: [],
      counts: { Theory: 0, Practice: 0, Social: 0 },
      score: 0,
    };
  }

  // 向 Engine 发送命令，Engine 返回更新后的 GameState，UI 根据其更新自身 state
  startExam = () => {
    const state = this.engine.execute({ type: 'START_EXAM', draw: 5 });
    this.setState({ hand: state.hand, counts: state.counts, score: state.score });
  };

  renderCard(c, i) {
    return (
      <div key={c._id || c.id || i} style={{ padding: 8, border: '1px solid #ddd', margin: 4 }}>
        <div><strong>{c.name}</strong></div>
        <div>Type: {c.type}</div>
      </div>
    );
  }

  render() {
    const { hand, counts, score } = this.state;
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: 12 }}>
        <h3>Deckgame MVP — Exam Demo</h3>
        {/* 点击发送 START_EXAM 命令给 Engine */}
        <button onClick={this.startExam} style={{ padding: '8px 12px' }}>开始考试</button>

        <div style={{ marginTop: 12 }}>
          <div><strong>手牌 ({hand.length})</strong></div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>{hand.map((c, i) => this.renderCard(c, i))}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div><strong>Counts</strong></div>
          <div>Theory: {counts.Theory} &nbsp; Practice: {counts.Practice} &nbsp; Social: {counts.Social}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div><strong>Score</strong></div>
          <div style={{ fontSize: 20 }}>{score}</div>
        </div>
      </div>
    );
  }
}
