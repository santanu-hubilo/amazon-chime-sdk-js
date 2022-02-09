import VideoCaptureAndEncodeParameter from './VideoCaptureAndEncodeParameter';
export default class DefaultVideoCaptureAndEncodeParameter implements VideoCaptureAndEncodeParameter {
    private cameraWidth;
    private cameraHeight;
    private cameraFrameRate;
    private maxEncodeBitrateKbps;
    private isSimulcast;
    private scaleResolutionDownBy;
    constructor(cameraWidth: number, cameraHeight: number, cameraFrameRate: number, maxEncodeBitrateKbps: number, isSimulcast: boolean, scaleResolutionDownBy?: number);
    equal(other: DefaultVideoCaptureAndEncodeParameter): boolean;
    clone(): DefaultVideoCaptureAndEncodeParameter;
    captureWidth(): number;
    captureHeight(): number;
    captureFrameRate(): number;
    encodeBitrates(): number[];
    encodeScaleResolutionDownBy(): number[];
    encodeWidths(): number[];
    encodeHeights(): number[];
}
