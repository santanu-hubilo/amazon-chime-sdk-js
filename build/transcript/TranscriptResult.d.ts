import TranscriptAlternative from './TranscriptAlternative';
export default class TranscriptResult {
    resultId: string;
    channelId?: string;
    isPartial: boolean;
    startTimeMs: number;
    endTimeMs: number;
    alternatives: TranscriptAlternative[];
}
