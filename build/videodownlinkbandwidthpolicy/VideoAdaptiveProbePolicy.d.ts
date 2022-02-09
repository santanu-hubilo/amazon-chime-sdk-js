import Logger from '../logger/Logger';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import { VideoPreferences } from './VideoPreferences';
import VideoPriorityBasedPolicy from './VideoPriorityBasedPolicy';
export default class VideoAdaptiveProbePolicy extends VideoPriorityBasedPolicy {
    protected logger: Logger;
    constructor(logger: Logger);
    reset(): void;
    updateIndex(videoIndex: VideoStreamIndex): void;
    /**
     * [[VideoAdaptiveProbePolicy]] does not allow setting video preferences and this function
     * will be a no-op.  Please use [[VideoPriorityBasedPolicy]] directly if you would like to set
     * preferences.
     */
    chooseRemoteVideoSources(_preferences: VideoPreferences): void;
}
