const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// TF.js model weight shards, loaded via tfjs-react-native's bundleResourceIO.
config.resolver.assetExts.push('bin');

// tfjs-react-native's bundle_resource_io.js has a `require('react-native-fs')`
// on a non-Expo code path that is never executed here, but Metro resolves it
// statically. Resolve it to an empty module instead of adding a bare-RN
// native dependency that Expo Go can't load anyway.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-fs') return { type: 'empty' };
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
