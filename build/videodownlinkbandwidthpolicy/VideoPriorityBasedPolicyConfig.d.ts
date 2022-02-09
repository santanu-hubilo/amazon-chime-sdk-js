/**
 * [[VideoPriorityBasedPolicyConfig]] contains the network issue response delay and network issue recovery delay.
 */
export default class VideoPriorityBasedPolicyConfig {
    networkIssueResponseDelayFactor: number;
    networkIssueRecoveryDelayFactor: number;
    static readonly Default: VideoPriorityBasedPolicyConfig;
    static readonly UnstableNetworkPreset: VideoPriorityBasedPolicyConfig;
    static readonly StableNetworkPreset: VideoPriorityBasedPolicyConfig;
    /** Initializes a [[VideoPriorityBasedPolicyConfig]] with the network event delays.
     *
     * @param networkIssueResponseDelayFactor Delays before reducing subscribed video bitrate. Input should be a value between 0 and 1.
     * @param networkIssueRecoveryDelayFactor Delays before starting to increase bitrates after a network event and
     * delays between increasing video bitrates on each individual stream. Input should be a value between 0 and 1.
     */
    constructor(networkIssueResponseDelayFactor?: number, networkIssueRecoveryDelayFactor?: number);
}
