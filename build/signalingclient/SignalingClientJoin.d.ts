import ApplicationMetadata from '../applicationmetadata/ApplicationMetadata';
/**
 * [[SignalingClientJoin]] contains settings for the Join SignalFrame.
 */
export default class SignalingClientJoin {
    maxVideos: number;
    sendBitrates: boolean;
    readonly applicationMetadata?: ApplicationMetadata;
    /** Initializes a SignalingClientJoin with the given properties.
     *
     * // maxVideos is deprecated as the video sending/receiving capacity limits
     * // for a meeting will be controlled by the backend.
     * @param maxVideos Usage of maxVideos variable will result into no-op.
     * @param sendBitrates Whether the server should send Bitrates messages.
     * @param applicationMetadata [[ApplicationMetadata]].
     */
    constructor(maxVideos: number, sendBitrates: boolean, applicationMetadata?: ApplicationMetadata);
}
