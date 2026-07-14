// // App.js
// import React from 'react';
// import Dragmap from './Dragmap';
// import './App.css';

// function App() {
//   const handleMarkerPlaced = (position) => {
//     console.log('标记位置:', position);
//     alert(`您在地图上的 (${Math.round(position.x)}, ${Math.round(position.y)}) 位置添加了标记`);
//   };

//   return (
//     <div className="app">
//       <header>
//         <h1>交互式地图查看器</h1>
//         <p className="instructions">
//           使用鼠标滚轮缩放地图 • 按住鼠标拖动地图 • 单击放置标记点
//         </p>
//       </header>
      
//       <div className="map-wrapper">
//         <Dragmap 
//           src="https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
//           alt="世界地图"
//           onMarkerPlaced={handleMarkerPlaced}
//         />
//       </div>
      
//       <div className="features">
//         <div className="feature-card">
//           <div className="icon">🔍</div>
//           <h3>缩放功能</h3>
//           <p>使用鼠标滚轮或控制按钮放大缩小地图</p>
//         </div>
//         <div className="feature-card">
//           <div className="icon">🖱️</div>
//           <h3>拖动功能</h3>
//           <p>按住鼠标拖动地图进行位置调整</p>
//         </div>
//         <div className="feature-card">
//           <div className="icon">📍</div>
//           <h3>标记功能</h3>
//           <p>单击地图放置标记点，获取精确坐标</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;