import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Dragmap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 1,
      position: { x: 0, y: 0 },
      markers: props.markers || [],
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      imageLoaded: false,
      containerSize: { width: 0, height: 0 },
      imageSize: { width: 0, height: 0 },
      error: false
    };
    this.containerRef = React.createRef();
    this.imageRef = React.createRef();
    this.dragTimeout = null;
  }

  componentDidMount() {
    this.updateContainerSize();
    window.addEventListener('resize', this.updateContainerSize);
    
    const container = this.containerRef.current;
    if (container) {
      container.addEventListener('wheel', this.handleWheel, { passive: false });
      container.addEventListener('pointerdown', this.handlePointerDown);
      container.addEventListener('pointermove', this.handlePointerMove);
      container.addEventListener('pointerup', this.handlePointerUp);
      container.addEventListener('pointerleave', this.handlePointerUp);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.markers !== prevProps.markers) {
      this.setState({ markers: this.props.markers || [] });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateContainerSize);
    const container = this.containerRef.current;
    if (container) {
      container.removeEventListener('wheel', this.handleWheel);
      container.removeEventListener('pointerdown', this.handlePointerDown);
      container.removeEventListener('pointermove', this.handlePointerMove);
      container.removeEventListener('pointerup', this.handlePointerUp);
      container.removeEventListener('pointerleave', this.handlePointerUp);
    }
  }

  updateContainerSize = () => {
    if (this.containerRef.current) {
      this.setState({
        containerSize: {
          width: this.containerRef.current.offsetWidth,
          height: this.containerRef.current.offsetHeight
        }
      }, this.applyBoundaryConstraints);
    }
  };


  applyBoundaryConstraints = () => {
    const { scale, position, containerSize, imageSize } = this.state;
    
    if (!containerSize.width || !imageSize.width) return;
    
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;
    
    // 调试日志
    // console.log('应用边界约束:');
    // console.log('容器尺寸:', containerSize);
    // console.log('图片原始尺寸:', imageSize);
    // console.log('缩放后尺寸:', scaledWidth, 'x', scaledHeight);
    // console.log('当前位置:', position);
    
    // 计算边界限制 - 修正公式
    // const maxX = Math.max(0, (scaledWidth - containerSize.width) / (  scale));
    // const maxY = Math.max(0, (scaledHeight - containerSize.height) / ( scale));

    // const minX = 0;//-maxX;
    // const minY = 0;//-maxY;
       const minX = -Math.max(0, (scaledWidth - containerSize.width) / (  scale));
    const minY = -Math.max(0, (scaledHeight - containerSize.height) / ( scale));

    const maxX = 0;//-maxX;
    const maxY = 0;//-maxY;
    // console.log('允许范围 X:', minX, '到', maxX);
    // console.log('允许范围 Y:', minY, '到', maxY);
    
    const constrainedX = Math.max(minX, Math.min(maxX, position.x));
    const constrainedY = Math.max(minY, Math.min(maxY, position.y));
    
    if (position.x !== constrainedX || position.y !== constrainedY) {
      //console.log('位置修正:', { x: constrainedX, y: constrainedY });
      this.setState({
        position: {
          x: constrainedX,
          y: constrainedY
        }
      });
    }
  };

  handlePointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    
    this.setState({
      isDragging: true,
      dragStart: { x: e.clientX, y: e.clientY },
      startPosition: { ...this.state.position }
    });
    
    this.dragTimeout = setTimeout(() => {
      this.setState({ isDragging: true });
    }, 300);
  };

  handlePointerMove = (e) => {
    if (!this.state.isDragging) return;
    e.preventDefault();
    
    const { dragStart, startPosition, scale } = this.state;
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;
    
    this.setState({
      position: {
        x: startPosition.x + dx,
        y: startPosition.y + dy
      }
    }, this.applyBoundaryConstraints);
  };

  handlePointerUp = (e) => {
    if (this.dragTimeout) clearTimeout(this.dragTimeout);
    
    const { isDragging, dragStart } = this.state;
    const distance = Math.sqrt(
      Math.pow(e.clientX - dragStart.x, 2) + 
      Math.pow(e.clientY - dragStart.y, 2)
    );
    
    if (isDragging && distance < 5) {
      this.placeMarker(e);
    }
    
    this.setState({ isDragging: false }, this.applyBoundaryConstraints);
  };

  handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { scale, containerSize } = this.state;
    const containerRect = this.containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // 计算鼠标在图片上的位置
    const imgX = (mouseX / scale) - this.state.position.x;
    const imgY = (mouseY / scale) - this.state.position.y;
    
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 5);
    
    // 计算新的位置，使鼠标下的点保持不变
    const newPositionX = (mouseX / newScale) - imgX;
    const newPositionY = (mouseY / newScale) - imgY;
    
    this.setState({
      scale: newScale,
      position: {
        x: newPositionX,
        y: newPositionY
      }
    }, this.applyBoundaryConstraints);
  };

  placeMarker = (e) => {
  if (!this.containerRef.current || !this.imageRef.current) return;
  
  const containerRect = this.containerRef.current.getBoundingClientRect();
  const x = ((e.clientX - containerRect.left) / this.state.scale) - this.state.position.x;
  const y = ((e.clientY - containerRect.top) / this.state.scale) - this.state.position.y;
  
  const newMarker = { 
    x, 
    y,
    color: this.props.markerColor || '#ff4757',
    id: Date.now()
  };
  
  // 获取当前标记数组
  const currentMarkers = this.props.markers || this.state.markers;
  
  if (this.props.onMarkerAdd) {
    // 如果有回调函数，先移除最后一个标记（如果有的话）
    if (currentMarkers.length > 0) {
      const lastMarker = currentMarkers[currentMarkers.length - 1];
      this.props.onMarkerRemove(lastMarker.id);
    }
    this.props.onMarkerAdd(newMarker);
  } else {
    // 如果没有回调函数，直接操作state
    this.setState(prevState => {
      // 移除最后一个标记（如果有的话）
      const updatedMarkers = prevState.markers.length > 0 
        ? prevState.markers.slice(0, -1) 
        : prevState.markers;
      
      // 添加新标记
      return {
        markers: [...updatedMarkers, newMarker]
      };
    });
  }
};

  removeMarker = (id) => {
    if (this.props.onMarkerRemove) {
      this.props.onMarkerRemove(id);
    } else {
      this.setState(prevState => ({
        markers: prevState.markers.filter(marker => marker.id !== id)
      }));
    }
  };

  zoomIn = () => {
    this.setState(prevState => ({
      scale: Math.min(prevState.scale + 0.2, 5)
    }), this.applyBoundaryConstraints);
  };

  zoomOut = () => {
    this.setState(prevState => ({
      scale: Math.max(prevState.scale - 0.2, 0.5)
    }), this.applyBoundaryConstraints);
  };

  resetView = () => {
    this.setState({
      scale: 1,
      position: { x: 0, y: 0 }
    });
  };

  handleImageLoad = () => {
    const img = this.imageRef.current;
    if (img && img.complete && img.naturalHeight !== 0) {
      this.setState({
        imageLoaded: true,
        imageSize: {
          width: img.naturalWidth,
          height: img.naturalHeight
        }
      }, () => {
        this.updateContainerSize();
        this.applyBoundaryConstraints();
        
        // 初始居中图片
        this.setState({
          position: {
            x: 0,
            y: 0
          }
        });
      });
    }
  };

  handleImageError = () => {
    this.setState({ error: true });
  };

  render() {
    const { src, alt } = this.props;
    const { scale, position, markers, imageLoaded, error } = this.state;
    const allMarkers = this.props.markers || markers;
    
    return (
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div 
          ref={this.containerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '40px',
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
            cursor: this.state.isDragging ? 'grabbing' : 'grab'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '0%',
              left: '0%',
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: 'left top',
              willChange: 'transform',
              transition: 'transform 0.1s ease-out'
            }}
          >
            {error ? (
              <div style={{
                width: '400px',
                height: '300px',
                backgroundColor: '#e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ff4757',
                padding: '20px',
                textAlign: 'center',
                borderRadius: '8px',
                border: '2px dashed #ccc'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                  图片加载失败
                </div>
                <div style={{ marginBottom: '15px' }}>
                  请检查图片路径: {src}
                </div>
              </div>
            ) : (
              <>
                <img
                  ref={this.imageRef}
                  src={src}
                  alt={alt}
                  onLoad={this.handleImageLoad}
                  onError={this.handleImageError}
                  style={{
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 'auto',
                    height: 'auto',
                    maxWidth: 'none',
                    backgroundColor: '#f0f0f0',
                    transition: 'opacity 0.3s ease',
                    opacity: imageLoaded ? 1 : 0,
                    visibility: imageLoaded ? 'visible' : 'hidden'
                  }}
                />
                
                {allMarkers.map(marker => (
                  <div 
                    key={marker.id || `${marker.x}-${marker.y}`}
                    style={{ 
                      position: 'absolute',
                      left: `${marker.x-8/scale}px`, 
                      top: `${marker.y-8/scale}px`,
                      width: '16px',
                      height: '16px',
                      backgroundColor: marker.color || '#ff4757',
                      border: '2px solid white',
                      borderRadius: '50%',
                      boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
                      transformOrigin: 'left top',
                      cursor: 'pointer',
                      zIndex: 10,
                      transform: `scale(${1 / scale})`,
                      transition: 'transform 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.removeMarker(marker.id);
                    }}
                    title={`位置: (${Math.round(marker.x)}, ${Math.round(marker.y)})`}
                  />
                ))}
              </>
            )}
          </div>
          
          {!imageLoaded && !error && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(240, 240, 240, 0.8)',
              zIndex: 30
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(52, 152, 219, 0.2)',
                borderRadius: '50%',
                borderTopColor: '#3498db',
                animation: 'spin 1s linear infinite',
                marginBottom: '10px'
              }}></div>
              <p>加载地图中...</p>
            </div>
          )}
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e0e0e0',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={this.zoomIn} 
              title="放大"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >+</button>
            <button 
              onClick={this.zoomOut} 
              title="缩小"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >-</button>
          </div>
          
          <button 
            onClick={this.resetView} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'auto',
              padding: '0 12px',
              height: '32px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: '15px'
            }}
          >重置</button>
          
          
        </div>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
}

Dragmap.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  markers: PropTypes.array,
  onMarkerAdd: PropTypes.func,
  onMarkerRemove: PropTypes.func,
  markerColor: PropTypes.string
};

Dragmap.defaultProps = {
  alt: "地图",
  markers: [],
  markerColor: '#ff4757'
};

export default Dragmap;