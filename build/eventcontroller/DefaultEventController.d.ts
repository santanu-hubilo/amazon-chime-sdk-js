import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import EventReporter from '../eventreporter/EventReporter';
import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';
import EventController from './EventController';
import EventName from './EventName';
import MeetingHistoryState from './MeetingHistoryState';
export default class DefaultEventController implements EventController {
    private audioVideoController;
    private eventReporter?;
    constructor(audioVideoController: AudioVideoController, eventReporter?: EventReporter);
    publishEvent(name: EventName, attributes?: AudioVideoEventAttributes | DeviceEventAttributes): Promise<void>;
    private reportEvent;
    pushMeetingState(state: MeetingHistoryState, timestampMs?: number): Promise<void>;
    private getAttributes;
}
