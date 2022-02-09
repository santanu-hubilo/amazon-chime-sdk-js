"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const TargetDisplaySize_1 = require("./TargetDisplaySize");
class VideoPreference {
    /** Initializes a [[VideoPreference]] with the given properties.
     *
     * @param attendeeId Attendee ID of the client
     * @param priority The relative priority of this attendee against others.
     * @param targetSize The desired maximum simulcast layers to receive.
     */
    constructor(attendeeId, priority, targetSize) {
        this.attendeeId = attendeeId;
        this.priority = priority;
        this.targetSize = targetSize !== undefined ? targetSize : TargetDisplaySize_1.default.High;
    }
    partialCompare(other) {
        return this.priority - other.priority;
    }
    equals(other) {
        return (this.attendeeId === other.attendeeId &&
            this.targetSize === other.targetSize &&
            this.priority === other.priority);
    }
    targetSizeToBitrateKbps(targetSize) {
        switch (targetSize) {
            case TargetDisplaySize_1.default.High:
                return VideoPreference.HIGH_BITRATE_KBPS;
            case TargetDisplaySize_1.default.Medium:
                return VideoPreference.MID_BITRATE_KBPS;
            case TargetDisplaySize_1.default.Low:
                return VideoPreference.LOW_BITRATE_KBPS;
        }
    }
}
exports.default = VideoPreference;
VideoPreference.LOW_BITRATE_KBPS = 300;
VideoPreference.MID_BITRATE_KBPS = 600;
VideoPreference.HIGH_BITRATE_KBPS = 1200;
//# sourceMappingURL=VideoPreference.js.map