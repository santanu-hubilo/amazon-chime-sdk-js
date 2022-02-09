import DevicePixelRatioMonitor from '../devicepixelratiomonitor/DevicePixelRatioMonitor';
import DevicePixelRatioObserver from '../devicepixelratioobserver/DevicePixelRatioObserver';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoTile from './VideoTile';
import VideoTileState from './VideoTileState';
export default class DefaultVideoTile implements DevicePixelRatioObserver, VideoTile {
    private tileController;
    private devicePixelRatioMonitor;
    private tileState;
    /**
     * Connect a video stream to a video element by setting the srcObject of the video element to the video stream.
     * @param videoStream The video stream input.
     * @param videoElement The video element input.
     * @param localTile Flag to indicate whether this is a local video.
     */
    static connectVideoStreamToVideoElement(videoStream: MediaStream, videoElement: HTMLVideoElement, localTile: boolean): void;
    /**
     * Disconnect a video stream to a video element by clearing the srcObject of the video element.
     * This will also stop all the tracks of the current stream in the srcObject.
     * @param videoElement The video element input.
     * @param dueToPause A flag to indicate whether this function is called due to pausing video tile.
     *  If true, then we will not stop the stream's tracks and just clearing out the srcObject.
     * @param keepLastFrameWhenPaused If true and dueToPause is also true, then we will not clear out the srcObject of the
     * video element when it is paused and therefore, the last frame of the stream will be shown.
     */
    static disconnectVideoStreamFromVideoElement(videoElement: HTMLVideoElement | null, dueToPause: boolean, keepLastFrameWhenPaused?: boolean | undefined): void;
    constructor(tileId: number, localTile: boolean, tileController: VideoTileController, devicePixelRatioMonitor: DevicePixelRatioMonitor);
    destroy(): void;
    devicePixelRatioChanged(newDevicePixelRatio: number): void;
    id(): number;
    state(): VideoTileState;
    stateRef(): VideoTileState;
    bindVideoStream(attendeeId: string, localTile: boolean, mediaStream: MediaStream | null, contentWidth: number | null, contentHeight: number | null, streamId: number | null, externalUserId?: string): void;
    bindVideoElement(videoElement: HTMLVideoElement | null): void;
    pause(): void;
    unpause(): void;
    markPoorConnection(): boolean;
    unmarkPoorConnection(): boolean;
    capture(): ImageData | null;
    setStreamId(id: number): void;
    private sendTileStateUpdate;
    private updateActiveState;
    private updateVideoElementPhysicalPixels;
    private updateVideoStreamOnVideoElement;
    private static setVideoElementFlag;
}
