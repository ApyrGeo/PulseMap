const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');

const defaultConfig = getDefaultConfig(projectRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;

// Stubs that replace react-native-screens fabric NativeComponent TypeScript files.
// The TS originals fail @react-native/babel-plugin-codegen (RN 0.76 can't parse
// certain type patterns). The stubs call requireNativeComponent directly, which
// IS exported from react-native and works with Old Architecture (newArchEnabled=false).
const screensFabricStubs = path.resolve(projectRoot, 'src/stubs/rn-screens-fabric');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
    extraNodeModules: {
      'react': path.resolve(workspaceRoot, 'node_modules/react'),
      'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === '@pulse-map/shared') {
        return {
          filePath: path.resolve(workspaceRoot, 'shared/src/index.ts'),
          type: 'sourceFile',
        };
      }

      if (moduleName === 'react-native-maps') {
        return {
          filePath: path.resolve(projectRoot, 'src/shims/react-native-maps.native.tsx'),
          type: 'sourceFile',
        };
      }

      // Redirect all *NativeComponent files under react-native-screens/src/fabric/
      // to their pre-compiled JS equivalents. RN 0.76's @react-native/babel-plugin-codegen
      // fails on various TypeScript patterns in these files (named type aliases, UnsafeMixed,
      // wrong-typed defaults). NativeScreensModule is intentionally excluded — it has
      // side-effect initialization that the compiled version handles differently.
      const originNorm = (context.originModulePath || '').replace(/\\/g, '/');
      const moduleNorm = moduleName.replace(/\\/g, '/');
      if (
        originNorm.includes('react-native-screens/src/') &&
        moduleNorm.includes('/fabric/') &&
        moduleNorm.includes('NativeComponent')
      ) {
        const fabricIdx = moduleNorm.indexOf('/fabric/');
        const relativePath = moduleNorm.slice(fabricIdx + '/fabric/'.length);
        return {
          filePath: path.join(screensFabricStubs, relativePath + '.js'),
          type: 'sourceFile',
        };
      }

      return context.resolveRequest(context, moduleName, platform);
    },
    blockList: [
      new RegExp(
        path.join(projectRoot, 'android', 'app', '\\.cxx').replace(/\\/g, '\\\\')
      ),
    ],
  },
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
};

module.exports = mergeConfig(defaultConfig, config);
