const dotenv = require("dotenv");
const cfg = {};

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: ".env" });
} else {
  dotenv.config({ path: ".env.example", silent: true });
}

// HTTP Port to run our web application
cfg.port = process.env.PORT || 3000;

// Your Twilio account SID and auth token, both found at:
// https://www.twilio.com/user/account
//
// A good practice is to store these string values as system environment
// variables, and load them from there as we are doing below. Alternately,
// you could hard code these values here as strings.
cfg.accountSid = process.env.TWILIO_ACCOUNT_SID;
cfg.secret = process.env.TWILIO_SECRET;

// Region and Edge
cfg.region = process.env.TWILIO_REGION;
cfg.edge = process.env.TWILIO_EDGE;

cfg.callerId = process.env.TWILIO_CALLER_ID;

// US Region
cfg.usTwimlAppSid = process.env.TWILIO_US_TWIML_APP_SID;
cfg.usApiKey = process.env.TWILIO_US_API_KEY;
cfg.usApiSecret = process.env.TWILIO_US_API_SECRET;

// EU Region
cfg.euTwimlAppSid = process.env.TWILIO_EU_TWIML_APP_SID;
cfg.euApiKey = process.env.TWILIO_EU_API_KEY;
cfg.euApiSecret = process.env.TWILIO_EU_API_SECRET;

// AU Region
cfg.auTwimlAppSid = process.env.TWILIO_AU_TWIML_APP_SID;
cfg.auApiKey = process.env.TWILIO_AU_API_KEY;
cfg.auApiSecret = process.env.TWILIO_AU_API_SECRET;

// Service Url
cfg.serviceUrl = process.env.SERVICE_URL;

// Export configuration object
module.exports = cfg;
