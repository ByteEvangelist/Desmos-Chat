const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');

module.exports = (env) => ({
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.(png|jpg|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  entry: {
    loadingScreen: './src/loadingScreen.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/](?!socket\.io-client)[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },

    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Desmos | Graphing Calculator',
      favicon: './src/Assets/favicon.ico',
    }),
    new Dotenv({
      path: `./.env.${env.production ? 'production' : 'development'}`,
    }),
  ],
  mode: 'none',
});
