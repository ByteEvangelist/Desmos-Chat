const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const fs = require('fs');
const dotenvFileExists =
  fs.existsSync('./.env.production') || fs.existsSync('./.env');

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
    path: path.resolve(__dirname, 'dist/calculator'),
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

    ...(dotenvFileExists
      ? [
          new Dotenv({
            path: `./.env.${env.production ? 'production' : 'development'}`,
          }),
        ]
      : [
          new webpack.DefinePlugin({
            API_URL: JSON.stringify(process.env.API_URL),
            TRANSPORT: JSON.stringify(process.env.TRANSPORT),
          }),
        ]),
  ],

  mode: 'none',
});
