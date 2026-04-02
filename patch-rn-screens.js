// Run with: node patch-rn-screens.js
// Strategy: replace "CodegenTypes as CT" import with direct import from
// react-native/Libraries/Types/CodegenTypes, preserving all CT.* type usage
// so the Kotlin codegen contract is unchanged.
const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/react-native-screens/src/fabric/FullWindowOverlayNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/gamma/SplitViewHostNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/gamma/SplitViewScreenNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/gamma/stack/StackScreenNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/ModalScreenNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/safe-area/SafeAreaViewNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/ScreenNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/ScreenStackHeaderConfigNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/ScreenStackHeaderSubviewNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/ScreenStackNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/SearchBarNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/tabs/TabsBottomAccessoryContentNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/tabs/TabsBottomAccessoryNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/tabs/TabsHostNativeComponent.ts',
  'node_modules/react-native-screens/src/fabric/tabs/TabsScreenNativeComponent.ts',
  'node_modules/react-native-screens/src/components/SearchBar.tsx',
];

let patched = 0;

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Step 1: Remove CodegenTypes from the react-native import line.
  // Handles: import type { CodegenTypes as CT, X } from 'react-native'
  //      and: import type { X, CodegenTypes as CT } from 'react-native'
  content = content.replace(
    /import\s+type\s*\{([^}]*)\}\s*from\s*'react-native';/g,
    (match, imports) => {
      const parts = imports.split(',').map(s => s.trim());
      const hasCodegenTypes = parts.some(s => s.startsWith('CodegenTypes'));
      if (!hasCodegenTypes) return match; // nothing to do

      const cleaned = parts.filter(s => !s.startsWith('CodegenTypes')).join(', ');
      if (!cleaned.trim()) return '';
      return `import type { ${cleaned} } from 'react-native';`;
    }
  );

  // Step 2: If file used CT.* and we removed CodegenTypes, add a direct import.
  // Only add if the file still has CT. references.
  if (/\bCT\./.test(content) && !/from 'react-native\/Libraries\/Types\/CodegenTypes'/.test(content)) {
    // Detect which CT types are actually used so we import only what's needed
    const usesWithDefault = /CT\.WithDefault/.test(content);
    const usesDirectEvent = /CT\.DirectEventHandler/.test(content);
    const usesBubblingEvent = /CT\.BubblingEventHandler/.test(content);
    const typeNames = [
      usesWithDefault && 'WithDefault',
      usesDirectEvent && 'DirectEventHandler',
      usesBubblingEvent && 'BubblingEventHandler',
    ].filter(Boolean).join(', ');

    if (typeNames) {
      // Insert import after the last existing import line
      content = content.replace(
        /((?:import[^;]+;[\r\n]+)+)/,
        `$1import type { ${typeNames} } from 'react-native/Libraries/Types/CodegenTypes';\n`
      );
    }
  }

  // Step 3: Replace CT.* with the bare type names
  content = content.replace(/\bCT\.WithDefault\b/g, 'WithDefault');
  content = content.replace(/\bCT\.DirectEventHandler\b/g, 'DirectEventHandler');
  content = content.replace(/\bCT\.BubblingEventHandler\b/g, 'BubblingEventHandler');

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`PATCHED: ${relPath}`);
    patched++;
  } else {
    console.log(`UNCHANGED: ${relPath}`);
  }
}

console.log(`\nDone. Patched ${patched} files.`);
