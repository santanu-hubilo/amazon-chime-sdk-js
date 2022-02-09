export default interface VideoDownlinkObserver {
    /**
     * Called when the downlink policy wants to pause the remote video tile
     */
    tileWillBePausedByDownlinkPolicy(tileId: number): void;
    /**
     * Called when the downlink policy wants to unpause the remote video tile
     */
    tileWillBeUnpausedByDownlinkPolicy(tileId: number): void;
}
