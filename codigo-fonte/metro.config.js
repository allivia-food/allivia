const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/assets/')) {
    moduleName = path.resolve(__dirname, 'assets', moduleName.slice('@/assets/'.length));
  } else if (moduleName.startsWith('@/')) {
    moduleName = path.resolve(__dirname, 'src', moduleName.slice(2));
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
