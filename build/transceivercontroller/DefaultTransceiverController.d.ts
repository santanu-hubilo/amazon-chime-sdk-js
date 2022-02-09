import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import Logger from '../logger/Logger';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import TransceiverController from './TransceiverController';
export default class DefaultTransceiverController implements TransceiverController {
    protected logger: Logger;
    protected browserBehavior: BrowserBehavior;
    protected _localCameraTransceiver: RTCRtpTransceiver | null;
    protected _localAudioTransceiver: RTCRtpTransceiver | null;
    protected videoSubscriptions: number[];
    protected defaultMediaStream: MediaStream | null;
    protected peer: RTCPeerConnection | null;
    protected streamIdToTransceiver: Map<number, RTCRtpTransceiver>;
    constructor(logger: Logger, browserBehavior: BrowserBehavior);
    setEncodingParameters(encodingParamMap: Map<string, RTCRtpEncodingParameters>): Promise<void>;
    static setVideoSendingBitrateKbpsForSender(sender: RTCRtpSender, bitrateKbps: number, _logger: Logger): Promise<void>;
    static replaceAudioTrackForSender(sender: RTCRtpSender, track: MediaStreamTrack): Promise<boolean>;
    localAudioTransceiver(): RTCRtpTransceiver;
    localVideoTransceiver(): RTCRtpTransceiver;
    setVideoSendingBitrateKbps(bitrateKbps: number): Promise<void>;
    setPeer(peer: RTCPeerConnection): void;
    reset(): void;
    useTransceivers(): boolean;
    hasVideoInput(): boolean;
    trackIsVideoInput(track: MediaStreamTrack): boolean;
    setupLocalTransceivers(): void;
    replaceAudioTrack(track: MediaStreamTrack): Promise<boolean>;
    setAudioInput(track: MediaStreamTrack | null): Promise<void>;
    setVideoInput(track: MediaStreamTrack | null): Promise<void>;
    updateVideoTransceivers(videoStreamIndex: VideoStreamIndex, videosToReceive: VideoStreamIdSet): number[];
    private updateTransceivers;
    private updateTransceiverWithStop;
    private updateTransceiverWithoutStop;
    getMidForStreamId(streamId: number): string | undefined;
    setStreamIdForMid(mid: string, newStreamId: number): void;
    protected transceiverIsVideo(transceiver: RTCRtpTransceiver): boolean;
    private debugDumpTransceivers;
    private setTransceiverInput;
}
