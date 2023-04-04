<a href="https://www.twilio.com">
  <img src="https://static0.twilio.com/marketing/bundles/marketing/img/logos/wordmark-red.svg" alt="Twilio" width="250" />
</a>


# Customizations to the Twilio Voice JavaScript SDK Quickstart for Node.js

This repo is a customization of [Twilio Voice JavaScript SDK Quickstart for Node.js](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-node) to support the following added features:

* Region Selection
* Join/Leave Voice Queue
* Basic IVR Menu for Queue Selection

## Custom Setup

### `.env`
You will need to update the `.env` file with the `TWILIO_<region>_TWIML_[APP_SID|API_KEY|SECRET]`values for each region you want to support. For example, if you only want to support the default US region, you will need to add the following to your `.env` file:

```bash
TWILIO_US_TWIML_APP_SID=APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_US_API_KEY=SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_US_API_SECRET=XXXXXXXXXXXXXXXXX
```
This is in addition to the standard `TWILIO_ACCOUNT_SID`and `TWILIO_CALLER_ID` values. No need to set `TWILIO_SECRET` (aka auth token), as it's only used by commented-out code relating to unfinished conference logic. 

A TwiML App SID is needed for the `outgoingApplicationSid` in the Voice Grant - and will be invoked for outbound calls from the Voice Client. The API Key and Secret are needed to create an Access Token. See [Create an Access Token for Voice](https://www.twilio.com/docs/iam/access-tokens#create-an-access-token-for-voice). TwiML Apps and API Keys only exist in the Twilio Region in which they are defined, and as such  we need to define them for each region we want to support. See [Using the Twilio REST API in a non-US Region](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region#region-specific-authentication-credentials).


### `public/quickstart.js`

In `public\quickstart.js` you may want to update the `queueTimeout` variable.

```javascript
  callQueueButton.onclick = (e) => {
    e.preventDefault();
    var queue = queueInput.value;
    // Max timeout for <Dial><Queue> is 600 seconds
    var queueTimeout = 600;
    makeOutgoingCallToQueue(queue, queueTimeout);
  };
```

Once agent (aka voice client) is dialed into the voice queue, Programmable Voice will wait for a configurable [timeout](https://www.twilio.com/docs/voice/twiml/dial#timeout) (default 30s), before disconnecting. We opted for the maximum timeout of 600s here, but you may want to adjust this value to suit your needs. 

### Twilio Phone Number Regional Configuration
When viewing products via the [Console](https://console.twilio.com/develop/explore), use the arrow to pin the region that you need. This will give you an area in Console exclusively containing that region’s pinned products - allowing you to segregate all things US1 from say IE1. NOTE: This also applies to viewing logs via the Monitor tab.

![Regional product selection in Console](screenshots/regional-voice-products.gif)

For Phone Numbers, by default, your non-US1 regions will show as "Routed to United States (US1)" for the Voice handling. To route to your newly selected region, you need to select each number, ensure the Voice handler endpoint is correct, and then click the Re-Route button. This will tell Twilio to handle all calls to that number via the Twilio Region you have selected.

![Re-route phone number to another region](screenshots/regional-phone-number-reroute.gif)

Refer to [Set a phone number's inbound processing Region using the Console](https://www.twilio.com/docs/global-infrastructure/inbound-processing-console) for more detail. 

All of this can be scripted using the REST APIs too, but bear in mind that everything you do via the REST API needs to use a *regional URL*. See [Using the Twilio REST API in a non-US Region](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)

e.g. `https://api.dublin.ie1.twilio.com/2010-04-01/Accounts/<AccountSid>/Queues`

Refer to [Set a phone number's inbound processing Region using the REST API](https://www.twilio.com/docs/global-infrastructure/inbound-processing-api) for all the details.
## Known Issues & Quirks

* **Joining an Empty Queue in IE1 Fires an Accepted Event**
  * When joining an empty queue in IE1, the `accepted` event is fired - which leads to the timeout countdown logic terminating. In US1, the `accepted` event is not fired until an enqueued call is bridged to the voice client call, and so the timeout countdown logic continues as expected. Functionally, this is not an issue as the calls are still successfully bridged in both regions, but it is a bit confusing.

## Future Enhancements

* **Transfer to Voice Queue**
  * Basic cold transfers could be achieved by executing new `<Dial>` TwiML on the customer call SID. That might be to dial another PSTN number, a SIP address, or another Voice Queue (if transferring internally). All of these would terminate the call with the current voice client.

* **Conference**
  * For 3+ participant calls (e.g. warm transfers) - this could be done also when an enqueued call is bridged to a queued voice client (similar to what Flex/Taskrouter does upon task acceptance). i.e. execute `<Dial><Conference>` on the customer call SID first, then `<Dial>` in the voice client via a new call. 
 


# Original README for Twilio Voice JavaScript SDK Quickstart for Node.js

**Below is the *original* README.md file from the [Twilio Voice JavaScript SDK Quickstart for Node.js repository](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-node). There may be some configuration items that are superceded by the regional configuration items above.**

![](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-node/workflows/Node.js/badge.svg)

> This template is part of Twilio CodeExchange. If you encounter any issues with this code, please open an issue at [github.com/twilio-labs/code-exchange/issues](https://github.com/twilio-labs/code-exchange/issues).

## About

This application should give you a ready-made starting point for writing your own voice apps with Twilio Voice JavaScript SDK 2.0 (Formerly known as Twilio Client). 

This application is built in Node.

Implementations in other languages:

| .NET        | Java        | Python                                                                        | PHP         | Ruby        |
| :---------- | :---------- | :---------------------------------------------------------------------------- | :---------- | :---------- |
| [Done](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-csharp) | [Done](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-java)| [Done](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-python) | [Done](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-php) | [Done](https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-ruby) |

## Set Up

### Requirements

- [Nodejs](https://nodejs.org/) version **14.0** or above.
- [ngrok](https://ngrok.com/download) - this is used to expose your local development server to the internet. For more information, read [this Twilio blog post](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html).
- A WebRTC enabled browser (Google Chrome or Mozilla Firefox are recommended). Edge and Internet Explorer will not work for testing.

### Create a TwiML Application, Purchase a Phone Number, Create an API Key

1. [Create a TwiML Application in the Twilio Console](https://www.twilio.com/console/voice/twiml/apps). Once you create the TwiML Application, click on it in your list of TwiML Apps to find the TwiML App SID. You will need this SID for your `.env` file. **Note:** You will need to configure the Voice "REQUEST URL" in your TwiML App later.

   - For detailed instructions with screenshots, see the [Create a TwiML App.md file](ConsoleHowTos/CreateNewTwiMLApp/CreateNewTwiMLApp.md)
 
2. [Purchase a Voice phone number](https://www.twilio.com/console/phone-numbers/incoming). You will need this phone number in [E.164 format](https://en.wikipedia.org/wiki/E.164) for your `.env` file.
   
   - For detailed instructions with screenshots, see the [Buy a Phone Number.md file](ConsoleHowTos/BuyVoicePhoneNumber/BuyVoicePhoneNumber.md)
   
3. [Create an API Key in the Twilio Console](https://www.twilio.com/console/project/api-keys). Keep the API Key SID and the API Secret in a safe place, since you will need them for your `.env` file. Your API KEY is needed to create an [Access Token](https://www.twilio.com/docs/iam/access-tokens).

   - For detailed instructions with screenshots, see the [Create an API Key.md file](ConsoleHowTos/CreateAPIKey/CreateAPIKey.md)

### Gather Config Values

Before we begin local development, we need to collect all the config values we need to run the application.

| Config Value                           | Description                                                                                                                                                              |
| :------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                   | Your primary Twilio account identifier - find this [in the console here](https://www.twilio.com/console).                                                                |
| `TWILIO_TWIML_APP_SID`                 | The SID of the TwiML App you created in step 1 above. Find the SID [in the console here](https://www.twilio.com/console/voice/twiml/apps).                               |
| `TWILIO_CALLER_ID`                     | Your Twilio phone number in [E.164 format](https://en.wikipedia.org/wiki/E.164) - you can [find your number here](https://www.twilio.com/console/phone-numbers/incoming) |
| `TWILIO_API_KEY` / `TWILIO_API_SECRET` | The `TWILIO_API_KEY` is the API Key SID you created in step 3 above, and the `TWILIO_API_SECRET` is the secret associated with that key.                                 |

### Local development

1. First clone this repository and cd into it:

   ```bash
   git clone https://github.com/TwilioDevEd/voice-javascript-sdk-quickstart-node.git
   cd voice-javascript-sdk-quickstart-node
   ```

2. Create a configuration file for your application by copying the `.env.example` and edit the `.env` file with the configuration values from above.

   ```bash
   cp .env.example .env
   ```

3. Install the dependencies.

   ```bash
   npm install
   ```

4. Copy the `twilio.min.js` file from your `node_modules` to your `public` directory. Run the following from the root directory of your project: 

   ```bash
   cp node_modules/@twilio/voice-sdk/dist/twilio.min.js public
   ```
   **Note:** In order to keep this quickstart as simple as possible, this step is used to avoid any need for build tools like Webpack.

5. Launch local development web server.

   ```bash
   npm start
   ```

6. Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

7. Expose your application to the wider internet using `ngrok`. This step is **crucial** for the app to work as expected.

   ```bash
   ngrok http 3000
   ```

8. `ngrok` will assign a unique URL to your tunnel.
   It might be something like `https://asdf456.ngrok.io`. You will need this to configure your TwiML app in the next step.

9. Configure your TwiML app

   - In the Twilio Console, navigate to [Programmable Voice > TwiML > TwiML Apps](https://www.twilio.com/console/voice/twiml/apps)
   - Select the TwiML App you created earlier
   - On your TwiML App's information page, find the 'Voice Configuration' section.
   - Change the Request URL to your ngrok url with `/voice` appended to the end. (E.g: `https://asdf456.ngrok.io/voice`) **Note:** You **must** use the https URL, otherwise some browsers will block
     microphone access.
   - Click the 'Save' button.

   ![screenshot of TwiML App Voice Configuration](./screenshots/UpdateRequestURL.png)

You should now be ready to make and receive calls from your browser.

## Your Web Application

When you navigate to `localhost:3000`, you should see the web application containing a 'Start up the Device' button. Click this button to initialize a `Twilio.Device`.

![screenshot of web app home page](./screenshots/InitializeDevice.png)

When the `Twilio.Device` is initialized, you will be assigned a random "client name", which will appear in the 'Device Info' column on the left side of the page. This client name is used as the `identity` field when generating an Access Token for the `Twilio.Device`, and is also used to route SDK-to-SDK calls to the correct `Twilio.Device`.

### To make an outbound call to a phone number:

- Under 'Make a Call', enter a phone number in [E.164 format](https://en.wikipedia.org/wiki/E.164) and press the 'Call' button

### To make a browser-to browser call:

Open two browser windows to `localhost:3000` and click 'Start up the Device' button in both windows. You should see a different client name in each window.

Enter one client's name in the other client's 'Make a Call' input and press the 'Call' button.

![screenshot of browser to browser call](./screenshots/BrowserToBrowserCall.png)

### Receiving Incoming Calls from a Non-Browser Device

You will first need to configure your Twilio Voice Phone Number to use the TwiML App we created earlier. This tells Twilio how to handle an incoming call directed to your Twilio Voice Number.

1.  Log in to your [Twilio Console](https://www.twilio.com/console)
2.  Navigate to your [Active Numbers list](https://www.twilio.com/console/phone-numbers/incoming)
3.  Click on the number you purchased earlier
4.  Scroll down to find the 'Voice & Fax' section and look for 'CONFIGURE WITH'
5.  Select 'TwiML' App
6.  Under 'TWIML APP', choose the TwiML App you created earlier.
7.  Click the 'Save' button at the bottom of the browser window.

![screenshot of phone number configuration](./screenshots/ConfigurePhoneNumberWithTwiMLApp.png)

You can now call your Twilio Voice Phone Number from your cell or landline phone.

**Note:** Since this is a quickstart with limited functionality, incoming calls will only be routed to your most recently-created `Twilio.Device`.

### Unknown Audio Devices

If you see "Unknown Audio Output Device 1" in the "Ringtone" or "Speaker" devices lists, click the button below the boxes (Seeing "Unknown" Devices?) to have your browser identify your input and output devices.

### Docker

If you have [Docker](https://www.docker.com/) already installed on your machine, you can use our `docker-compose.yml` to setup your project.

1. Make sure you have the project cloned.
2. Setup the `.env` file as outlined in the [Local Development](#local-development) steps.
3. Run `docker-compose up`.
4. Follow the steps in [Local Development](#local-development) on how to expose your port to Twilio using a tool like [ngrok](https://ngrok.com/) and configure the remaining parts of your application.

### Cloud deployment

In addition to trying out this application locally, you can deploy it to a variety of host services. Heroku is one option, linked below.

Please be aware that some of these services may charge you for the usage and/or might make the source code for this application visible to the public. When in doubt, research the respective hosting service first.

| Service                           |                                                                                     |
| :-------------------------------- | :---------------------------------------------------------------------------------- |
| [Heroku](https://www.heroku.com/) | [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy) |

## Resources

- The CodeExchange repository can be found [here](https://github.com/twilio-labs/code-exchange/).

## Contributing

This template is open source and welcomes contributions. All contributions are subject to our [Code of Conduct](https://github.com/twilio-labs/.github/blob/master/CODE_OF_CONDUCT.md).

## License

[MIT](http://www.opensource.org/licenses/mit-license.html)

## Disclaimer

No warranty expressed or implied. Software is as is.

[twilio]: https://www.twilio.com
