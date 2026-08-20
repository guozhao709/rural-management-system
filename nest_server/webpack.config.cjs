/** @type {import('webpack').Configuration | ((options: import('webpack').Configuration) => import('webpack').Configuration)} */
module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    extensionAlias: {
      ...options.resolve?.extensionAlias,
      '.js': ['.js', '.ts'],
    },
  },
});
