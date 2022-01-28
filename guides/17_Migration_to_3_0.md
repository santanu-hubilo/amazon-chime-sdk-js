# Migration from SDK v1 to SDK v2

## Installation

Installation involves adjusting your `package.json` to depend on version `3.0.0`.

```shell
npm install --save amazon-chime-sdk-js@3
```

## Interface changes

Version 3 of the Amazon Chime SDK for JavaScript makes a number of interface
changes.

In many cases you should not need to adjust your application code at all. This will be the case if:

* You do not implement your own `EventController` or construct `DefaultEventController` yourself.
* You do not pass a `EventReporter` yourself or use the reporter through `MeetingSession`.
* You do not explicitly call `addObserver` on any instances of `AudioVideoController` using a `AudioVideoObserver` that implements `eventDidReceive`.

If your application does not meet all four criteria, read on.

### Updating `EventController` use cases
The `EventController` has been decoupled from the `AudioVideoController` which has added addtional required functions to the interface.
```typescript
addObserver(observer: EventObserver): void;
removeObserver(observer: EventObserver): void;
forEachObserver(observerFunc: (observer: EventObserver) => void): void;
// Optional

```

Addtionally because of this the constructor of `DefaultEventController` has been updated
```typescript
// Old Syntax
constructor(
    audioVideoController: AudioVideoController
    eventReporter?: EventReporter
  )

// New Syntax
constructor(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    eventReporter?: EventReporter
  )
```

### Updating `EventReporter` use cases

The `DefaultMeetingSession` constructor no longer takes in a `EventReporter` as it is no longer in charge constructing a reporter.

If your code looked like this:
```typescript
const configuration = new MeetingSessionConfiguration(…);
const eventReporter = new EventReporter(...)
…
const deviceController = new DefaultDeviceController(logger);

this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController, eventReporter);
})
```
change it to

```typescript
const configuration = new MeetingSessionConfiguration(…);
const eventReporter = new EventReporter(...)
…
const deviceController = new DefaultDeviceController(logger);
const eventController = new DefaultEventController(configuration, logger, eventReporter)
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController, eventController);
})
```

### Updating `eventDidReceive` use cases
The `eventDidReceive` function that was part of `AudioVideoObserver` has been moved to `EventObserver` which is a observer that the `EventController` now handles. Addtionnaly because of this if you were
you were call `eventDidReceive` through call `forEachObserver` on `AudioVideoController` you will
have to call it instead on `EventController`.

If your code looked like this:

```typescript
const configuration = new MeetingSessionConfiguration(…);
…
const deviceController = new DefaultDeviceController(logger);
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
this.audioVideo = this.meetingSession.audioVideo;
this.audioVideo.addObserver({
          eventDidReceive(name: EventName, attributes: EventAttributes): void {
            ...
          }
          ...
})
this.audioVideo.forEachObserver((observer: AudioVideoObserver) => {
      eventDidReceive(...) 
      ...
    }
);
```

change it to

```typescript
const configuration = new MeetingSessionConfiguration(…);
…
const deviceController = new DefaultDeviceController(logger);
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
this.audioVideo = this.meetingSession.audioVideo;
this.eventController = this.meetingSession.eventController;
this.audioVideo.addObserver(...)
this.eventController.eventController.addObserver({
          eventDidReceive(name: EventName, attributes: EventAttributes): void {
            ...
          }
});
this.audioVideo.forEachObserver((observer: AudioVideoObserver) => {
      ...
    }
);
this.eventController.forEachObserver((observer: AudioVideoObserver) => {
      eventDidReceive(...) 
    }
);
```