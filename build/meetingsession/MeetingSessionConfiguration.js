"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const ConnectionHealthPolicyConfiguration_1 = require("../connectionhealthpolicy/ConnectionHealthPolicyConfiguration");
const Utils_1 = require("../utils/Utils");
const MeetingSessionCredentials_1 = require("./MeetingSessionCredentials");
const MeetingSessionURLs_1 = require("./MeetingSessionURLs");
/**
 * [[MeetingSessionConfiguration]] contains the information necessary to start
 * a session.
 */
class MeetingSessionConfiguration {
    /**
     * Constructs a MeetingSessionConfiguration optionally with a chime:CreateMeeting and
     * chime:CreateAttendee response. You can pass in either a JSON object containing the
     * responses, or a JSON object containing the information in the Meeting and Attendee
     * root-level fields. Examples:
     *
     * ```
     * const configuration = new MeetingSessionConfiguration({
     *   "Meeting": {
     *      "MeetingId": "...",
     *      "MediaPlacement": {
     *        "AudioHostUrl": "...",
     *        "ScreenDataUrl": "...",
     *        "ScreenSharingUrl": "...",
     *        "ScreenViewingUrl": "...",
     *        "SignalingUrl": "...",
     *        "TurnControlUrl": "..."
     *      }
     *    }
     *   }
     * }, {
     *   "Attendee": {
     *     "ExternalUserId": "...",
     *     "AttendeeId": "...",
     *     "JoinToken": "..."
     *   }
     * });
     * ```
     *
     * ```
     * const configuration = new MeetingSessionConfiguration({
     *   "MeetingId": "...",
     *   "MediaPlacement": {
     *     "AudioHostUrl": "...",
     *     "ScreenDataUrl": "...",
     *     "ScreenSharingUrl": "...",
     *     "ScreenViewingUrl": "...",
     *     "SignalingUrl": "...",
     *     "TurnControlUrl": "..."
     *   }
     * }, {
     *   "ExternalUserId": "...",
     *   "AttendeeId": "...",
     *   "JoinToken": "..."
     * });
     * ```
     */
    constructor(createMeetingResponse, createAttendeeResponse) {
        /**
         * The id of the meeting the session is joining.
         */
        this.meetingId = null;
        /**
         * The external meeting id of the meeting the session is joining.
         */
        this.externalMeetingId = null;
        /**
         * The credentials used to authenticate the session.
         */
        this.credentials = null;
        /**
         * The URLs the session uses to reach the meeting service.
         */
        this.urls = null;
        /**
         * Maximum amount of time in milliseconds to allow for connecting.
         */
        this.connectionTimeoutMs = 15000;
        /**
         * Maximum amount of time in milliseconds to allow for a screen sharing connection.
         */
        this.screenSharingTimeoutMs = 5000;
        /**
         * Maximum amount of time in milliseconds to allow for a screen viewing connection.
         */
        this.screenViewingTimeoutMs = 5000;
        /**
         * Maximum amount of time in milliseconds to wait for the current attendee to be present
         * after initial connection.
         */
        this.attendeePresenceTimeoutMs = 0;
        /**
         * Configuration for connection health policies: reconnection, unusable audio warning connection,
         * and signal strength bars connection.
         */
        this.connectionHealthPolicyConfiguration = new ConnectionHealthPolicyConfiguration_1.default();
        /**
         * Maximum amount of time in milliseconds to allow for reconnecting.
         */
        this.reconnectTimeoutMs = 120 * 1000;
        /**
         * Fixed wait amount in milliseconds between reconnecting attempts.
         */
        this.reconnectFixedWaitMs = 0;
        /**
         * The short back-off time in milliseconds between reconnecting attempts.
         */
        this.reconnectShortBackOffMs = 1 * 1000;
        /**
         * The long back-off time in milliseconds between reconnecting attempts.
         */
        this.reconnectLongBackOffMs = 5 * 1000;
        /**
         * Feature flag to enable Chromium-based browsers.
         *
         * This field is deprecated and will be removed in future version. Right now it will always be regarded as true,
         * since Plan B is not supported for Chromium-based browsers any more.
         */
        this.enableUnifiedPlanForChromiumBasedBrowsers = true;
        /**
         * Feature flag to enable Simulcast
         */
        this.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
        /**
         * Video downlink bandwidth policy to determine which remote videos
         * are subscribed to.
         */
        this.videoDownlinkBandwidthPolicy = null;
        /**
         * Video uplink bandwidth policy to determine the bandwidth constraints
         * of the local video.
         */
        this.videoUplinkBandwidthPolicy = null;
        /**
         * Keep the last frame of the video when a remote video is paused via the pauseVideoTile API.
         * This is done by not clearing the srcObject property of the videoElement.
         */
        this.keepLastFrameWhenPaused = false;
        if (createMeetingResponse) {
            createMeetingResponse = Utils_1.toLowerCasePropertyNames(createMeetingResponse);
            if (createMeetingResponse.meeting) {
                createMeetingResponse = createMeetingResponse.meeting;
            }
            this.meetingId = createMeetingResponse.meetingid;
            this.externalMeetingId = createMeetingResponse.externalmeetingid;
            this.urls = new MeetingSessionURLs_1.default();
            this.urls.audioHostURL = createMeetingResponse.mediaplacement.audiohosturl;
            this.urls.screenDataURL = createMeetingResponse.mediaplacement.screendataurl;
            this.urls.screenSharingURL = createMeetingResponse.mediaplacement.screensharingurl;
            this.urls.screenViewingURL = createMeetingResponse.mediaplacement.screenviewingurl;
            this.urls.signalingURL = createMeetingResponse.mediaplacement.signalingurl;
            this.urls.turnControlURL = createMeetingResponse.mediaplacement.turncontrolurl;
            if (createMeetingResponse.mediaplacement.eventingestionurl) {
                this.urls.eventIngestionURL = createMeetingResponse.mediaplacement.eventingestionurl;
            }
        }
        if (createAttendeeResponse) {
            createAttendeeResponse = Utils_1.toLowerCasePropertyNames(createAttendeeResponse);
            if (createAttendeeResponse.attendee) {
                createAttendeeResponse = createAttendeeResponse.attendee;
            }
            this.credentials = new MeetingSessionCredentials_1.default();
            this.credentials.attendeeId = createAttendeeResponse.attendeeid;
            this.credentials.externalUserId = createAttendeeResponse.externaluserid;
            this.credentials.joinToken = createAttendeeResponse.jointoken;
        }
    }
}
exports.default = MeetingSessionConfiguration;
//# sourceMappingURL=MeetingSessionConfiguration.js.map