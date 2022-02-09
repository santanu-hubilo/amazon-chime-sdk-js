import type { Destroyable } from '../destroyable/Destroyable';
import LogLevel from '../logger/LogLevel';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
/**
 * `MeetingSessionPOSTLogger` publishes log messages in batches to a URL
 * supplied during its construction.
 *
 * Be sure to call {@link MeetingSessionPOSTLogger.destroy} when you're done
 * with the logger in order to avoid leaks.
 */
export default class MeetingSessionPOSTLogger implements Destroyable {
    private name;
    private configuration;
    private batchSize;
    private intervalMs;
    private url;
    private level;
    private headers?;
    private logCapture;
    private sequenceNumber;
    private lock;
    private intervalScheduler;
    private eventListener;
    constructor(name: string, configuration: MeetingSessionConfiguration, batchSize: number, intervalMs: number, url: string, level?: LogLevel, headers?: Record<string, string>);
    addEventListener(): void;
    removeEventListener(): void;
    debug(debugFunction: string | (() => string)): void;
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
    setLogLevel(level: LogLevel): void;
    getLogLevel(): LogLevel;
    getLogCaptureSize(): number;
    startLogPublishScheduler(batchSize: number): void;
    stop(): void;
    /**
     * Permanently clean up the logger. A new logger must be created to
     * resume logging.
     */
    destroy(): Promise<void>;
    private makeRequestBody;
    private log;
}
