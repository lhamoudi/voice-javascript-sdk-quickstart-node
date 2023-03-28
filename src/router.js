const Router = require("express").Router;
const {
  tokenGenerator,
  voiceResponse,
  menuResponse,
  connectResponse,
  outboundResponse,
  dialerResponse,
  queueChoiceResponse,
} = require("./handler");
const twilioCaller = require('./lib/twilio-helpers');
const url = require('url');
const AGENT_WAIT_URL = 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical';
const router = new Router();

/**
 * Generate a Capability Token for a Twilio Client user - it generates a random
 * username for the client requesting a token.
 */
router.get("/token", (req, res) => {
  console.log(req.query.region);
  res.send(tokenGenerator(req.query.region));
});

/**
 * Handles an incoming call attempt to the Twilio Phone Number - either from PSTN (i.e. an inbound call)
 * or from the Voice Client (i.e. an outbound call). Also handles agent dialing into a voice queue (in order
 * to be connected with inbound callers).
 * 
 * Returns TwiML to Programmable Voice.
 */
router.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(voiceResponse(req.body));
});

/**
 * Handles selection of a queue from the IVR menu options
 * 
 * Returns TwiML to Programmable Voice.
 */
router.post("/queue-choice", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(queueChoiceResponse(req.body));
});

/**
 * Handles outbound call creation - via the REST API
 * 
 * Not TwiML related
 */
router.post("/dial", (req, res) => {
  res.set("Content-Type", "text/xml");
  dialerResponse(req);
  res.sendStatus(200);
});

/**
 * Handles the TwiML to be executed when an outbound call is answered
 * 
 * Returns TwiML to Programmable Voice
 */
router.post("/outbound", async (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(await outboundResponse(req));
});



// The below commented stuff is for unfinished conference functionality. We're using just voice queues for now.


/*
router.post("/connect", (req, res) => {
  res.set("Content-Type", "text/xml");

  var conferenceId = req.body.CallSid
  , agentOne = "agent1"
  , callbackUrl = connectConferenceUrl(req, agentOne, conferenceId);

 twilioCaller.callClient(agentOne, callbackUrl)
  .then(function(doc) {
    res.type('text/xml');
    res.send( twilioCaller.connectConferenceTwiml({
      conferenceId: conferenceId,
      waitUrl: AGENT_WAIT_URL,
      startConferenceOnEnter: false,
      endConferenceOnExit: true
    })
    .toString());
  });
});

var connectConferenceUrl = function(req, agentId, conferenceId) {
  var pathName = `/conference/${conferenceId}/connect/${agentId}`;
  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: pathName
  });
};

router.post('/conference/:conferenceId/connect/:agentId', function (req, res) {
  res.type('text/xml');
  res.send(twilioCaller.connectConferenceTwiml({
    conferenceId: req.params.conferenceId,
    waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
    startConferenceOnEnter: true,
    endConferenceOnExit: true
  })
  .toString());
});
*/

module.exports = router;
