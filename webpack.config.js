const path = require("path");

module.exports = {
  
  // 移除 @babel/polyfill（已废弃），改用 core-js 直接导入
  entry: ["./client/src/index.js"],
  output: {
    path: path.resolve(__dirname, "client", "dist"),
    filename: "main.js",
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: [
            ['@babel/preset-env', {
              useBuiltIns: 'usage', // 按需引入 polyfill
              corejs: 3,
              targets: {
                // 移除 IE10 支持，减少大量 polyfill
                browsers: ['> 1%', 'not dead', 'not ie <= 11']
              },
              debug: false // 关闭调试日志
            }],
            '@babel/preset-react'
          ]
        }
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
        ],
      },
      {
        test: /\.md$/,
        type: 'asset/source',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          "url-loader",
        ],
      },
      {
        test: /\.(mp3|wav|m4a|ogg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'assets/audio/'
          }
        }
      },
    ],
  },
  
  mode: "development",
  
  // 添加 stats 配置来过滤日志
  stats: {
    // 只显示错误和警告
    preset: 'errors-warnings',
    // 或者手动过滤
    warningsFilter: [
      /corejs3 polyfill added/,
      /regenerator polyfill did not add/,
      /Based on your code and targets/
    ],
    // 关闭模块信息
    modules: false,
    // 关闭详细日志
    logging: 'warn',
    loggingTrace: false
  },
  
  // 基础设施日志级别
  infrastructureLogging: {
    level: 'warn',
    // 或者完全关闭
    // level: 'none'
  },
  
  devServer: {
    historyApiFallback: true,
    port: 5000,
    static: [
      path.resolve(__dirname, "client", "dist"),
      path.resolve(__dirname, "public"),
    ],
    open: true,
    proxy: {
      "/api": "http://localhost:3000",
      "/upload": "http://localhost:3000",
    },
    // devServer 的日志级别
    client: {
      logging: 'warn',
      overlay: {
        errors: true,
        warnings: false
      }
    }
  },
  
};

