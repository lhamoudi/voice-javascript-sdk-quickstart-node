"use strict";
var VoiceResponse = require("twilio").twiml.VoiceResponse;
const config = require("../../config");

var callClient = async function (agentId, callbackUrl) {
  var twilioPhoneNumber = process.env.TWILIO_CALLER_ID;
  var client = require("twilio")(config.accountSid, config.secret, {
    edge: config.edge,
    region: config.region,
  });

  return client.calls.create({
    from: twilioPhoneNumber,
    to: `client:${agentId}`,
    url: callbackUrl,
  });
};

var call = async function (phoneNumber, callbackUrl) {
  var twilioPhoneNumber = process.env.TWILIO_CALLER_ID;
  var client = require("twilio")(config.accountSid, config.secret, {
    edge: config.edge,
    region: config.region,
  });

  return client.calls.create({
    machineDetection: 'Enable',
    from: twilioPhoneNumber,
    to: phoneNumber,
    url: callbackUrl,
  });
};

var connectConferenceTwiml = function (options) {
  var voiceResponse = new VoiceResponse();
  voiceResponse.dial().conference(
    {
      startConferenceOnEnter: options.startConferenceOnEnter,
      endConferenceOnExit: options.endConferenceOnExit,
      waitUrl: options.waitUrl,
      record: "record-from-start",
    },
    options.conferenceId
  );

  return voiceResponse;
};

var waitResponseTwiml = function () {
  var voiceResponse = new VoiceResponse();
  voiceResponse.say(
    {},
    "Thank you for calling. Please wait in line for a few seconds. An agent will be with you shortly."
  );
  voiceResponse.play(
    {},
    "http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.mp3"
  );

  return voiceResponse;
};

module.exports.waitResponseTwiml = waitResponseTwiml;
module.exports.connectConferenceTwiml = connectConferenceTwiml;
module.exports.callClient = callClient;
module.exports.call = call;
