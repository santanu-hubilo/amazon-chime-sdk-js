"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class DefaultTransceiverController {
    constructor(logger, browserBehavior) {
        this.logger = logger;
        this.browserBehavior = browserBehavior;
        this._localCameraTransceiver = null;
        this._localAudioTransceiver = null;
        this.videoSubscriptions = [];
        this.defaultMediaStream = null;
        this.peer = null;
        this.streamIdToTransceiver = new Map();
    }
    setEncodingParameters(encodingParamMap) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv') {
                return;
            }
            const sender = this._localCameraTransceiver.sender;
            if (!encodingParamMap || encodingParamMap.size === 0) {
                return;
            }
            const newEncodingParams = Array.from(encodingParamMap.values());
            const oldParam = sender.getParameters();
            if (!oldParam.encodings || oldParam.encodings.length === 0) {
                oldParam.encodings = newEncodingParams;
            }
            else {
                for (const existing of oldParam.encodings) {
                    for (const changed of newEncodingParams) {
                        if ((existing.rid || changed.rid) && existing.rid !== changed.rid) {
                            continue;
                        }
                        let key;
                        for (key in changed) {
                            // These properties can't be changed.
                            if (key === 'rid' || key === 'codecPayloadType') {
                                continue;
                            }
                            /* istanbul ignore else */
                            if (changed.hasOwnProperty(key)) {
                                existing[key] = changed[key];
                            }
                        }
                    }
                }
            }
            yield sender.setParameters(oldParam);
        });
    }
    static setVideoSendingBitrateKbpsForSender(sender, bitrateKbps, _logger) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!sender || bitrateKbps <= 0) {
                return;
            }
            const param = sender.getParameters();
            if (!param.encodings) {
                param.encodings = [{}];
            }
            for (const encodeParam of param.encodings) {
                encodeParam.maxBitrate = bitrateKbps * 1000;
            }
            yield sender.setParameters(param);
        });
    }
    static replaceAudioTrackForSender(sender, track) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!sender) {
                return false;
            }
            yield sender.replaceTrack(track);
            return true;
        });
    }
    localAudioTransceiver() {
        return this._localAudioTransceiver;
    }
    localVideoTransceiver() {
        return this._localCameraTransceiver;
    }
    setVideoSendingBitrateKbps(bitrateKbps) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv') {
                return;
            }
            const sender = this._localCameraTransceiver.sender;
            yield DefaultTransceiverController.setVideoSendingBitrateKbpsForSender(sender, bitrateKbps, this.logger);
        });
    }
    setPeer(peer) {
        this.peer = peer;
    }
    reset() {
        this._localCameraTransceiver = null;
        this._localAudioTransceiver = null;
        this.videoSubscriptions = [];
        this.defaultMediaStream = null;
        this.peer = null;
    }
    useTransceivers() {
        if (!this.peer || !this.browserBehavior.requiresUnifiedPlan()) {
            return false;
        }
        return typeof this.peer.getTransceivers !== 'undefined';
    }
    hasVideoInput() {
        if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv')
            return false;
        return true;
    }
    trackIsVideoInput(track) {
        if (!this._localCameraTransceiver) {
            return false;
        }
        return (track === this._localCameraTransceiver.sender.track ||
            track === this._localCameraTransceiver.receiver.track);
    }
    setupLocalTransceivers() {
        if (!this.useTransceivers()) {
            return;
        }
        if (!this.defaultMediaStream && typeof MediaStream !== 'undefined') {
            this.defaultMediaStream = new MediaStream();
        }
        if (!this._localAudioTransceiver) {
            this._localAudioTransceiver = this.peer.addTransceiver('audio', {
                direction: 'inactive',
                streams: [this.defaultMediaStream],
            });
        }
        if (!this._localCameraTransceiver) {
            this._localCameraTransceiver = this.peer.addTransceiver('video', {
                direction: 'inactive',
                streams: [this.defaultMediaStream],
            });
        }
    }
    replaceAudioTrack(track) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._localAudioTransceiver || this._localAudioTransceiver.direction !== 'sendrecv') {
                this.logger.info(`audio transceiver direction is not set up or not activated`);
                return false;
            }
            yield this._localAudioTransceiver.sender.replaceTrack(track);
            return true;
        });
    }
    setAudioInput(track) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setTransceiverInput(this._localAudioTransceiver, track);
            return;
        });
    }
    setVideoInput(track) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setTransceiverInput(this._localCameraTransceiver, track);
            return;
        });
    }
    updateVideoTransceivers(videoStreamIndex, videosToReceive) {
        if (!this.useTransceivers()) {
            return videosToReceive.array();
        }
        // See https://blog.mozilla.org/webrtc/rtcrtptransceiver-explored/ for details on transceivers
        const transceivers = this.peer.getTransceivers();
        // Subscription index 0 is reserved for transmitting camera.
        // We mark inactive slots with 0 in the subscription array.
        this.videoSubscriptions = [0];
        videosToReceive = videosToReceive.clone();
        this.updateTransceivers(transceivers, videoStreamIndex, videosToReceive);
        this.logger.debug(() => {
            return this.debugDumpTransceivers();
        });
        return this.videoSubscriptions;
    }
    updateTransceivers(transceivers, videoStreamIndex, videosToReceive) {
        const videosRemaining = videosToReceive.array();
        if (transceivers.length !== 0 && !transceivers[0].stop) {
            // This function and its usage can be removed once we raise Chrome browser requirements
            // to M88 (when `RTCRtpTransceiver.stop` was added)
            this.logger.info('Updating transceivers without `stop` function');
            this.updateTransceiverWithoutStop(transceivers, videoStreamIndex, videosRemaining);
        }
        else if (transceivers.length !== 0) {
            this.updateTransceiverWithStop(transceivers, videoStreamIndex, videosRemaining);
        }
        // Add transceivers for the remaining subscriptions
        for (const index of videosRemaining) {
            // @ts-ignore
            const transceiver = this.peer.addTransceiver('video', {
                direction: 'recvonly',
                streams: [new MediaStream()],
            });
            this.streamIdToTransceiver.set(index, transceiver);
            this.videoSubscriptions.push(index);
            this.logger.info(`adding transceiver mid: ${transceiver.mid} subscription: ${index} direction: recvonly`);
        }
        this.logger.info(`returning direction: blah ${this.videoSubscriptions}`);
    }
    updateTransceiverWithStop(transceivers, videoStreamIndex, videosRemaining) {
        // Begin counting out index in the the subscription array at 1 since the camera.
        // Always occupies position 0 (whether active or not).
        let n = 1;
        // Reset since otherwise there will be stale indexes corresponding to
        // stopped transceivers.
        this.videoSubscriptions = [0];
        for (const transceiver of transceivers) {
            if (transceiver === this._localCameraTransceiver ||
                !this.transceiverIsVideo(transceiver) ||
                !transceiver.mid) {
                continue;
            }
            let reusingTranceiver = false;
            // See if we want this existing transceiver for a simulcast stream switch
            //
            // By convention with the service backend, msid is equal to the media section mid, prefixed with the string "v_";
            // we use this to get the stream ID for the track
            const streamId = videoStreamIndex.streamIdForTrack('v_' + transceiver.mid);
            if (transceiver.direction !== 'inactive' && streamId !== undefined) {
                for (const [index, recvStreamId] of videosRemaining.entries()) {
                    // `streamId` may still be the same as `recvStreamId`
                    if (videoStreamIndex.StreamIdsInSameGroup(streamId, recvStreamId)) {
                        transceiver.direction = 'recvonly';
                        this.videoSubscriptions[n] = recvStreamId;
                        reusingTranceiver = true;
                        this.streamIdToTransceiver.delete(streamId);
                        this.streamIdToTransceiver.set(recvStreamId, transceiver);
                        videosRemaining.splice(index, 1);
                        break;
                    }
                }
            }
            if (!reusingTranceiver) {
                this.videoSubscriptions[n] = 0;
                this.logger.info(`Stopping MID: ${transceiver.mid}, direction: ${transceiver.direction}, current direction: ${transceiver.currentDirection}`);
                // Clean up transceiver and mappings for streams that have been unsubscribed from.  Note we do not try to reuse
                // old inactive transceivers for new streams as Firefox will reuse the last frame from
                // that transceiver, and additionally we simply don't want to risk wiring up a transceiver
                // to the incorrect video stream for no real benefit besides possible a smaller SDP size.
                transceiver.stop(); // Note (as of Firefox 94): Firefox will keep these around forever
                for (const [streamId, previousTransceiver] of this.streamIdToTransceiver.entries()) {
                    if (transceiver.mid === previousTransceiver.mid) {
                        this.streamIdToTransceiver.delete(streamId);
                    }
                }
            }
            n += 1;
        }
    }
    // This function operates similarily to `updateTransceiverWithStop` with the following changes to account
    // for the fact RTCRtpTransceiver.stop is not available on all supported browsers:
    //  * We attempt to reuse inactive transceivers because libwebrtc will not remove them otherwise and
    //    the SDP will grow endlessly.
    //  * We mark unsubscribed transceivers as 'inactive' so that they can be reused. This requires using a
    //    second for loop.
    updateTransceiverWithoutStop(transceivers, videoStreamIndex, videosRemaining) {
        let n = 1;
        for (const transceiver of transceivers) {
            if (transceiver === this._localCameraTransceiver || !this.transceiverIsVideo(transceiver)) {
                continue;
            }
            this.videoSubscriptions[n] = 0;
            if (transceiver.direction !== 'inactive') {
                const streamId = videoStreamIndex.streamIdForTrack('v_' + transceiver.mid);
                if (streamId !== undefined) {
                    for (const [index, recvStreamId] of videosRemaining.entries()) {
                        if (videoStreamIndex.StreamIdsInSameGroup(streamId, recvStreamId)) {
                            transceiver.direction = 'recvonly';
                            this.videoSubscriptions[n] = recvStreamId;
                            this.streamIdToTransceiver.delete(streamId);
                            this.streamIdToTransceiver.set(recvStreamId, transceiver);
                            videosRemaining.splice(index, 1);
                            break;
                        }
                    }
                }
            }
            n += 1;
        }
        // Next fill in open slots and remove unused
        n = 1;
        for (const transceiver of transceivers) {
            if (transceiver === this._localCameraTransceiver || !this.transceiverIsVideo(transceiver)) {
                continue;
            }
            if (transceiver.direction === 'inactive' && videosRemaining.length > 0) {
                // Fill available slot
                transceiver.direction = 'recvonly';
                const streamId = videosRemaining.shift();
                this.videoSubscriptions[n] = streamId;
                this.streamIdToTransceiver.set(streamId, transceiver);
            }
            else {
                // Remove if no longer subscribed
                if (this.videoSubscriptions[n] === 0) {
                    transceiver.direction = 'inactive';
                    for (const [streamId, previousTransceiver] of this.streamIdToTransceiver.entries()) {
                        if (transceiver === previousTransceiver) {
                            this.streamIdToTransceiver.delete(streamId);
                        }
                    }
                }
            }
            n += 1;
        }
    }
    getMidForStreamId(streamId) {
        var _a;
        return (_a = this.streamIdToTransceiver.get(streamId)) === null || _a === void 0 ? void 0 : _a.mid;
    }
    setStreamIdForMid(mid, newStreamId) {
        for (const [streamId, transceiver] of this.streamIdToTransceiver.entries()) {
            if (transceiver.mid === mid) {
                this.streamIdToTransceiver.delete(streamId);
                this.streamIdToTransceiver.set(newStreamId, transceiver);
                return;
            }
        }
    }
    transceiverIsVideo(transceiver) {
        return ((transceiver.receiver &&
            transceiver.receiver.track &&
            transceiver.receiver.track.kind === 'video') ||
            (transceiver.sender && transceiver.sender.track && transceiver.sender.track.kind === 'video'));
    }
    debugDumpTransceivers() {
        let msg = '';
        let n = 0;
        for (const transceiver of this.peer.getTransceivers()) {
            if (!this.transceiverIsVideo(transceiver)) {
                continue;
            }
            msg += `transceiver index=${n} mid=${transceiver.mid} subscription=${this.videoSubscriptions[n]} direction=${transceiver.direction}\n`;
            n += 1;
        }
        return msg;
    }
    setTransceiverInput(transceiver, track) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!transceiver) {
                return;
            }
            if (track) {
                transceiver.direction = 'sendrecv';
            }
            else {
                transceiver.direction = 'inactive';
            }
            yield transceiver.sender.replaceTrack(track);
        });
    }
}
exports.default = DefaultTransceiverController;
//# sourceMappingURL=DefaultTransceiverController.js.map