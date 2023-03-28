const VoiceResponse = require("twilio").twiml.VoiceResponse;
const AccessToken = require("twilio").jwt.AccessToken;
const twilioCaller = require("./lib/twilio-helpers");
const url = require("url");
const VoiceGrant = AccessToken.VoiceGrant;

const nameGenerator = require("../name_generator");
const config = require("../config");
const { response } = require("express");

let identity;

const AGENT_WAIT_URL =
  "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical";

exports.tokenGenerator = function tokenGenerator(region) {
  identity = "agent1";

  let apiKey;
  let secret;
  let twimlAppSid;

  console.log(region);

  if (region === "ie1") {
    apiKey = config.euApiKey;
    secret = config.euApiSecret;
    twimlAppSid = config.euTwimlAppSid;
  } else if (region === "au1") {
    apiKey = config.auApiKey;
    secret = config.auApiSecret;
    twimlAppSid = config.auTwimlAppSid;
  } else {
    apiKey = config.usApiKey;
    secret = config.usApiSecret;
    twimlAppSid = config.usTwimlAppSid;
  }

  // note: apiKey and secret are region specfic
  const accessToken = new AccessToken(config.accountSid, apiKey, secret, {
    region: region,
  });

  accessToken.identity = identity;
  const grant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });
  accessToken.addGrant(grant);


  // Include identity and token in a JSON response
  return {
    identity: identity,
    token: accessToken.toJwt(),
  };
};

exports.voiceResponse = function voiceResponse(requestBody) {
  console.log(requestBody);
  const toNumberOrClientName = requestBody.To;
  const callerId = config.callerId;
  let twiml = new VoiceResponse();

  // If the request to the /voice endpoint is TO your Twilio Number,
  // then it is an incoming call towards your Twilio.Device.
  if (toNumberOrClientName == callerId) {
    // twiml.say(
    //   { voice: "alice" },
    //   "Thanks for calling. We are experiencing some technical difficulties, and so it may take us longer than usual to answer your call."
    // );
    const gather = twiml.gather({
      action: "/queue-choice",
      numDigits: "1",
    });
    gather.say(
      { voice: "alice", loop: "3" },
      "To connect to Support, press 1. " +
        "To connect to Sales, press 2.  " +
        "For all other enquires, press 3. "
    );

    // let dial = twiml.dial();

    // // This will connect the caller with your Twilio.Device/client
    // dial.client(identity);
  } else if (requestBody.To) {
    console.log(`Outbound call being dialed to ${requestBody.To}`);

    // This is an outgoing call
    console.log(requestBody.To);
    // set the callerId
    let dial = twiml.dial({ callerId });

    // Check if the 'To' parameter is a Phone Number or Client Name
    // in order to use the appropriate TwiML noun
    const attr = isAValidPhoneNumber(toNumberOrClientName)
      ? "number"
      : "client";
    dial[attr]({}, toNumberOrClientName);
  } else if (requestBody.queueName) {
    // This is an agent joining the queue
    console.log(`Dialing into queue ${requestBody.queueName}`);

    // 10 minute timeout. After which the agent will be removed from the queue
    const dial = twiml.dial({ timeout: 600 });
    dial.queue(requestBody.queueName);
  } else {
    twiml.say("Thanks for calling!");
  }

  return twiml.toString();
};

exports.queueChoiceResponse = function queueChoiceResponse(requestBody) {
  console.log(requestBody);
  const twiml = new VoiceResponse();
  let queueName = "Everyone";
  // enqueue call
  if (requestBody.Digits === "1") {
    queueName = "Support";
  } else if (requestBody.Digits === "2") {
    queueName = "Sales";
  }
  twiml.enqueue(queueName);
  return twiml.toString();
}

// The below is conference related and unfinished/untested code
/*
exports.dialerResponse = async (req) => {
  const phoneNumber = req.body.phone;
  console.log(`calling ${phoneNumber}`);
  var pathName = `/outbound`;
  const callbackUrl = url.format({
    protocol: "https",
    host: req.get("host"),
    pathname: pathName,
  });
  await twilioCaller.call(phoneNumber, `${config.serviceUrl}/outbound`);
};

exports.outboundResponse = async (req) => {
  console.log(req.body.AnsweredBy);

  // Use AMD to determine if the call was answered by a human or machine
  // Hangup if it's a machine.
  if (req.body.AnsweredBy === "human" || req.body.AnsweredBy === "unknown") {
    var conferenceId = req.body.CallSid,
      agentOne = "agent1",
      callbackUrl = connectConferenceUrl(req, agentOne, conferenceId);

    await twilioCaller.callClient(agentOne, callbackUrl);

    return await twilioCaller
      .connectConferenceTwiml({
        conferenceId: conferenceId,
        waitUrl: AGENT_WAIT_URL,
        startConferenceOnEnter: false,
        endConferenceOnExit: true,
      })
      .toString();
  } else {
    let twiml = new VoiceResponse();
    twiml.hangup();
    return twiml.toString();
  }
};

exports.connectResponse = async function connectResponse(req, res) {
  // let twiml = new VoiceResponse();

  // direct call to client
  // let dial = twiml.dial();
  // // This will connect the caller with your Twilio.Device/client
  // dial.client(identity);

  // enqueue call
  // twiml.enqueue({
  // }, 'support');

  // conference
  // const dial = twiml.dial();
  // dial.conference('Room 1234');

  // console.log("calling ", identity, callbackUrl);
  // await twilioCaller.call(identity, callbackUrl)

  // console.log("twiml", twiml.toString());

  //  return twiml.toString();

  // *** Conference ****

  var conferenceId = req.body.CallSid,
    agentOne = identity,
    callbackUrl = connectConferenceUrl(req, agentOne, conferenceId);

  await twilioCaller.call(agentOne, callbackUrl).then(function (doc) {
    //res.type('text/xml');
    return twilioCaller
      .connectConferenceTwiml({
        conferenceId: conferenceId,
        waitUrl: AGENT_WAIT_URL,
        startConferenceOnEnter: false,
        endConferenceOnExit: true,
      })
      .toString();
  });
};

var connectConferenceUrl = function (req, agentId, conferenceId) {
  var pathName = `/conference/${conferenceId}/connect/${agentId}`;
  return url.format({
    protocol: "https",
    host: req.get("host"),
    pathname: pathName,
  });
};
*/

/**
 * Checks if the given value is valid as phone number
 * @param {Number|String} number
 * @return {Boolean}
 */
function isAValidPhoneNumber(number) {
  return /^[\d\+\-\(\) ]+$/.test(number);
}
