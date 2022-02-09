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
const MeetingSessionStatus_1 = require("../meetingsession/MeetingSessionStatus");
const MeetingSessionStatusCode_1 = require("../meetingsession/MeetingSessionStatusCode");
const DefaultSDP_1 = require("../sdp/DefaultSDP");
const SignalingClientEventType_1 = require("../signalingclient/SignalingClientEventType");
const SignalingClientSubscribe_1 = require("../signalingclient/SignalingClientSubscribe");
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const BaseTask_1 = require("./BaseTask");
/**
 * [[SubscribeAndReceiveSubscribeAckTask]] sends a subscribe frame with the given settings
 * and receives SdkSubscribeAckFrame.
 */
class SubscribeAndReceiveSubscribeAckTask extends BaseTask_1.default {
    constructor(context) {
        super(context.logger);
        this.context = context;
        this.taskName = 'SubscribeAndReceiveSubscribeAckTask';
        this.taskCanceler = null;
    }
    cancel() {
        if (this.taskCanceler) {
            this.taskCanceler.cancel();
            this.taskCanceler = null;
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let localSdp = '';
            if (this.context.peer && this.context.peer.localDescription) {
                if (this.context.browserBehavior.requiresUnifiedPlanMunging()) {
                    localSdp = new DefaultSDP_1.default(this.context.peer.localDescription.sdp).withUnifiedPlanFormat()
                        .sdp;
                }
                else {
                    localSdp = this.context.peer.localDescription.sdp;
                }
            }
            if (!this.context.enableSimulcast) {
                // backward compatibility
                let frameRate = 0;
                let maxEncodeBitrateKbps = 0;
                if (this.context.videoCaptureAndEncodeParameter) {
                    frameRate = this.context.videoCaptureAndEncodeParameter.captureFrameRate();
                    maxEncodeBitrateKbps = this.context.videoCaptureAndEncodeParameter.encodeBitrates()[0];
                }
                const param = {
                    rid: 'hi',
                    maxBitrate: maxEncodeBitrateKbps * 1000,
                    maxFramerate: frameRate,
                    active: true,
                };
                this.context.videoStreamIndex.integrateUplinkPolicyDecision([param]);
            }
            this.context.videoStreamIndex.subscribeFrameSent();
            // See comment above `fixUpSubscriptionOrder`
            const videoSubscriptions = this.context.browserBehavior.requiresUnifiedPlan()
                ? this.fixUpSubscriptionOrder(localSdp, this.context.videoSubscriptions)
                : this.context.videoSubscriptions;
            const isSendingStreams = this.context.videoDuplexMode === SignalingProtocol_js_1.SdkStreamServiceType.TX ||
                this.context.videoDuplexMode === SignalingProtocol_js_1.SdkStreamServiceType.DUPLEX;
            this.context.previousSdpOffer = new DefaultSDP_1.default(localSdp);
            const subscribe = new SignalingClientSubscribe_1.default(this.context.meetingSessionConfiguration.credentials.attendeeId, localSdp, this.context.meetingSessionConfiguration.urls.audioHostURL, this.context.realtimeController.realtimeIsLocalAudioMuted(), false, videoSubscriptions, isSendingStreams, this.context.videoStreamIndex.localStreamDescriptions(), 
            // TODO: handle check-in mode, or remove this param
            true);
            this.context.logger.info(`sending subscribe: ${JSON.stringify(subscribe)}`);
            this.context.signalingClient.subscribe(subscribe);
            const subscribeAckFrame = yield this.receiveSubscribeAck();
            this.context.logger.info(`got subscribe ack: ${JSON.stringify(subscribeAckFrame)}`);
            this.context.sdpAnswer = subscribeAckFrame.sdpAnswer;
            this.context.videoStreamIndex.integrateSubscribeAckFrame(subscribeAckFrame);
        });
    }
    // Our backends currently expect the video subscriptions passed in subscribe to precisely
    // line up with the media sections, with a zero for any video send or inactive section.
    //
    // Firefox occasionally tosses stopped transceivers at the end of the SDP without reason
    // and in general we don't want to be at the mercy of SDP sections not being in the same
    // order as `getTransceivers`, so we simply recalculate the array here to enforce that
    // expected invarient.
    fixUpSubscriptionOrder(sdp, videoSubscriptions) {
        const subscriptionsWithoutZero = videoSubscriptions.filter((value) => value !== 0);
        let subscriptionsWithoutZeroIndex = 0;
        const directions = new DefaultSDP_1.default(sdp).videoSectionDirections();
        const newSubscriptions = [];
        for (const direction of directions) {
            if (direction === 'recvonly') {
                if (subscriptionsWithoutZeroIndex >= subscriptionsWithoutZero.length) {
                    this.context.logger.warn(`More receive sections (>${subscriptionsWithoutZeroIndex}) then subscriptions (${subscriptionsWithoutZero.length})`);
                    newSubscriptions.push(0);
                    continue;
                }
                newSubscriptions.push(subscriptionsWithoutZero[subscriptionsWithoutZeroIndex]);
                subscriptionsWithoutZeroIndex += 1;
            }
            else {
                newSubscriptions.push(0);
            }
        }
        this.context.logger.info(`Fixed up ${JSON.stringify(videoSubscriptions)} to ${JSON.stringify(newSubscriptions)} (may be same))}`);
        return newSubscriptions;
    }
    receiveSubscribeAck() {
        return new Promise((resolve, reject) => {
            const context = this.context;
            class Interceptor {
                constructor(signalingClient) {
                    this.signalingClient = signalingClient;
                }
                cancel() {
                    this.signalingClient.removeObserver(this);
                    reject(new Error(`SubscribeAndReceiveSubscribeAckTask got canceled while waiting for SdkSubscribeAckFrame`));
                }
                handleSignalingClientEvent(event) {
                    if (event.isConnectionTerminated()) {
                        const message = `SubscribeAndReceiveSubscribeAckTask connection was terminated with code ${event.closeCode} and reason: ${event.closeReason}`;
                        context.logger.warn(message);
                        let statusCode = MeetingSessionStatusCode_1.default.TaskFailed;
                        if (event.closeCode >= 4500 && event.closeCode < 4600) {
                            statusCode = MeetingSessionStatusCode_1.default.SignalingInternalServerError;
                        }
                        context.audioVideoController.handleMeetingSessionStatus(new MeetingSessionStatus_1.default(statusCode), new Error(message));
                        return;
                    }
                    if (event.type !== SignalingClientEventType_1.default.ReceivedSignalFrame ||
                        event.message.type !== SignalingProtocol_js_1.SdkSignalFrame.Type.SUBSCRIBE_ACK) {
                        return;
                    }
                    this.signalingClient.removeObserver(this);
                    // @ts-ignore: force cast to SdkSubscribeAckFrame
                    const subackFrame = event.message.suback;
                    resolve(subackFrame);
                }
            }
            const interceptor = new Interceptor(this.context.signalingClient);
            this.context.signalingClient.registerObserver(interceptor);
            this.taskCanceler = interceptor;
        });
    }
}
exports.default = SubscribeAndReceiveSubscribeAckTask;
//# sourceMappingURL=SubscribeAndReceiveSubscribeAckTask.js.map