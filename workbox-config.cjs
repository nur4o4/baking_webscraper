module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,css,html,svg,json}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true
}; 