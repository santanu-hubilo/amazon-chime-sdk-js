"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const EventBufferConfiguration_1 = require("../eventbufferconfiguration/EventBufferConfiguration");
/**
 * [[EventIngestionConfiguration]] contains necessary information to
 * report events to the ingestion service.
 */
class EventIngestionConfiguration {
    constructor(eventsClientConfiguration, ingestionURL, eventBufferConfiguration = new EventBufferConfiguration_1.default()) {
        this.eventsClientConfiguration = eventsClientConfiguration;
        this.ingestionURL = ingestionURL;
        this.eventBufferConfiguration = eventBufferConfiguration;
    }
}
exports.default = EventIngestionConfiguration;
//# sourceMappingURL=EventIngestionConfiguration.js.map