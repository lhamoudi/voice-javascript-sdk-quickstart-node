const Router = require("express").Router;
const { tokenGenerator, voiceResponse, menuResponse, connectResponse, outboundResponse, dialerResponse } = require("./handler");
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

router.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(voiceResponse(req.body));
});

router.post("/dial", (req, res) => {
  res.set("Content-Type", "text/xml");
  dialerResponse(req);
  res.sendStatus(200);
});

router.post("/outbound", async (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(await outboundResponse(req));
});

router.post("/menu", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(menuResponse(req.body));
});

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

module.exports = router;
