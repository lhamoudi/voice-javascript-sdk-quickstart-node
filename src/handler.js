const VoiceResponse = require("twilio").twiml.VoiceResponse;
const AccessToken = require("twilio").jwt.AccessToken;
const twilioCaller = require("./lib/twilio-helpers");
const url = require("url");
const VoiceGrant = AccessToken.VoiceGrant;

const nameGenerator = require("../name_generator");
const config = require("../config");

let identity;

const AGENT_WAIT_URL =
  "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical";

exports.tokenGenerator = function tokenGenerator(region) {
  identity = "agent1"; 

  let apiKey;
  let secret;
  let twimlAppSid;

  console.log(region);

  if (region === "us1") {
    apiKey = config.usApiKey;
    secret = config.usApiSecret;
    twimlAppSid = config.usTwimlAppSid;
  } else {
    apiKey = config.euApiKey;
    secret = config.euApiSecret;
    twimlAppSid = config.euTwimlAppSid;
  }

  const accessToken = new AccessToken(config.accountSid, apiKey, secret);
  // !!! important !!! //
  accessToken.region = region;
  
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
    //const twiml = new VoiceResponse();
    const gather = twiml.gather({
      action: "/menu",
      numDigits: "1",
    });
    gather.say(
      { voice: "alice", loop: "3" },
      "Thanks for calling ABC Corporation, press 1. For store hours, " +
        "press 2. To connect to representative."
    );

    // let dial = twiml.dial();

    // // This will connect the caller with your Twilio.Device/client
    // dial.client(identity);
  } else if (requestBody.To) {
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
  } else if (requestBody.queue) {
    const dial = twiml.dial();
    dial.queue(
      {
        action: "https://webhook.site/bd2e8408-32b0-4956-8fce-496bf337ed79",
        method: "POST",
      },
      requestBody.queue
    );
  } else {
    twiml.say("Thanks for calling!");
  }

  return twiml.toString();
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

exports.menuResponse = function menuResponse(requestBody) {
  const selectedOption = requestBody.Digits;
  const optionActions = {
    1: storeHours,
    2: connectToRepresentative,
  };

  const action = optionActions[selectedOption] || redirectWelcome;
  return action().toString();
};

const storeHours = function () {
  const twiml = new VoiceResponse();
  twiml.say(
    { voice: "alice" },
    "Store hours are Monday through Friday, 8 AM to 8 PM, Saturday and Sunday, 10 AM to 6 PM."
  );
  twiml.say("Thank you for calling the ABC Corporation, have a nice day.");
  twiml.hangup();

  return twiml;
};

const connectToRepresentative = function () {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    action: "/connect",
    numDigits: "1",
  });
  gather.say(
    { voice: "alice", loop: "3" },
    "To connect to customer service, press 1. " +
      "To connect to sales, press 2.  " +
      "For all other enquires, press 3 "
  );

  return twiml;
};

var connectConferenceUrl = function (req, agentId, conferenceId) {
  var pathName = `/conference/${conferenceId}/connect/${agentId}`;
  return url.format({
    protocol: "https",
    host: req.get("host"),
    pathname: pathName,
  });
};

/**
 * Checks if the given value is valid as phone number
 * @param {Number|String} number
 * @return {Boolean}
 */
function isAValidPhoneNumber(number) {
  return /^[\d\+\-\(\) ]+$/.test(number);
}
