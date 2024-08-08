const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    'react-refresh/runtime': path.resolve(__dirname, 'node_modules/react-refresh/runtime.js'),
  })
);