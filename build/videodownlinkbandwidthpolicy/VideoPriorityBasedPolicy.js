"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const ClientMetricReportDirection_1 = require("../clientmetricreport/ClientMetricReportDirection");
const ClientMetricReportMediaType_1 = require("../clientmetricreport/ClientMetricReportMediaType");
const ContentShareConstants_1 = require("../contentsharecontroller/ContentShareConstants");
const LogLevel_1 = require("../logger/LogLevel");
const DefaultVideoStreamIdSet_1 = require("../videostreamidset/DefaultVideoStreamIdSet");
const TargetDisplaySize_1 = require("./TargetDisplaySize");
const VideoPreference_1 = require("./VideoPreference");
const VideoPreferences_1 = require("./VideoPreferences");
const VideoPriorityBasedPolicyConfig_1 = require("./VideoPriorityBasedPolicyConfig");
/** @internal */
class LinkMediaStats {
    constructor() {
        this.bandwidthEstimateKbps = 0;
        this.usedBandwidthKbps = 0;
        this.packetsLost = 0;
        this.nackCount = 0;
        this.rttMs = 0;
    }
}
class VideoPriorityBasedPolicy {
    constructor(logger, videoPriorityBasedPolicyConfig = VideoPriorityBasedPolicyConfig_1.default.Default) {
        this.logger = logger;
        this.videoPriorityBasedPolicyConfig = videoPriorityBasedPolicyConfig;
        this.shouldPauseTiles = true;
        this.observerQueue = new Set();
        this.pausedBwAttendeeIds = new Set();
        this.reset();
    }
    reset() {
        this.optimalReceiveSet = new DefaultVideoStreamIdSet_1.default();
        this.optimalReceiveStreams = [];
        this.optimalNonPausedReceiveStreams = [];
        this.subscribedReceiveSet = new DefaultVideoStreamIdSet_1.default();
        this.subscribedReceiveStreams = [];
        this.videoPreferences = undefined;
        this.defaultVideoPreferences = undefined;
        this.shouldPauseTiles = true;
        this.pausedStreamIds = new DefaultVideoStreamIdSet_1.default();
        this.pausedBwAttendeeIds = new Set();
        this.videoPreferencesUpdated = false;
        this.logCount = 0;
        this.startupPeriod = true;
        this.usingPrevTargetRate = false;
        this.rateProbeState = "Not Probing" /* NotProbing */;
        this.firstEstimateTimestamp = 0;
        this.lastUpgradeRateKbps = 0;
        this.timeBeforeAllowSubscribeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS;
        this.lastProbeTimestamp = Date.now();
        this.timeBeforeAllowProbeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS;
        this.downlinkStats = new LinkMediaStats();
        this.prevDownlinkStats = new LinkMediaStats();
        this.probeFailed = false;
    }
    bindToTileController(tileController) {
        this.tileController = tileController;
        this.logger.info('tileController bound');
    }
    // This function allows setting preferences without the need to inherit from this class
    // which would require not using the internal keyword
    chooseRemoteVideoSources(preferences) {
        var _a;
        if ((_a = this.videoPreferences) === null || _a === void 0 ? void 0 : _a.equals(preferences)) {
            return;
        }
        this.videoPreferences = preferences;
        this.videoPreferencesUpdated = true;
        this.logger.info(`bwe: setVideoPreferences bwe: new preferences: ${JSON.stringify(preferences)}`);
        return;
    }
    updateIndex(videoIndex) {
        this.videoIndex = videoIndex;
        if (!this.videoPreferences) {
            this.updateDefaultVideoPreferences();
        }
    }
    updateDefaultVideoPreferences() {
        const attendeeIds = new Set();
        for (const stream of this.videoIndex.remoteStreamDescriptions()) {
            attendeeIds.add(stream.attendeeId);
        }
        const prefs = VideoPreferences_1.VideoPreferences.prepare();
        const numAttendees = attendeeIds.size;
        let targetDisplaySize = TargetDisplaySize_1.default.High;
        if (numAttendees > 8) {
            targetDisplaySize = TargetDisplaySize_1.default.Low;
        }
        else if (numAttendees > 4) {
            targetDisplaySize = TargetDisplaySize_1.default.Medium;
        }
        for (const attendeeId of attendeeIds) {
            prefs.add(new VideoPreference_1.default(attendeeId, 1, targetDisplaySize));
        }
        this.defaultVideoPreferences = prefs.build();
    }
    updateMetrics(clientMetricReport) {
        if (!this.videoIndex || this.videoIndex.allStreams().empty()) {
            return;
        }
        this.prevDownlinkStats = this.downlinkStats;
        this.downlinkStats = new LinkMediaStats();
        const metricReport = clientMetricReport.getObservableMetrics();
        // Currently we have different stats between different browsers.
        // availableReceiveBandwidth is the old legacy Google stat
        // availableIncomingBitrate is the standard stat but is not available in Firefox yet so only Safari for now.
        if (!isNaN(metricReport.availableIncomingBitrate)) {
            this.downlinkStats.bandwidthEstimateKbps = metricReport.availableIncomingBitrate / 1000;
        }
        else {
            this.downlinkStats.bandwidthEstimateKbps = metricReport.availableReceiveBandwidth / 1000;
        }
        for (const ssrcStr in clientMetricReport.streamMetricReports) {
            const ssrc = Number.parseInt(ssrcStr, 10);
            const metrics = clientMetricReport.streamMetricReports[ssrc];
            if (metrics.direction === ClientMetricReportDirection_1.default.DOWNSTREAM && metrics.mediaType === ClientMetricReportMediaType_1.default.VIDEO) {
                // Only use video stream metrics
                if (metrics.currentMetrics.hasOwnProperty('googNacksSent')) {
                    this.downlinkStats.nackCount += clientMetricReport.countPerSecond('googNacksSent', ssrc);
                }
                else if (metrics.currentMetrics.hasOwnProperty('nackCount')) {
                    this.downlinkStats.nackCount += clientMetricReport.countPerSecond('nackCount', ssrc);
                }
                if (metrics.currentMetrics.hasOwnProperty('packetsLost')) {
                    this.downlinkStats.packetsLost += clientMetricReport.countPerSecond('packetsLost', ssrc);
                }
                if (metrics.currentMetrics.hasOwnProperty('bytesReceived')) {
                    this.downlinkStats.usedBandwidthKbps +=
                        clientMetricReport.bitsPerSecond('bytesReceived', ssrc) / 1000;
                }
            }
        }
    }
    wantsResubscribe() {
        this.calculateOptimalReceiveSet();
        return !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
    }
    chooseSubscriptions() {
        if (!this.subscribedReceiveSet.equal(this.optimalReceiveSet)) {
            this.lastSubscribeTimestamp = Date.now();
        }
        this.subscribedReceiveSet = this.optimalReceiveSet.clone();
        this.subscribedReceiveStreams = this.optimalReceiveStreams.slice();
        return this.subscribedReceiveSet.clone();
    }
    addObserver(observer) {
        this.observerQueue.add(observer);
    }
    removeObserver(observer) {
        this.observerQueue.delete(observer);
    }
    forEachObserver(observerFunc) {
        for (const observer of this.observerQueue) {
            observerFunc(observer);
        }
    }
    setVideoPriorityBasedPolicyConfigs(config) {
        this.videoPriorityBasedPolicyConfig = config;
    }
    // convert network event delay factor to actual delay in ms
    getSubscribeDelay(event, numberOfParticipants) {
        // left and right boundary of the delay
        let subscribeDelay = VideoPriorityBasedPolicy.MINIMUM_DELAY;
        const range = VideoPriorityBasedPolicy.MAXIMUM_DELAY - VideoPriorityBasedPolicy.MINIMUM_DELAY;
        const responseFactor = this.videoPriorityBasedPolicyConfig.networkIssueResponseDelayFactor;
        const recoveryFactor = this.videoPriorityBasedPolicyConfig.networkIssueRecoveryDelayFactor;
        switch (event) {
            case 0 /* Decrease */:
                // we include number of participants here since bigger size of the meeting will generate higher bitrate
                subscribeDelay += range * responseFactor * (1 + numberOfParticipants / 10);
                subscribeDelay = Math.min(VideoPriorityBasedPolicy.MAXIMUM_DELAY, subscribeDelay);
                break;
            case 1 /* Increase */:
                subscribeDelay += range * recoveryFactor;
                break;
        }
        return subscribeDelay;
    }
    calculateOptimalReceiveStreams() {
        var _a;
        const chosenStreams = [];
        const remoteInfos = this.videoIndex.remoteStreamDescriptions();
        if (remoteInfos.length === 0 || ((_a = this.videoPreferences) === null || _a === void 0 ? void 0 : _a.isEmpty())) {
            this.optimalReceiveStreams = [];
            return;
        }
        const lastProbeState = this.rateProbeState;
        this.cleanBwPausedTiles(remoteInfos);
        this.handleAppPausedStreams(chosenStreams, remoteInfos);
        const sameStreamChoices = this.availStreamsSameAsLast(remoteInfos);
        // If no major changes then don't allow subscribes for the allowed amount of time
        const noMajorChange = !this.startupPeriod && sameStreamChoices;
        // subscribe interval will be changed if probe failed, will take this temporary interval into account
        if (noMajorChange &&
            this.probeFailed &&
            Date.now() - this.lastSubscribeTimestamp < this.timeBeforeAllowSubscribeMs) {
            return;
        }
        this.probeFailed = false;
        // Sort streams by bitrate ascending.
        remoteInfos.sort((a, b) => {
            if (a.maxBitrateKbps === b.maxBitrateKbps) {
                return a.streamId - b.streamId;
            }
            return a.maxBitrateKbps - b.maxBitrateKbps;
        });
        // Convert 0 avg bitrates to max and handle special cases
        for (const info of remoteInfos) {
            if (info.avgBitrateKbps === 0 || info.avgBitrateKbps > info.maxBitrateKbps) {
                // Content can be a special case
                if (info.attendeeId.endsWith(ContentShareConstants_1.default.Modality) && info.maxBitrateKbps < 100) {
                    info.maxBitrateKbps = info.avgBitrateKbps;
                }
                else {
                    info.avgBitrateKbps = info.maxBitrateKbps;
                }
            }
        }
        const rates = {
            targetDownlinkBitrate: 0,
            chosenTotalBitrate: 0,
            deltaToNextUpgrade: 0,
        };
        rates.targetDownlinkBitrate = this.determineTargetRate();
        // calculate subscribe delay based on bandwidth increasing/decreasing
        const numberOfParticipants = this.subscribedReceiveSet.size();
        const prevEstimated = this.prevDownlinkStats.bandwidthEstimateKbps;
        const currEstimated = this.downlinkStats.bandwidthEstimateKbps;
        if (currEstimated > prevEstimated) {
            // if bw increases, we use recovery delay
            this.timeBeforeAllowSubscribeMs = this.getSubscribeDelay(1 /* Increase */, numberOfParticipants);
        }
        else if (currEstimated < prevEstimated) {
            // if bw decreases, we use response delay
            this.timeBeforeAllowSubscribeMs = this.getSubscribeDelay(0 /* Decrease */, numberOfParticipants);
        }
        // If no major changes then don't allow subscribes for the allowed amount of time
        if (noMajorChange &&
            Date.now() - this.lastSubscribeTimestamp < this.timeBeforeAllowSubscribeMs) {
            return;
        }
        const upgradeStream = this.priorityPolicy(rates, remoteInfos, chosenStreams);
        let subscriptionChoice = 0 /* NewOptimal */;
        // Look for probing or override opportunities
        if (!this.startupPeriod && sameStreamChoices) {
            if (this.rateProbeState === "Probing" /* Probing */) {
                subscriptionChoice = this.handleProbe(chosenStreams, rates.targetDownlinkBitrate);
            }
            else if (rates.deltaToNextUpgrade !== 0) {
                subscriptionChoice = this.maybeOverrideOrProbe(chosenStreams, rates, upgradeStream);
            }
        }
        else {
            // If there was a change in streams to choose from, then cancel any probing or upgrades
            this.setProbeState("Not Probing" /* NotProbing */);
            this.lastUpgradeRateKbps = 0;
        }
        this.prevRemoteInfos = remoteInfos;
        this.videoPreferencesUpdated = false;
        if (subscriptionChoice === 1 /* PreviousOptimal */) {
            this.logger.info(`bwe: keepSameSubscriptions stats:${JSON.stringify(this.downlinkStats)}`);
            this.prevTargetRateKbps = rates.targetDownlinkBitrate;
            return;
        }
        if (subscriptionChoice === 2 /* PreProbe */) {
            const subscribedRate = this.calculateSubscribeRate(this.preProbeNonPausedReceiveStreams);
            this.optimalReceiveStreams = this.preProbeReceiveStreams.slice();
            this.processBwPausedStreams(remoteInfos, this.preProbeNonPausedReceiveStreams);
            this.logger.info('bwe: Use Pre-Probe subscription subscribedRate:' + subscribedRate);
            return;
        }
        this.optimalNonPausedReceiveStreams = chosenStreams.slice();
        const lastNumberPaused = this.pausedBwAttendeeIds.size;
        this.processBwPausedStreams(remoteInfos, chosenStreams);
        if (this.logger.getLogLevel() <= LogLevel_1.LogLevel.INFO &&
            (this.logCount % 15 === 0 ||
                this.rateProbeState !== lastProbeState ||
                this.optimalReceiveStreams.length !== chosenStreams.length ||
                lastNumberPaused !== this.pausedBwAttendeeIds.size)) {
            this.logger.info(this.policyStateLogStr(remoteInfos, rates.targetDownlinkBitrate));
            this.logCount = 0;
        }
        this.logCount++;
        this.prevTargetRateKbps = rates.targetDownlinkBitrate;
        this.optimalReceiveStreams = chosenStreams.slice();
    }
    calculateOptimalReceiveSet() {
        const streamSelectionSet = new DefaultVideoStreamIdSet_1.default();
        this.calculateOptimalReceiveStreams();
        for (const stream of this.optimalReceiveStreams) {
            streamSelectionSet.add(stream.streamId);
        }
        if (!this.optimalReceiveSet.equal(streamSelectionSet)) {
            const subscribedRate = this.calculateSubscribeRate(this.optimalReceiveStreams);
            this.logger.info(`bwe: new streamSelection: ${JSON.stringify(streamSelectionSet)} subscribedRate:${subscribedRate}`);
        }
        this.optimalReceiveSet = streamSelectionSet;
    }
    determineTargetRate() {
        let targetBitrate = 0;
        const now = Date.now();
        // Startup phase handling.  During this period the estimate can be 0 or
        // could still be slowly hunting for a steady state.  This startup ramp up
        // can cause a series of subscribes which can be distracting. During this
        // time just use our configured default value
        if (this.downlinkStats.bandwidthEstimateKbps !== 0) {
            if (this.firstEstimateTimestamp === 0) {
                this.firstEstimateTimestamp = now;
            }
            // handle startup state where estimator is still converging.
            if (this.startupPeriod) {
                // Drop out of startup period if
                // - estimate is above default
                // - get packet loss and have a valid estimate
                // - startup period has expired and rate is not still increasing
                if (this.downlinkStats.bandwidthEstimateKbps >
                    VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS ||
                    this.downlinkStats.packetsLost > 0 ||
                    (now - this.firstEstimateTimestamp > VideoPriorityBasedPolicy.STARTUP_PERIOD_MS &&
                        this.downlinkStats.bandwidthEstimateKbps <=
                            this.prevDownlinkStats.bandwidthEstimateKbps)) {
                    this.startupPeriod = false;
                    this.prevTargetRateKbps = this.downlinkStats.bandwidthEstimateKbps;
                }
            }
            // If we are in the startup period and we haven't detected any packet loss, then
            // keep it at the default to let the estimation get to a steady state
            if (this.startupPeriod) {
                targetBitrate = VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS;
            }
            else {
                targetBitrate = this.downlinkStats.bandwidthEstimateKbps;
            }
        }
        else {
            if (this.firstEstimateTimestamp === 0) {
                targetBitrate = VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS;
            }
            else {
                targetBitrate = this.prevTargetRateKbps;
            }
        }
        // Estimated downlink rate can follow actual bandwidth or fall for a short period of time
        // due to the absolute send time estimator incorrectly thinking that a delay in packets is
        // a precursor to packet loss.  We have seen too many false positives on this, so we
        // will ignore largish drops in the estimate if there is no packet loss
        if (!this.startupPeriod &&
            ((this.usingPrevTargetRate &&
                this.downlinkStats.bandwidthEstimateKbps < this.prevTargetRateKbps) ||
                this.downlinkStats.bandwidthEstimateKbps <
                    (this.prevTargetRateKbps *
                        (100 - VideoPriorityBasedPolicy.LARGE_RATE_CHANGE_TRIGGER_PERCENT)) /
                        100 ||
                this.downlinkStats.bandwidthEstimateKbps <
                    (this.downlinkStats.usedBandwidthKbps *
                        VideoPriorityBasedPolicy.LARGE_RATE_CHANGE_TRIGGER_PERCENT) /
                        100) &&
            this.downlinkStats.packetsLost === 0) {
            // Set target to be the same as last
            this.logger.debug(() => {
                return 'bwe: ValidateRate: Using Previous rate ' + this.prevTargetRateKbps;
            });
            this.usingPrevTargetRate = true;
            targetBitrate = this.prevTargetRateKbps;
        }
        else {
            this.usingPrevTargetRate = false;
        }
        return targetBitrate;
    }
    setProbeState(newState) {
        if (this.rateProbeState === newState) {
            return false;
        }
        const now = Date.now();
        switch (newState) {
            case "Not Probing" /* NotProbing */:
                this.probePendingStartTimestamp = 0;
                break;
            case "Probe Pending" /* ProbePending */:
                if (this.lastProbeTimestamp === 0 ||
                    now - this.lastProbeTimestamp > VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS) {
                    this.probePendingStartTimestamp = now;
                }
                else {
                    // Too soon to do a probe again
                    return false;
                }
                break;
            case "Probing" /* Probing */:
                if (now - this.probePendingStartTimestamp > this.timeBeforeAllowProbeMs) {
                    this.lastProbeTimestamp = now;
                    this.preProbeReceiveStreams = this.subscribedReceiveStreams.slice();
                    this.preProbeNonPausedReceiveStreams = this.optimalNonPausedReceiveStreams;
                    // Increase the time allowed until the next probe
                    this.timeBeforeAllowProbeMs = Math.min(this.timeBeforeAllowProbeMs * 2, VideoPriorityBasedPolicy.MAX_HOLD_BEFORE_PROBE_MS);
                }
                else {
                    // Too soon to do probe
                    return false;
                }
                break;
        }
        this.logger.info('bwe: setProbeState to ' + newState + ' from ' + this.rateProbeState);
        this.rateProbeState = newState;
        return true;
    }
    // Upgrade the stream id from the appropriate group or add it if it wasn't already in the list.
    // Return the added amount of bandwidth
    upgradeToStream(chosenStreams, upgradeStream) {
        for (let i = 0; i < chosenStreams.length; i++) {
            if (chosenStreams[i].groupId === upgradeStream.groupId) {
                const diffRate = upgradeStream.avgBitrateKbps - chosenStreams[i].avgBitrateKbps;
                this.logger.info('bwe: upgradeStream from ' + JSON.stringify(chosenStreams[i]) + ' to ' + upgradeStream);
                this.lastUpgradeRateKbps = diffRate;
                chosenStreams[i] = upgradeStream;
                return diffRate;
            }
        }
        // We are adding a stream and not upgrading.
        chosenStreams.push(upgradeStream);
        this.lastUpgradeRateKbps = upgradeStream.avgBitrateKbps;
        return this.lastUpgradeRateKbps;
    }
    // Do specific behavior while we are currently in probing state and metrics
    // indicate environment is still valid to do probing.
    // Return true if the caller should not change from the previous subscriptions.
    handleProbe(chosenStreams, targetDownlinkBitrate) {
        // Don't allow probe to happen indefinitely
        if (Date.now() - this.lastProbeTimestamp > VideoPriorityBasedPolicy.MAX_ALLOWED_PROBE_TIME_MS) {
            this.logger.info(`bwe: Canceling probe due to timeout`);
            this.setProbeState("Not Probing" /* NotProbing */);
            return 0 /* NewOptimal */;
        }
        if (this.downlinkStats.packetsLost > 0) {
            this.setProbeState("Not Probing" /* NotProbing */);
            this.logger.info(`bwe: Canceling probe due to network loss`);
            this.probeFailed = true;
            this.timeBeforeAllowSubscribeMs =
                Math.max(VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS, this.timeBeforeAllowSubscribeMs) * 3;
            // packet lost indicates bad network and thus slowing down subscribing by extend delay by 3 times
            return 2 /* PreProbe */;
        }
        const subscribedRate = this.calculateSubscribeRate(this.optimalReceiveStreams);
        if (this.chosenStreamsSameAsLast(chosenStreams) || targetDownlinkBitrate > subscribedRate) {
            let avgRate = 0;
            for (const chosenStream of chosenStreams) {
                avgRate += chosenStream.avgBitrateKbps;
            }
            if (targetDownlinkBitrate > avgRate) {
                this.logger.info(`bwe: Probe successful`);
                // If target bitrate can sustain probe rate, then probe was successful.
                this.setProbeState("Not Probing" /* NotProbing */);
                // Reset the time allowed between probes since this was successful
                this.timeBeforeAllowProbeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS;
                return 0 /* NewOptimal */;
            }
        }
        return 1 /* PreviousOptimal */;
    }
    maybeOverrideOrProbe(chosenStreams, rates, upgradeStream) {
        const sameSubscriptions = this.chosenStreamsSameAsLast(chosenStreams);
        let useLastSubscriptions = 0 /* NewOptimal */;
        // We want to minimize thrashing between between low res and high res of different
        // participants due to avg bitrate fluctuations. If there hasn't been much of a change in estimated bandwidth
        // and the number of streams and their max rates are the same, then reuse the previous subscription
        const triggerPercent = rates.targetDownlinkBitrate > VideoPriorityBasedPolicy.LOW_BITRATE_THRESHOLD_KBPS
            ? VideoPriorityBasedPolicy.TARGET_RATE_CHANGE_TRIGGER_PERCENT
            : VideoPriorityBasedPolicy.TARGET_RATE_CHANGE_TRIGGER_PERCENT * 2;
        const minTargetBitrateDelta = (rates.targetDownlinkBitrate * triggerPercent) / 100;
        if (!sameSubscriptions &&
            Math.abs(rates.targetDownlinkBitrate - this.prevTargetRateKbps) < minTargetBitrateDelta) {
            this.logger.info('bwe: MaybeOverrideOrProbe: Reuse last decision based on delta rate. {' +
                JSON.stringify(this.subscribedReceiveSet) +
                `}`);
            useLastSubscriptions = 1 /* PreviousOptimal */;
        }
        // If there has been packet loss, then reset to no probing state
        if (this.downlinkStats.packetsLost > this.prevDownlinkStats.packetsLost) {
            this.setProbeState("Not Probing" /* NotProbing */);
            this.lastUpgradeRateKbps = 0;
            return useLastSubscriptions;
        }
        if (sameSubscriptions || useLastSubscriptions === 1 /* PreviousOptimal */) {
            // If planned subscriptions are same as last, then either move to probe pending state
            // or move to probing state if enough time has passed.
            switch (this.rateProbeState) {
                case "Not Probing" /* NotProbing */:
                    this.setProbeState("Probe Pending" /* ProbePending */);
                    break;
                case "Probe Pending" /* ProbePending */:
                    if (this.setProbeState("Probing" /* Probing */)) {
                        this.upgradeToStream(chosenStreams, upgradeStream);
                        useLastSubscriptions = 0 /* NewOptimal */;
                    }
                    break;
            }
        }
        else {
            this.setProbeState("Not Probing" /* NotProbing */);
        }
        return useLastSubscriptions;
    }
    // Utility function to find max rate of streams in current decision
    calculateSubscribeRate(streams) {
        let subscribeRate = 0;
        for (const stream of streams) {
            if (!this.pausedStreamIds.contain(stream.streamId) &&
                !this.pausedBwAttendeeIds.has(stream.attendeeId)) {
                subscribeRate += stream.maxBitrateKbps;
            }
        }
        return subscribeRate;
    }
    handleAppPausedStreams(chosenStreams, remoteInfos) {
        if (!this.tileController) {
            this.logger.warn('tileController not found!');
            return;
        }
        this.pausedStreamIds = new DefaultVideoStreamIdSet_1.default();
        const remoteTiles = this.tileController.getAllRemoteVideoTiles();
        for (const tile of remoteTiles) {
            const state = tile.state();
            if (state.paused && !this.pausedBwAttendeeIds.has(state.boundAttendeeId)) {
                let j = remoteInfos.length;
                while (j--) {
                    if (remoteInfos[j].attendeeId === state.boundAttendeeId) {
                        this.logger.info('bwe: removed paused attendee ' +
                            state.boundAttendeeId +
                            ' streamId: ' +
                            remoteInfos[j].streamId);
                        this.pausedStreamIds.add(remoteInfos[j].streamId);
                        // Add the stream to the selection set to keep the tile around
                        if (this.subscribedReceiveSet.contain(remoteInfos[j].streamId)) {
                            chosenStreams.push(remoteInfos[j]);
                        }
                        remoteInfos.splice(j, 1);
                    }
                }
            }
        }
    }
    processBwPausedStreams(remoteInfos, chosenStreams) {
        if (!this.tileController) {
            this.logger.warn('tileController not found!');
            return;
        }
        const preferences = this.getCurrentVideoPreferences();
        if (preferences && this.shouldPauseTiles) {
            const videoTiles = this.tileController.getAllVideoTiles();
            for (const preference of preferences) {
                const videoTile = this.getVideoTileForAttendeeId(preference.attendeeId, videoTiles);
                const paused = (videoTile === null || videoTile === void 0 ? void 0 : videoTile.state().paused) || false;
                if (!chosenStreams.some(stream => stream.attendeeId === preference.attendeeId)) {
                    // We cannot rely on the existance of video tile to indicate that the source exists in the call
                    // because tiles will not be added or removed until after a full renegotiation (i.e. it will
                    // be behind the state provided by the index)
                    const streamExists = remoteInfos.some(stream => stream.attendeeId === preference.attendeeId);
                    if (videoTile && streamExists) {
                        const info = this.optimalReceiveStreams.find(stream => stream.attendeeId === preference.attendeeId);
                        if (info !== undefined) {
                            if (!paused) {
                                this.logger.info(`bwe: pausing streamId ${info.streamId} attendee ${preference.attendeeId} due to bandwidth`);
                                this.forEachObserver(observer => {
                                    observer.tileWillBePausedByDownlinkPolicy(videoTile.id());
                                });
                                this.tileController.pauseVideoTile(videoTile.id());
                            }
                            chosenStreams.push(info);
                        }
                        this.pausedBwAttendeeIds.add(preference.attendeeId);
                    }
                    else if (streamExists) {
                        // Create a tile for this participant if one doesn't already exist and mark it as paused
                        // Don't include it in the chosen streams because we don't want to subscribe for it then have to pause it.
                        const newTile = this.tileController.addVideoTile();
                        newTile.bindVideoStream(preference.attendeeId, false, null, 0, 0, 0, null);
                        this.forEachObserver(observer => {
                            observer.tileWillBePausedByDownlinkPolicy(newTile.id());
                        });
                        newTile.pause();
                        this.logger.info(`bwe: Created video tile ${newTile.id()} for bw paused attendee ${preference.attendeeId}`);
                        this.pausedBwAttendeeIds.add(preference.attendeeId);
                    }
                }
                else if (paused && this.pausedBwAttendeeIds.has(preference.attendeeId)) {
                    this.logger.info(`bwe: unpausing attendee ${preference.attendeeId} due to bandwidth`);
                    this.forEachObserver(observer => {
                        observer.tileWillBeUnpausedByDownlinkPolicy(videoTile.id());
                    });
                    this.tileController.unpauseVideoTile(videoTile.id());
                    this.pausedBwAttendeeIds.delete(preference.attendeeId);
                }
            }
        }
    }
    cleanBwPausedTiles(remoteInfos) {
        if (!this.tileController) {
            this.logger.warn('tileController not found!');
            return;
        }
        const tiles = this.tileController.getAllRemoteVideoTiles();
        const preferences = this.getCurrentVideoPreferences();
        for (const tile of tiles) {
            const state = tile.state();
            if (!state.boundVideoStream) {
                if (!remoteInfos.some(stream => stream.attendeeId === state.boundAttendeeId)) {
                    this.tileController.removeVideoTile(state.tileId);
                    this.logger.info(`bwe: Removed video tile ${state.tileId} for bw paused attendee ${state.boundAttendeeId}`);
                }
                else if (preferences !== undefined &&
                    !preferences.some(pref => pref.attendeeId === state.boundAttendeeId)) {
                    this.tileController.removeVideoTile(state.tileId);
                }
            }
        }
    }
    priorityPolicy(rates, remoteInfos, chosenStreams) {
        let upgradeStream;
        const videoPreferences = this.getCurrentVideoPreferences();
        const highestPriority = videoPreferences.highestPriority();
        let nextPriority;
        let priority = highestPriority;
        while (priority !== -1) {
            nextPriority = -1;
            for (const preference of videoPreferences) {
                if (preference.priority === priority) {
                    // First subscribe to at least low rate
                    for (const info of remoteInfos) {
                        if (info.attendeeId === preference.attendeeId) {
                            if (!chosenStreams.some(stream => stream.groupId === info.groupId)) {
                                if (rates.chosenTotalBitrate + info.avgBitrateKbps <= rates.targetDownlinkBitrate) {
                                    chosenStreams.push(info);
                                    rates.chosenTotalBitrate += info.avgBitrateKbps;
                                }
                                else if (rates.deltaToNextUpgrade === 0) {
                                    // Keep track of step to next upgrade
                                    rates.deltaToNextUpgrade = info.avgBitrateKbps;
                                    upgradeStream = info;
                                }
                            }
                        }
                    }
                }
                else {
                    if (preference.priority > priority) {
                        nextPriority = preference.priority;
                        break;
                    }
                }
            }
            // Now try to upgrade all attendee's with this priority
            for (const preference of videoPreferences) {
                if (preference.priority === priority) {
                    for (const info of remoteInfos) {
                        if (info.attendeeId === preference.attendeeId) {
                            const index = chosenStreams.findIndex(stream => stream.groupId === info.groupId && stream.maxBitrateKbps < info.maxBitrateKbps);
                            if (index !== -1) {
                                const increaseKbps = info.avgBitrateKbps - chosenStreams[index].avgBitrateKbps;
                                if (this.hasSimulcastStreams(remoteInfos, info.attendeeId, info.groupId) &&
                                    this.canUpgrade(info.avgBitrateKbps, preference.targetSizeToBitrateKbps(preference.targetSize))) {
                                    this.logger.info(`bwe: attendee: ${info.attendeeId} group: ${info.groupId} has simulcast and can upgrade avgBitrate: ${info.avgBitrateKbps} target: ${preference.targetSizeToBitrateKbps(preference.targetSize)} targetTotalBitrate: ${rates.targetDownlinkBitrate}`);
                                    if (rates.chosenTotalBitrate + increaseKbps <= rates.targetDownlinkBitrate) {
                                        rates.chosenTotalBitrate += increaseKbps;
                                        chosenStreams[index] = info;
                                    }
                                    else if (rates.deltaToNextUpgrade === 0) {
                                        // Keep track of step to next upgrade
                                        rates.deltaToNextUpgrade = increaseKbps;
                                        upgradeStream = info;
                                    }
                                }
                                else {
                                    this.logger.info('bwe: cannot upgrade stream quality beyond target size');
                                }
                            }
                        }
                    }
                }
                else {
                    if (preference.priority > priority) {
                        break;
                    }
                }
            }
            // If we haven't subscribed to the highest rate of the top priority videos then
            // do not subscribe to any other sources
            if (priority === highestPriority && rates.deltaToNextUpgrade !== 0) {
                break;
            }
            priority = nextPriority;
        }
        return upgradeStream;
    }
    getVideoTileForAttendeeId(attendeeId, videoTiles) {
        for (const tile of videoTiles) {
            const state = tile.state();
            if (state.boundAttendeeId === attendeeId) {
                return tile;
            }
        }
        return null;
    }
    canUpgrade(bitrateKbp, targetBitrateKbp) {
        if (bitrateKbp <= targetBitrateKbp) {
            this.logger.info(`bwe: canUpgrade: bitrateKbp: ${bitrateKbp} targetBitrateKbp: ${targetBitrateKbp}`);
            return true;
        }
        this.logger.info(`bwe: cannot Upgrade: bitrateKbp: ${bitrateKbp} targetBitrateKbp: ${targetBitrateKbp}`);
        return false;
    }
    hasSimulcastStreams(remoteInfos, attendeeId, groupId) {
        let streamCount = 0;
        for (const info of remoteInfos) {
            if (info.attendeeId === attendeeId && info.groupId === groupId) {
                streamCount++;
            }
        }
        this.logger.info(`bwe: attendeeId: ${attendeeId} groupId: ${groupId} hasSimulcastStreams: streamCount: ${streamCount}`);
        return streamCount > 1;
    }
    availStreamsSameAsLast(remoteInfos) {
        if (this.prevRemoteInfos === undefined ||
            remoteInfos.length !== this.prevRemoteInfos.length ||
            this.videoPreferencesUpdated === true) {
            return false;
        }
        for (const info of remoteInfos) {
            const infoMatch = this.prevRemoteInfos.find(prevInfo => prevInfo.groupId === info.groupId &&
                prevInfo.streamId === info.streamId &&
                prevInfo.maxBitrateKbps === info.maxBitrateKbps);
            if (infoMatch === undefined) {
                return false;
            }
        }
        return true;
    }
    chosenStreamsSameAsLast(chosenStreams) {
        if (this.optimalNonPausedReceiveStreams.length !== chosenStreams.length) {
            return false;
        }
        for (const lastStream of this.optimalNonPausedReceiveStreams) {
            if (!chosenStreams.some(stream => stream.streamId === lastStream.streamId)) {
                return false;
            }
        }
        return true;
    }
    policyStateLogStr(remoteInfos, targetDownlinkBitrate) {
        const subscribedRate = this.calculateSubscribeRate(this.optimalReceiveStreams);
        const optimalReceiveSet = {
            targetBitrate: targetDownlinkBitrate,
            subscribedRate: subscribedRate,
            probeState: this.rateProbeState,
            startupPeriod: this.startupPeriod,
        };
        // Reduced remote info logging:
        let remoteInfoStr = `remoteInfos: [`;
        for (const info of remoteInfos) {
            remoteInfoStr += `{grpId:${info.groupId} strId:${info.streamId} maxBr:${info.maxBitrateKbps} avgBr:${info.avgBitrateKbps}}, `;
        }
        remoteInfoStr += `]`;
        let logString = `bwe: optimalReceiveSet ${JSON.stringify(optimalReceiveSet)}\n` +
            `bwe:   prev ${JSON.stringify(this.prevDownlinkStats)}\n` +
            `bwe:   now  ${JSON.stringify(this.downlinkStats)}\n` +
            `bwe:   ${remoteInfoStr}\n`;
        if (this.pausedStreamIds.size() > 0 || this.pausedBwAttendeeIds.size > 0) {
            logString += `bwe:   paused: app stream ids ${JSON.stringify(this.pausedStreamIds)}  bw attendees { ${Array.from(this.pausedBwAttendeeIds).join(' ')} }\n`;
        }
        if (this.videoPreferences) {
            logString += `bwe:   preferences: ${JSON.stringify(this.videoPreferences)}`;
        }
        else {
            logString += `bwe:   default preferences: ${JSON.stringify(this.defaultVideoPreferences)}`;
        }
        return logString;
    }
    getCurrentVideoPreferences() {
        return this.videoPreferences || this.defaultVideoPreferences;
    }
}
exports.default = VideoPriorityBasedPolicy;
VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS = 2800;
VideoPriorityBasedPolicy.STARTUP_PERIOD_MS = 6000;
VideoPriorityBasedPolicy.LARGE_RATE_CHANGE_TRIGGER_PERCENT = 20;
VideoPriorityBasedPolicy.TARGET_RATE_CHANGE_TRIGGER_PERCENT = 15;
VideoPriorityBasedPolicy.LOW_BITRATE_THRESHOLD_KBPS = 300;
VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS = 5000;
VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS = 2000;
VideoPriorityBasedPolicy.MAX_HOLD_BEFORE_PROBE_MS = 60000;
VideoPriorityBasedPolicy.MAX_ALLOWED_PROBE_TIME_MS = 60000;
VideoPriorityBasedPolicy.MINIMUM_DELAY = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS;
VideoPriorityBasedPolicy.MAXIMUM_DELAY = 8000;
//# sourceMappingURL=VideoPriorityBasedPolicy.js.map