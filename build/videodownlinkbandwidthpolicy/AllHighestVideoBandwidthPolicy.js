"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultVideoStreamIdSet_1 = require("../videostreamidset/DefaultVideoStreamIdSet");
/**
 * [[AllHighestVideoBandwidthPolicy]] implements is a rudimentary policy that simply
 * always subscribes to the highest quality video stream available
 * for all non-self participants.
 */
class AllHighestVideoBandwidthPolicy {
    constructor(selfAttendeeId) {
        this.selfAttendeeId = selfAttendeeId;
        this.reset();
    }
    reset() {
        this.optimalReceiveSet = new DefaultVideoStreamIdSet_1.default();
        this.subscribedReceiveSet = new DefaultVideoStreamIdSet_1.default();
        this.videoSources = undefined;
    }
    updateIndex(videoIndex) {
        this.videoIndex = videoIndex;
        this.optimalReceiveSet = this.calculateOptimalReceiveSet(videoIndex);
    }
    updateMetrics(_clientMetricReport) { }
    wantsResubscribe() {
        return !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
    }
    chooseSubscriptions() {
        this.subscribedReceiveSet = this.optimalReceiveSet.clone();
        return this.subscribedReceiveSet.clone();
    }
    chooseRemoteVideoSources(videoSources) {
        this.videoSources = videoSources;
        this.optimalReceiveSet = this.calculateOptimalReceiveSet(this.videoIndex).clone();
    }
    calculateOptimalReceiveSet(videoIndex) {
        const streamSelectionSet = new DefaultVideoStreamIdSet_1.default();
        if (!this.videoIndex || this.videoIndex.allStreams().empty()) {
            return streamSelectionSet;
        }
        const receiveSet = videoIndex.highestQualityStreamFromEachGroupExcludingSelf(this.selfAttendeeId);
        // If video sources are not chosen, then return the default receive set.
        if (this.videoSources === undefined) {
            return receiveSet;
        }
        // Get the list of all the remote stream information
        const remoteInfos = this.videoIndex.remoteStreamDescriptions();
        const mapOfAttendeeIdToOptimalStreamId = new Map();
        for (const info of remoteInfos) {
            if (receiveSet.contain(info.streamId)) {
                mapOfAttendeeIdToOptimalStreamId.set(info.attendeeId, info.streamId);
            }
        }
        for (const videoSource of this.videoSources) {
            const attendeeId = videoSource.attendee.attendeeId;
            if (mapOfAttendeeIdToOptimalStreamId.has(attendeeId)) {
                streamSelectionSet.add(mapOfAttendeeIdToOptimalStreamId.get(attendeeId));
            }
        }
        return streamSelectionSet;
    }
}
exports.default = AllHighestVideoBandwidthPolicy;
//# sourceMappingURL=AllHighestVideoBandwidthPolicy.js.map