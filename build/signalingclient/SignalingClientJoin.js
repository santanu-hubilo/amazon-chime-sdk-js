"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[SignalingClientJoin]] contains settings for the Join SignalFrame.
 */
class SignalingClientJoin {
    /** Initializes a SignalingClientJoin with the given properties.
     *
     * // maxVideos is deprecated as the video sending/receiving capacity limits
     * // for a meeting will be controlled by the backend.
     * @param maxVideos Usage of maxVideos variable will result into no-op.
     * @param sendBitrates Whether the server should send Bitrates messages.
     * @param applicationMetadata [[ApplicationMetadata]].
     */
    constructor(maxVideos, sendBitrates, applicationMetadata) {
        this.maxVideos = maxVideos;
        this.sendBitrates = sendBitrates;
        this.applicationMetadata = applicationMetadata;
    }
}
exports.default = SignalingClientJoin;
//# sourceMappingURL=SignalingClientJoin.js.map