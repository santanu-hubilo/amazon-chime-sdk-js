"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[VideoPriorityBasedPolicyConfig]] contains the network issue response delay and network issue recovery delay.
 */
class VideoPriorityBasedPolicyConfig {
    /** Initializes a [[VideoPriorityBasedPolicyConfig]] with the network event delays.
     *
     * @param networkIssueResponseDelayFactor Delays before reducing subscribed video bitrate. Input should be a value between 0 and 1.
     * @param networkIssueRecoveryDelayFactor Delays before starting to increase bitrates after a network event and
     * delays between increasing video bitrates on each individual stream. Input should be a value between 0 and 1.
     */
    constructor(networkIssueResponseDelayFactor = 0, networkIssueRecoveryDelayFactor = 0) {
        this.networkIssueResponseDelayFactor = networkIssueResponseDelayFactor;
        this.networkIssueRecoveryDelayFactor = networkIssueRecoveryDelayFactor;
        if (networkIssueResponseDelayFactor < 0) {
            networkIssueResponseDelayFactor = 0;
        }
        else if (networkIssueResponseDelayFactor > 1) {
            networkIssueResponseDelayFactor = 1;
        }
        this.networkIssueResponseDelayFactor = networkIssueResponseDelayFactor;
        if (networkIssueRecoveryDelayFactor < 0) {
            networkIssueRecoveryDelayFactor = 0;
        }
        else if (networkIssueRecoveryDelayFactor > 1) {
            networkIssueRecoveryDelayFactor = 1;
        }
        this.networkIssueRecoveryDelayFactor = networkIssueRecoveryDelayFactor;
    }
}
exports.default = VideoPriorityBasedPolicyConfig;
// presets
VideoPriorityBasedPolicyConfig.Default = new VideoPriorityBasedPolicyConfig(0, 0);
VideoPriorityBasedPolicyConfig.UnstableNetworkPreset = new VideoPriorityBasedPolicyConfig(0, 1);
VideoPriorityBasedPolicyConfig.StableNetworkPreset = new VideoPriorityBasedPolicyConfig(1, 0);
//# sourceMappingURL=VideoPriorityBasedPolicyConfig.js.map