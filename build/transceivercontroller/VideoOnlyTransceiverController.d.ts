import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import Logger from '../logger/Logger';
import DefaultTransceiverController from './DefaultTransceiverController';
export default class VideoOnlyTransceiverController extends DefaultTransceiverController {
    constructor(logger: Logger, browserBehavior: BrowserBehavior);
    setupLocalTransceivers(): void;
}
