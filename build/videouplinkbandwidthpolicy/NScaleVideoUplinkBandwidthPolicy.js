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
const DefaultVideoCaptureAndEncodeParameter_1 = require("../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter");
/** NScaleVideoUplinkBandwidthPolicy implements capture and encode
 *  parameters that are nearly equivalent to those chosen by the
 *  traditional native clients, except for a modification to
 *  maxBandwidthKbps and scaleResolutionDownBy described below. */
class NScaleVideoUplinkBandwidthPolicy {
    constructor(selfAttendeeId, scaleResolution = true, logger = undefined) {
        this.selfAttendeeId = selfAttendeeId;
        this.scaleResolution = scaleResolution;
        this.logger = logger;
        this.numParticipants = 0;
        this.idealMaxBandwidthKbps = 1400;
        this.hasBandwidthPriority = false;
        this.encodingParamMap = new Map();
        this.optimalParameters = new DefaultVideoCaptureAndEncodeParameter_1.default(0, 0, 0, 0, false);
        this.parametersInEffect = new DefaultVideoCaptureAndEncodeParameter_1.default(0, 0, 0, 0, false);
        this.encodingParamMap.set(NScaleVideoUplinkBandwidthPolicy.encodingMapKey, {
            maxBitrate: 0,
        });
    }
    updateConnectionMetric(_metrics) {
        return;
    }
    chooseMediaTrackConstraints() {
        return {};
    }
    chooseEncodingParameters() {
        return new Map();
    }
    updateIndex(videoIndex) {
        let hasLocalVideo = true;
        let scale = 1;
        if (this.transceiverController) {
            hasLocalVideo = this.transceiverController.hasVideoInput();
        }
        // the +1 for self is assuming that we intend to send video, since
        // the context here is VideoUplinkBandwidthPolicy
        this.numParticipants =
            videoIndex.numberOfVideoPublishingParticipantsExcludingSelf(this.selfAttendeeId) +
                (hasLocalVideo ? 1 : 0);
        if (this.transceiverController) {
            const settings = this.getStreamCaptureSetting();
            if (settings) {
                const encodingParams = this.calculateEncodingParameters(settings);
                scale = encodingParams.scaleResolutionDownBy;
            }
        }
        this.optimalParameters = new DefaultVideoCaptureAndEncodeParameter_1.default(this.captureWidth(), this.captureHeight(), this.captureFrameRate(), this.maxBandwidthKbps(), false, scale);
    }
    wantsResubscribe() {
        return !this.parametersInEffect.equal(this.optimalParameters);
    }
    chooseCaptureAndEncodeParameters() {
        this.parametersInEffect = this.optimalParameters.clone();
        return this.parametersInEffect.clone();
    }
    captureWidth() {
        let width = 640;
        if (this.numParticipants > 4) {
            width = 320;
        }
        return width;
    }
    captureHeight() {
        let height = 384;
        if (this.numParticipants > 4) {
            height = 192;
        }
        return height;
    }
    captureFrameRate() {
        return 15;
    }
    maxBandwidthKbps() {
        if (this.hasBandwidthPriority) {
            return Math.trunc(this.idealMaxBandwidthKbps);
        }
        let rate = 0;
        if (this.numParticipants <= 2) {
            rate = this.idealMaxBandwidthKbps;
        }
        else if (this.numParticipants <= 4) {
            rate = (this.idealMaxBandwidthKbps * 2) / 3;
        }
        else {
            rate = ((544 / 11 + 14880 / (11 * this.numParticipants)) / 600) * this.idealMaxBandwidthKbps;
        }
        return Math.trunc(rate);
    }
    setIdealMaxBandwidthKbps(idealMaxBandwidthKbps) {
        this.idealMaxBandwidthKbps = idealMaxBandwidthKbps;
    }
    setHasBandwidthPriority(hasBandwidthPriority) {
        this.hasBandwidthPriority = hasBandwidthPriority;
    }
    setTransceiverController(transceiverController) {
        this.transceiverController = transceiverController;
    }
    updateTransceiverController() {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = this.getStreamCaptureSetting();
            if (!settings) {
                return;
            }
            const encodingParams = this.calculateEncodingParameters(settings);
            if (this.shouldUpdateEndcodingParameters(encodingParams)) {
                this.encodingParamMap.set(NScaleVideoUplinkBandwidthPolicy.encodingMapKey, encodingParams);
                this.transceiverController.setEncodingParameters(this.encodingParamMap);
            }
        });
    }
    shouldUpdateEndcodingParameters(encoding) {
        var _a, _b, _c, _d, _e;
        /* istanbul ignore next: sender, getParameters, and encodings are optional */
        const transceiverEncoding = (_e = (_d = (_c = (_b = (_a = this.transceiverController) === null || _a === void 0 ? void 0 : _a.localVideoTransceiver()) === null || _b === void 0 ? void 0 : _b.sender) === null || _c === void 0 ? void 0 : _c.getParameters()) === null || _d === void 0 ? void 0 : _d.encodings) === null || _e === void 0 ? void 0 : _e[0];
        return (encoding.maxBitrate !== transceiverEncoding.maxBitrate ||
            encoding.scaleResolutionDownBy !== transceiverEncoding.scaleResolutionDownBy);
    }
    calculateEncodingParameters(setting) {
        var _a;
        const maxBitrate = this.maxBandwidthKbps() * 1000;
        let scale = 1;
        if (setting.height !== undefined &&
            setting.width !== undefined &&
            this.scaleResolution &&
            !this.hasBandwidthPriority &&
            this.numParticipants > 2) {
            const targetHeight = NScaleVideoUplinkBandwidthPolicy.targetHeightArray[Math.min(this.numParticipants, NScaleVideoUplinkBandwidthPolicy.targetHeightArray.length - 1)];
            scale = Math.max(Math.min(setting.height, setting.width) / targetHeight, 1);
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(`Resolution scale factor is ${scale} for capture resolution ${setting.width}x${setting.height}. New dimension is ${setting.width / scale}x${setting.height / scale}`);
        }
        return {
            scaleResolutionDownBy: scale,
            maxBitrate: maxBitrate,
        };
    }
    getStreamCaptureSetting() {
        var _a, _b, _c, _d;
        return (_d = (_c = (_b = (_a = this.transceiverController) === null || _a === void 0 ? void 0 : _a.localVideoTransceiver()) === null || _b === void 0 ? void 0 : _b.sender) === null || _c === void 0 ? void 0 : _c.track) === null || _d === void 0 ? void 0 : _d.getSettings();
    }
}
exports.default = NScaleVideoUplinkBandwidthPolicy;
NScaleVideoUplinkBandwidthPolicy.encodingMapKey = 'video';
// 0, 1, 2 have dummy value as we keep the original resolution if we have less than 2 videos.
NScaleVideoUplinkBandwidthPolicy.targetHeightArray = [
    0,
    0,
    0,
    540,
    540,
    480,
    480,
    480,
    480,
    360,
    360,
    360,
    360,
    270,
    270,
    270,
    270,
    180,
    180,
    180,
    180,
    180,
    180,
    180,
    180,
    180,
];
//# sourceMappingURL=NScaleVideoUplinkBandwidthPolicy.js.map