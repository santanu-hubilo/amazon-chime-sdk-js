import Logger from '../logger/Logger';
import { SdkMetric } from '../signalingprotocol/SignalingProtocol.js';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import ClientMetricReport from './ClientMetricReport';
import Direction from './ClientMetricReportDirection';
import MediaType from './ClientMetricReportMediaType';
import GlobalMetricReport from './GlobalMetricReport';
import StreamMetricReport from './StreamMetricReport';
export default class DefaultClientMetricReport implements ClientMetricReport {
    private logger;
    private videoStreamIndex?;
    private selfAttendeeId?;
    globalMetricReport: GlobalMetricReport;
    streamMetricReports: {
        [id: number]: StreamMetricReport;
    };
    currentTimestampMs: number;
    previousTimestampMs: number;
    currentSsrcs: {
        [id: number]: number;
    };
    constructor(logger: Logger, videoStreamIndex?: VideoStreamIndex, selfAttendeeId?: string);
    /**
     *  Metric transform functions
     */
    identityValue: (metricName?: string, ssrc?: number) => number;
    decoderLossPercent: (metricName?: string, ssrc?: number) => number;
    packetLossPercent: (sourceMetricName?: string, ssrc?: number) => number;
    countPerSecond: (metricName?: string, ssrc?: number) => number;
    bitsPerSecond: (metricName?: string, ssrc?: number) => number;
    secondsToMilliseconds: (metricName?: string, ssrc?: number) => number;
    /**
     *  Canonical and derived metric maps
     */
    readonly globalMetricMap: {
        [id: string]: {
            transform?: (metricName?: string, ssrc?: number) => number;
            type?: SdkMetric.Type;
            source?: string;
        };
    };
    readonly audioUpstreamMetricMap: {
        [id: string]: {
            transform?: (metricName?: string, ssrc?: number) => number;
            type?: SdkMetric.Type;
            source?: string;
        };
    };
    readonly audioDownstreamMetricMap: {
        [id: string]: {
            transform?: (metricName?: string, ssrc?: number) => number;
            type?: SdkMetric.Type;
            source?: string;
        };
    };
    readonly videoUpstreamMetricMap: {
        [id: string]: {
            transform?: (metricName?: string, ssrc?: number) => number;
            type?: SdkMetric.Type;
            source?: string;
        };
    };
    readonly videoDownstreamMetricMap: {
        [id: string]: {
            transform?: (metricName?: string, ssrc?: number) => number;
            type?: SdkMetric.Type;
            source?: string;
        };
    };
    getMetricMap(mediaType?: MediaType, direction?: Direction): {
        [id: string]: {
            transform?: (metricName?: string, ssrc?: number) => number;
            type?: SdkMetric.Type;
            source?: string;
        };
    };
    /**
     *  media Stream metrics
     */
    readonly observableVideoMetricSpec: {
        [id: string]: {
            source: string;
            media?: MediaType;
            dir?: Direction;
        };
    };
    /**
     * Observable metrics and related APIs
     */
    readonly observableMetricSpec: {
        [id: string]: {
            source: string;
            media?: MediaType;
            dir?: Direction;
        };
    };
    getObservableMetricValue(metricName: string): number;
    getObservableVideoMetricValue(metricName: string, ssrcNum: number): number;
    getObservableMetrics(): {
        [id: string]: number;
    };
    getObservableVideoMetrics(): {
        [id: string]: {
            [id: string]: {};
        };
    };
    /**
     * Utilities
     */
    clone(): DefaultClientMetricReport;
    print(): void;
    removeDestroyedSsrcs(): void;
}
