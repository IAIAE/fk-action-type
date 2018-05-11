import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

export default {
  entry: 'src/index.js',
  plugins: [ babel(babelrc()) ],
  dest: 'dist/index.js',
  format: 'umd',
  moduleName: 'FkActionType',
  external: [
  ]
};