import React, { Component } from "react";
import PropTypes from "prop-types";
import "./Tomato.css"; // 引入样式文件
class Tomato extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeLeft: props.studyDuration * 60,
      isActive: false,
      isStudyTime: true,
      cyclesCompleted: 0,
      studyDuration: props.studyDuration,
      breakDuration: props.breakDuration,
      showSettings: false
    };
    
    this.timer = null;
  }

  componentDidMount() {
    this.resetTimer();
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  switchMode = () => {
    if (this.state.isStudyTime) {
      this.setState({
        timeLeft: this.state.breakDuration * 60,
        isStudyTime: false,
        cyclesCompleted: this.state.cyclesCompleted + 1
      });
    } else {
      this.setState({
        timeLeft: this.state.studyDuration * 60,
        isStudyTime: true
      });
    }
  };

  toggleTimer = () => {
    this.setState(prevState => ({
      isActive: !prevState.isActive
    }), () => {
      if (this.state.isActive && !this.timer) {
        this.timer = setInterval(this.tick, 1000);
      } else if (!this.state.isActive && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    });
  };

  tick = () => {
    this.setState(prevState => {
      if (prevState.timeLeft <= 1) {
        this.switchMode();
        return null;
      }
      return {
        timeLeft: prevState.timeLeft - 1
      };
    });
  };

  resetTimer = () => {
    clearInterval(this.timer);
    this.timer = null;
    this.setState({
      timeLeft: this.state.studyDuration * 60,
      isActive: false,
      isStudyTime: true,
      cyclesCompleted: 0
    });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: parseInt(value) || 0
    });
  };

  saveSettings = (e) => {
    e.preventDefault();
    this.setState({
      showSettings: false
    }, this.resetTimer);
  };

  toggleSettings = () => {
    this.setState(prevState => ({
      showSettings: !prevState.showSettings
    }));
  };
  render() {
    const { 
      timeLeft, 
      isActive, 
      isStudyTime, 
      cyclesCompleted,
      studyDuration,
      breakDuration,
      showSettings
    } = this.state;

    const timerClass = isStudyTime ? "study-mode" : "break-mode";

    return (
      <div className="tomato-app">
        <div className={`timer-container ${timerClass}`}>
          <h2>{isStudyTime ? "学习时间" : "休息时间"}</h2>
          <div className="timer-display">
            {this.formatTime(timeLeft)}
          </div>

          <div className="controls">
            <button onClick={this.toggleTimer} className="control-button">
              {isActive ? "暂停" : "开始"}
            </button>
            <button onClick={this.resetTimer} className="control-button">
              重置
            </button>
            <button onClick={this.toggleSettings} className="control-button">
              {showSettings ? "隐藏设置" : "设置时间"}
            </button>
          </div>

          <div className="status">
            <p>已完成周期: {cyclesCompleted}</p>
            <p>当前状态: {isStudyTime ? "学习中" : "休息中"}</p>
            <p>学习时长: {studyDuration}分钟</p>
            <p>休息时长: {breakDuration}分钟</p>
          </div>
        </div>

        {showSettings && (
          <div className="settings-form">
            <h3>时间设置</h3>
            <form onSubmit={this.saveSettings}>
              <div className="form-group">
                <label>
                  学习时间 (分钟):
                  <input
                    type="number"
                    name="studyDuration"
                    min="1"
                    max="120"
                    value={studyDuration}
                    onChange={this.handleInputChange}
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  休息时间 (分钟):
                  <input
                    type="number"
                    name="breakDuration"
                    min="1"
                    max="30"
                    value={breakDuration}
                    onChange={this.handleInputChange}
                  />
                </label>
              </div>
              <button type="submit" className="control-button">
                保存设置
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }
}

Tomato.propTypes = {
  studyDuration: PropTypes.number,
  breakDuration: PropTypes.number
};

Tomato.defaultProps = {
  studyDuration: 25,
  breakDuration: 5
};

export default Tomato;