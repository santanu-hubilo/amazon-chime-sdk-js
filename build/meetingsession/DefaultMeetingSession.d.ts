import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import ContentShareController from '../contentsharecontroller/ContentShareController';
import Destroyable from '../destroyable/Destroyable';
import DeviceController from '../devicecontroller/DeviceController';
import EventReporter from '../eventreporter/EventReporter';
import Logger from '../logger/Logger';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import MeetingSession from './MeetingSession';
import MeetingSessionConfiguration from './MeetingSessionConfiguration';
export default class DefaultMeetingSession implements MeetingSession, Destroyable {
    private _configuration;
    private _logger;
    private audioVideoController;
    private contentShareController;
    private _deviceController;
    private audioVideoFacade;
    private _eventReporter;
    constructor(configuration: MeetingSessionConfiguration, logger: Logger, deviceController: DeviceControllerBasedMediaStreamBroker, eventReporter?: EventReporter);
    get configuration(): MeetingSessionConfiguration;
    get logger(): Logger;
    get audioVideo(): AudioVideoFacade;
    get contentShare(): ContentShareController;
    get deviceController(): DeviceController;
    get eventReporter(): EventReporter;
    /**
     * Clean up this instance and resources that it created.
     *
     * After calling `destroy`, internal fields like `audioVideoController` will be unavailable.
     */
    destroy(): Promise<void>;
    private setupEventReporter;
    private checkBrowserSupportAndFeatureConfiguration;
    private isSimulcastUplinkPolicy;
}
