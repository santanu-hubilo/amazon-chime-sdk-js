import type { Eq, PartialOrd } from '../utils/Types';
import TargetDisplaySize from './TargetDisplaySize';
export default class VideoPreference implements Eq, PartialOrd {
    attendeeId: string;
    priority: number;
    /**
     * The desired maximum simulcast layers to receive.
     */
    targetSize: TargetDisplaySize;
    /** Initializes a [[VideoPreference]] with the given properties.
     *
     * @param attendeeId Attendee ID of the client
     * @param priority The relative priority of this attendee against others.
     * @param targetSize The desired maximum simulcast layers to receive.
     */
    constructor(attendeeId: string, priority: number, targetSize?: TargetDisplaySize);
    partialCompare(other: this): number;
    equals(other: this): boolean;
    private static readonly LOW_BITRATE_KBPS;
    private static readonly MID_BITRATE_KBPS;
    private static readonly HIGH_BITRATE_KBPS;
    targetSizeToBitrateKbps(targetSize: TargetDisplaySize): number;
}
