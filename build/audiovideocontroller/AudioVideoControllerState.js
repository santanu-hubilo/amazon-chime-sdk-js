"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[AudioVideoControllerState]] includes the compute resources shared by [[Task]].
 */
class AudioVideoControllerState {
    constructor() {
        this.logger = null;
        this.browserBehavior = null;
        this.signalingClient = null;
        this.meetingSessionConfiguration = null;
        this.peer = null;
        this.previousSdpOffer = null;
        this.sdpOfferInit = null;
        this.audioVideoController = null;
        this.realtimeController = null;
        this.videoTileController = null;
        this.mediaStreamBroker = null;
        this.audioMixController = null;
        this.activeAudioInput = null;
        this.activeVideoInput = null;
        this.transceiverController = null;
        this.indexFrame = null;
        this.iceCandidates = [];
        this.iceCandidateHandler = null;
        this.iceGatheringStateEventHandler = null;
        this.sdpAnswer = null;
        this.turnCredentials = null;
        this.reconnectController = null;
        this.removableObservers = [];
        this.audioProfile = null;
        this.videoStreamIndex = null;
        this.videoDownlinkBandwidthPolicy = null;
        this.videoUplinkBandwidthPolicy = null;
        this.lastKnownVideoAvailability = null;
        this.localVideoSender = null;
        this.localAudioSender = null;
        this.videoCaptureAndEncodeParameter = null;
        // An unordered list of IDs provided by the downlink policy that
        // we will eventually subscribe to.
        this.videosToReceive = null;
        // The last processed set of IDs provided by the policy, so that we can
        // compare what changes were additions, stream switches, or removals.
        this.lastVideosToReceive = null;
        // An ordered list corresponding to `videosToReceive` where the order
        // itself correspond to transceivers; 0 in this list corresponds to an inactive tranceiver.
        this.videoSubscriptions = null;
        // The video subscription limit is set by the backend and is subject to change in future.
        // This value is set in the `JoinAndReceiveIndexTask` when we process the `SdkJoinAckFrame`
        // and is used in the `ReceiveVideoStreamIndexTask` to limit the total number of streams
        // that we include in the `videosToReceive`.
        this.videoSubscriptionLimit = 25;
        this.videosPaused = null;
        this.videoDuplexMode = null;
        this.volumeIndicatorAdapter = null;
        this.statsCollector = null;
        this.connectionMonitor = null;
        this.videoInputAttachedTimestampMs = 0;
        this.audioDeviceInformation = {};
        this.videoDeviceInformation = {};
        this.enableSimulcast = false;
        this.eventController = null;
        this.signalingOpenDurationMs = null;
        this.iceGatheringDurationMs = null;
        this.startAudioVideoTimestamp = null;
        this.attendeePresenceDurationMs = null;
        this.meetingStartDurationMs = null;
        this.poorConnectionCount = 0;
        this.maxVideoTileCount = 0;
        this.startTimeMs = null;
    }
}
exports.default = AudioVideoControllerState;
//# sourceMappingURL=AudioVideoControllerState.js.map