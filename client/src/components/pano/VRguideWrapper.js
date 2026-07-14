import React, { Component } from "react";
import VRguide from "./../pos/VRguide";
import graph from "./../../../dist/assets/route/graph.json";

class VRguideWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      route: []
    };
  }

  componentDidMount() {
    this.calculateAndSetRoute();
  }

  calculate = (start, end) => {
    const distances = {};
    const prev = {};
    const visited = new Set();

    // 初始化
    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      prev[node] = null;
    });
    distances[start] = 0;

    while (true) {
      let current = null;
      let minDist = Infinity;

      // 找未访问的最小距离节点
      for (const node in distances) {
        if (!visited.has(node) && distances[node] < minDist) {
          minDist = distances[node];
          current = node;
        }
      }console.log(current);

      if (current === null) break;
      if (current === end) break;

      visited.add(current);

      // 松弛邻居
      for (const neighbor in graph[current]) {
        const weight = graph[current][neighbor];
        const alt = distances[current] + weight;
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          prev[neighbor] = current;
        }
      }
    }

    // 回溯路径
    const path = [];
    let cur = end;
    while (cur) {
      path.unshift(cur);
      cur = prev[cur];
    }
    console.log(path);
    console.log(start);
    console.log("end");
    console.log(end);
    return path;
  }
  // calculate(start, end) {
  //   console.log("[Wrapper] calculate:", start, end);
  //   return ["node5", "node6", "node1", "node45"];
  // }

  calculateAndSetRoute() {
    const { start, end } = this.props;
    const route = this.calculate(start, end);

    this.setState({ route });
  }

  render() {
    if(this.state.route.length===0) {
      return <div>正在计算路径...</div>;
    }
    return <VRguide route={this.state.route} />;
  }
}

export default VRguideWrapper;
