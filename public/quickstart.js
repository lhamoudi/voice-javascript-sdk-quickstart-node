$(function () {
  const speakerDevices = document.getElementById("speaker-devices");
  const ringtoneDevices = document.getElementById("ringtone-devices");
  const outputVolumeBar = document.getElementById("output-volume");
  const inputVolumeBar = document.getElementById("input-volume");
  const volumeIndicators = document.getElementById("volume-indicators");
  const callButton = document.getElementById("button-call");
  const callQueueButton = document.getElementById("button-call-queue");
  const callQueueTimer = document.getElementById("queue-timer");
  const callQueueTimerCountdownMessage = document.getElementById(
    "queue-timer-countdown-message"
  );

  //const callOutboundButton = document.getElementById("button-call-outbound");
  const outgoingCallHangupButton = document.getElementById(
    "button-hangup-outgoing"
  );
  const outgoingQueueCallHangupButton = document.getElementById(
    "button-hangup-queue"
  );
  const callControlsDiv = document.getElementById("call-controls");
  const audioSelectionDiv = document.getElementById("output-selection");
  const getAudioDevicesButton = document.getElementById("get-devices");
  const logDiv = document.getElementById("log");
  const incomingCallDiv = document.getElementById("incoming-call");
  const incomingCallHangupButton = document.getElementById(
    "button-hangup-incoming"
  );
  const incomingCallAcceptButton = document.getElementById(
    "button-accept-incoming"
  );
  const incomingCallRejectButton = document.getElementById(
    "button-reject-incoming"
  );
  const phoneNumberInput = document.getElementById("phone-number");
  const queueInput = document.getElementById("queue");
  //  const phoneNumberOutboundInput = document.getElementById(
  //    "phone-number-outbound"
  //  );
  const incomingPhoneNumberEl = document.getElementById("incoming-number");
  const startupButton = document.getElementById("startup-button");

  let device;
  let token;
  //let device2;
  let queueTimer;

  // Event Listeners

  callButton.onclick = (e) => {
    e.preventDefault();
    makeOutgoingCall();
  };

  callQueueButton.onclick = (e) => {
    e.preventDefault();
    var queue = queueInput.value;
    // Max timout for <Dial><Queue> is 600 seconds
    var queueTimeout = 600;
    makeOutgoingCallToQueue(queue, queueTimeout);
  };

  /*
  callOutboundButton.onclick = (e) => {
    e.preventDefault();
    var number = phoneNumberOutboundInput.value;
    makeOutboundCall(number);
  };
*/
  getAudioDevicesButton.onclick = getAudioDevices;
  speakerDevices.addEventListener("change", updateOutputDevice);
  ringtoneDevices.addEventListener("change", updateRingtoneDevice);

  // SETUP STEP 1:
  // Browser client should be started after a user gesture
  // to avoid errors in the browser console re: AudioContext
  startupButton.addEventListener("click", startupClient);

  // SETUP STEP 2: Request an Access Token
  async function startupClient() {
    log("Requesting Access Token...");

    region = document.getElementById("region").value;
    log(`Selected Region - ${region}`);

    try {
      var region = document.getElementById("region");
      const data = await $.getJSON(`/token?region=${region.value}`);
      log(`Got a token. ${data.token}`);
      token = data.token;
      setClientNameUI(data.identity);
      intitializeDevice();
    } catch (err) {
      console.log(err);
      log("An error occurred. See your browser console for more information.");
    }

    // Initialize a second device
    // try {
    //   var region = document.getElementById("region");
    //   const data = await $.getJSON(`/token?region=us1`);
    //   log(`Got a token. ${data.token}`);
    //   token = data.token;
    //   //setClientNameUI(data.identity);
    //   intitializeDevice2();
    // } catch (err) {
    //   console.log(err);
    //   log("An error occurred. See your browser console for more information.");
    // }
  }

  // SETUP STEP 3:
  // Instantiate a new Twilio.Device
  function intitializeDevice() {
    logDiv.classList.remove("hide");
    log("Initializing device");

    if (device) {
      device.destroy();
    }

    // specify edge
    // var edge = region === "us1" ? ['ashburn']: ['dublin'];

    device = new Twilio.Device(token, { edge: ["ashburn"] });

    device.updateOptions({
      debug: true,
      answerOnBridge: true,
      // Set Opus as our preferred codec. Opus generally performs better, requiring less bandwidth and
      // providing better audio quality in restrained network conditions. Opus will be default in 2.0.
      codecPreferences: ["opus", "pcmu"],
      //region: "ie1",
      // edge: ['dublin', 'ashburn']
    });

    addDeviceListeners(device);

    // Device must be registered in order to receive incoming calls
    device.register();
  }

  // function intitializeDevice2() {
  //   log("Initializing device 2");

  //   if(device2) {

  //     device2.destroy();
  //   }

  //   // specify edge
  //   // var edge = region === "us1" ? ['ashburn']: ['dublin'];

  //   device2 = new Twilio.Device(token, {edge: ['ashburn']});

  //   device2.updateOptions( {
  //     debug: true,
  //     answerOnBridge: true,
  //     // Set Opus as our preferred codec. Opus generally performs better, requiring less bandwidth and
  //     // providing better audio quality in restrained network conditions. Opus will be default in 2.0.
  //     codecPreferences: ["opus", "pcmu"],
  //   });

  //   addDeviceListeners(device2);

  //   // Device must be registered in order to receive incoming calls
  //  // device2.register();
  // }

  // SETUP STEP 4:
  // Listen for Twilio.Device states
  function addDeviceListeners(device) {
    device.on("registered", function () {
      log("Twilio.Device Ready to make and receive calls!");
      callControlsDiv.classList.remove("hide");
    });

    device.on("error", function (error) {
      log("Twilio.Device Error: " + error.message);
    });

    device.on("incoming", handleIncomingCall);

    device.audio.on("deviceChange", updateAllAudioDevices.bind(device));

    // Show audio selection UI if it is supported by the browser.
    if (device.audio.isOutputSelectionSupported) {
      audioSelectionDiv.classList.remove("hide");
    }
  }

  // MAKE AN OUTGOING CALL
  async function makeOutgoingCall() {
    var params = {
      // get the phone number to call from the DOM
      To: phoneNumberInput.value,
    };

    if (device) {
      log(`Attempting to call ${params.To} ...`);

      // Twilio.Device.connect() returns a Call object
      const call = await device.connect({ params });

      // add listeners to the Call
      // "accepted" means the call has finished connecting and the state is now "open"
      call.on("accept", updateUIAcceptedOutgoingCall);
      call.on("disconnect", updateUIDisconnectedOutgoingCall);
      call.on("cancel", updateUIDisconnectedOutgoingCall);
      call.on("reject", updateUIDisconnectedOutgoingCall);

      outgoingCallHangupButton.onclick = () => {
        log("Hanging up ...");
        call.disconnect();
      };
    } else {
      log("Unable to make call.");
    }
  }

  /*
  async function makeOutboundCall(phoneNumber) {
      log(`Outbound Call to ${phoneNumber}`);
  
      try {
       // const data = await $.getJSON(`/dialer?number=${phoneNumber}`);

        $.ajax({
          type: 'POST',
          url: '/dial',
          data: JSON.stringify ({phone: phoneNumber}),
          contentType: "application/json",
          dataType: 'json'
      });
      } catch (err) {
        console.log(err);
        log("An error occurred. See your browser console for more information.");
      }
    }
*/

  async function makeOutgoingCallToQueue(queue, queueTimeout) {
    var params = {
      queueName: queue,
      queueTimeout,
    };

    if (device) {
      log(`Attempting to call queue: ${params.queueName} ...`);
      const call = await device.connect({ params });
      updateUIAttemptedOutgoingQueueCall(call, queueTimeout);
      call.on("accept", updateUIAcceptedOutgoingQueueCall);
      call.on("disconnect", updateUIDisconnectedOutgoingQueueCall);
      call.on("cancel", updateUIDisconnectedOutgoingQueueCall);
      call.on("reject", updateUIDisconnectedOutgoingQueueCall);
      outgoingQueueCallHangupButton.onclick = () => {
        log("Hanging up queue call...");
        call.disconnect();
      };
    } else {
      log("Unable to make queue call.");
    }
  }

  function updateUIAcceptedOutgoingCall(call) {
    log("Call in progress ...");
    callButton.disabled = true;
    outgoingCallHangupButton.classList.remove("hide");
    volumeIndicators.classList.remove("hide");
    bindVolumeIndicators(call);
  }

  function updateUIDisconnectedOutgoingCall() {
    log("Call disconnected...");
    callButton.disabled = false;
    outgoingCallHangupButton.classList.add("hide");
    volumeIndicators.classList.add("hide");
  }

  function updateUIAttemptedOutgoingQueueCall(call, queueTimeout) {
    log("Queue call attempted ...");
    callQueueButton.disabled = true;
    queueInput.disabled = true;
    outgoingQueueCallHangupButton.classList.remove("hide");
    outgoingQueueCallHangupButton.innerHTML = "Leave Queue";
    queueTimerCountdown(callQueueTimerCountdownMessage, queueTimeout);
    callQueueTimer.classList.remove("hide");
    volumeIndicators.classList.remove("hide");
    bindVolumeIndicators(call);
  }

  function updateUIAcceptedOutgoingQueueCall(call) {
    log("Queue call in progress ...");
    callQueueButton.disabled = true;
    queueInput.disabled = true;
    outgoingQueueCallHangupButton.classList.remove("hide");
    outgoingQueueCallHangupButton.innerHTML = "Hangup";
    callQueueTimer.classList.add("hide");
    volumeIndicators.classList.remove("hide");
    bindVolumeIndicators(call);
  }

  function updateUIDisconnectedOutgoingQueueCall() {
    log("Queue call disconnected...");
    callQueueButton.disabled = false;
    queueInput.disabled = false;
    outgoingQueueCallHangupButton.classList.add("hide");
    callQueueTimer.classList.add("hide");
    volumeIndicators.classList.add("hide");
  }

  function queueTimerCountdown(element, seconds) {
    var endTime, hours, mins, msLeft, time;

    // Clear any existing timer
    if (queueTimer) {
      clearTimeout(queueTimer);
      queueTimer = null;
    }

    function twoDigits(n) {
      return n <= 9 ? "0" + n : n;
    }

    function updateTimer() {
      msLeft = endTime - +new Date();
      if (msLeft < 1000) {
        element.innerHTML = "Disconnecting!";
      } else {
        time = new Date(msLeft);
        hours = time.getUTCHours();
        mins = time.getUTCMinutes();
        element.innerHTML =
          "Disconnecting in " +
          (hours ? hours + ":" + twoDigits(mins) : mins) +
          ":" +
          twoDigits(time.getUTCSeconds());
        queueTimer = setTimeout(updateTimer, time.getUTCMilliseconds() + 500);
      }
    }

    endTime = +new Date() + 1000 * seconds + 500;
    updateTimer();
  }

  // HANDLE INCOMING CALL

  function handleIncomingCall(call) {
    log(`Incoming call from ${call.parameters.From}`);

    //show incoming call div and incoming phone number
    incomingCallDiv.classList.remove("hide");
    incomingPhoneNumberEl.innerHTML = call.parameters.From;

    //add event listeners for Accept, Reject, and Hangup buttons
    incomingCallAcceptButton.onclick = () => {
      acceptIncomingCall(call);
    };

    incomingCallRejectButton.onclick = () => {
      rejectIncomingCall(call);
    };

    incomingCallHangupButton.onclick = () => {
      hangupIncomingCall(call);
    };

    // add event listener to call object
    call.on("cancel", handleDisconnectedIncomingCall);
    call.on("disconnect", handleDisconnectedIncomingCall);
    call.on("reject", handleDisconnectedIncomingCall);
  }

  // ACCEPT INCOMING CALL

  function acceptIncomingCall(call) {
    call.accept();

    //update UI
    log("Accepted incoming call.");
    incomingCallAcceptButton.classList.add("hide");
    incomingCallRejectButton.classList.add("hide");
    incomingCallHangupButton.classList.remove("hide");
  }

  // REJECT INCOMING CALL

  function rejectIncomingCall(call) {
    call.reject();
    log("Rejected incoming call");
    resetIncomingCallUI();
  }

  // HANG UP INCOMING CALL

  function hangupIncomingCall(call) {
    call.disconnect();
    log("Hanging up incoming call");
    resetIncomingCallUI();
  }

  // HANDLE CANCELLED INCOMING CALL

  function handleDisconnectedIncomingCall() {
    log("Incoming call ended.");
    resetIncomingCallUI();
  }

  // MISC USER INTERFACE

  // Activity log
  function log(message) {
    logDiv.innerHTML += `<p class="log-entry">&gt;&nbsp; ${message} </p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  function setClientNameUI(clientName) {
    var div = document.getElementById("client-name");
    div.innerHTML = `Your client name: <strong>${clientName}</strong>`;
  }

  function resetIncomingCallUI() {
    incomingPhoneNumberEl.innerHTML = "";
    incomingCallAcceptButton.classList.remove("hide");
    incomingCallRejectButton.classList.remove("hide");
    incomingCallHangupButton.classList.add("hide");
    incomingCallDiv.classList.add("hide");
  }

  // AUDIO CONTROLS

  async function getAudioDevices() {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    updateAllAudioDevices.bind(device);
  }

  function updateAllAudioDevices() {
    if (device) {
      updateDevices(speakerDevices, device.audio.speakerDevices.get());
      updateDevices(ringtoneDevices, device.audio.ringtoneDevices.get());
    }
  }

  function updateOutputDevice() {
    const selectedDevices = Array.from(speakerDevices.children)
      .filter((node) => node.selected)
      .map((node) => node.getAttribute("data-id"));

    device.audio.speakerDevices.set(selectedDevices);
  }

  function updateRingtoneDevice() {
    const selectedDevices = Array.from(ringtoneDevices.children)
      .filter((node) => node.selected)
      .map((node) => node.getAttribute("data-id"));

    device.audio.ringtoneDevices.set(selectedDevices);
  }

  function bindVolumeIndicators(call) {
    call.on("volume", function (inputVolume, outputVolume) {
      var inputColor = "red";
      if (inputVolume < 0.5) {
        inputColor = "green";
      } else if (inputVolume < 0.75) {
        inputColor = "yellow";
      }

      inputVolumeBar.style.width = Math.floor(inputVolume * 300) + "px";
      inputVolumeBar.style.background = inputColor;

      var outputColor = "red";
      if (outputVolume < 0.5) {
        outputColor = "green";
      } else if (outputVolume < 0.75) {
        outputColor = "yellow";
      }

      outputVolumeBar.style.width = Math.floor(outputVolume * 300) + "px";
      outputVolumeBar.style.background = outputColor;
    });
  }

  // Update the available ringtone and speaker devices
  function updateDevices(selectEl, selectedDevices) {
    selectEl.innerHTML = "";

    device.audio.availableOutputDevices.forEach(function (device, id) {
      var isActive = selectedDevices.size === 0 && id === "default";
      selectedDevices.forEach(function (device) {
        if (device.deviceId === id) {
          isActive = true;
        }
      });

      var option = document.createElement("option");
      option.label = device.label;
      option.setAttribute("data-id", id);
      if (isActive) {
        option.setAttribute("selected", "selected");
      }
      selectEl.appendChild(option);
    });
  }
});
