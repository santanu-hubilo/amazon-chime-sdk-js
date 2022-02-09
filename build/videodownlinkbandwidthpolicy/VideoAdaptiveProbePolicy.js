"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const ContentShareConstants_1 = require("../contentsharecontroller/ContentShareConstants");
const VideoPreference_1 = require("./VideoPreference");
const VideoPreferences_1 = require("./VideoPreferences");
const VideoPriorityBasedPolicy_1 = require("./VideoPriorityBasedPolicy");
class VideoAdaptiveProbePolicy extends VideoPriorityBasedPolicy_1.default {
    constructor(logger) {
        super(logger);
        this.logger = logger;
        super.shouldPauseTiles = false;
        this.videoPreferences = undefined;
    }
    reset() {
        super.reset();
        super.shouldPauseTiles = false;
        this.videoPreferences = undefined;
    }
    updateIndex(videoIndex) {
        super.updateIndex(videoIndex);
        const newPreferences = VideoPreferences_1.VideoPreferences.prepare();
        let containsContent = false;
        const remoteInfos = videoIndex.remoteStreamDescriptions();
        // If there is active content then set that as high priority, and the rest at lower
        for (const info of remoteInfos) {
            // I don't know why we need to do this duplicate check.
            if (!newPreferences.some(preference => preference.attendeeId === info.attendeeId)) {
                // For now always subscribe to content even if higher bandwidth then target
                if (info.attendeeId.endsWith(ContentShareConstants_1.default.Modality)) {
                    newPreferences.add(new VideoPreference_1.default(info.attendeeId, 1));
                    containsContent = true;
                }
                else {
                    newPreferences.add(new VideoPreference_1.default(info.attendeeId, 2));
                }
            }
        }
        if (containsContent) {
            this.videoPreferences = newPreferences.build();
            this.videoPreferencesUpdated = true;
        }
        else {
            this.videoPreferences = undefined;
        }
    }
    /**
     * [[VideoAdaptiveProbePolicy]] does not allow setting video preferences and this function
     * will be a no-op.  Please use [[VideoPriorityBasedPolicy]] directly if you would like to set
     * preferences.
     */
    chooseRemoteVideoSources(_preferences) {
        this.logger.error('chooseRemoteVideoSources should not be called by VideoAdaptiveProbePolicy');
        return;
    }
}
exports.default = VideoAdaptiveProbePolicy;
//# sourceMappingURL=VideoAdaptiveProbePolicy.js.map