const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: './src/script/index.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: "/"
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      hash: true,
      template: './src/index.html',
      chunks: ['app'],
      // filename: './dist/index.html'
    })
  ],
  devtool:'inline-source-map',
  devServer: {
    contentBase: '/.dist'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
          loader: "style-loader" // 将 JS 字符串生成为 style 节点
          }, {
              loader: "css-loader" // 将 CSS 转化成 CommonJS 模块
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [{
            loader: "style-loader" // 将 JS 字符串生成为 style 节点
        }, {
            loader: "css-loader" // 将 CSS 转化成 CommonJS 模块
        }, {
            loader: "sass-loader" // 将 Sass 编译成 CSS
        }]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'url-loader'
        ]
      },
      {
        test: /\.(csv|tsv)$/,
        use: [
          'csv-loader'
        ]
      },
      {
        test: /\.xml$/,
        use: [
          'xml-loader'
        ]
      },
      {
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src']
          }
        }
      }
    ]
  }
};