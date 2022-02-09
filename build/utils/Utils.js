"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLowerCasePropertyNames = exports.isIFramed = exports.wait = void 0;
function wait(waitTimeMs) {
    return new Promise(resolve => setTimeout(resolve, waitTimeMs));
}
exports.wait = wait;
// This is impossible to adequately test in Node, so Istanbul ignore.
/* istanbul ignore next */
function isIFramed() {
    var _a;
    // Same-origin iframes can check `nodeName`.
    // We can also check whether the parent window and the top window are the same.
    // Cross-origin iframes will throw on the `parent` check, so catch here.
    try {
        return ((_a = window.frameElement) === null || _a === void 0 ? void 0 : _a.nodeName) === 'IFRAME' || parent !== top;
    }
    catch (e) {
        // Very likely to be a cross-origin iframe.
        return true;
    }
}
exports.isIFramed = isIFramed;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLowerCasePropertyNames(input) {
    if (input === null) {
        return null;
    }
    else if (typeof input !== 'object') {
        return input;
    }
    else if (Array.isArray(input)) {
        return input.map(toLowerCasePropertyNames);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.keys(input).reduce((result, key) => {
        const value = input[key];
        const newValue = typeof value === 'object' ? toLowerCasePropertyNames(value) : value;
        result[key.toLowerCase()] = newValue;
        return result;
    }, {});
}
exports.toLowerCasePropertyNames = toLowerCasePropertyNames;
//# sourceMappingURL=Utils.js.map