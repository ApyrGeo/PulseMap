'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
exports.Commands = void 0;
const { requireNativeComponent } = require('react-native');
exports.default = requireNativeComponent('RNSSearchBar');

exports.Commands = {
  blur: () => {},
  focus: () => {},
  clearText: () => {},
  toggleCancelButton: () => {},
  setText: () => {},
  cancelSearch: () => {},
};
