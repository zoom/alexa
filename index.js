var https = require('https');
    jwt = require('jsonwebtoken');
    request = require('request');
    syncrequest = require('sync-request');
    bodyParser = require('body-parser');
    Alexa = require("alexa-sdk");
    SKILL_NAME = "ZOOM"
    APP_ID = "amzn1.ask.skill.xxxxx";

var params = {
  meetingId: 0,
  meetingPin: 0
};

var endpoint = {
    hostname: 'zoom.us',
    path: {
        rooms: '/api/v2/rooms/zrlist',
	meeting: '/api/v2/rooms/meetings'
    }
};

// use this ZR name to locate the ZR and start the meeting 
// used for demo purposes 
var my_zr = "xxxxx";

// The following is used to generate a JWT for Zoom v2 API
var zoom_api_key = "xxxxx";
var zoom_api_sec = "xxxx";
var payload = {
	iss: zoom_api_key,
	exp: ((new Date()).getTime() + 25000)
};

var token = jwt.sign(payload, zoom_api_sec);

// Register event handlers 
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
}

// Define intent functions
var handlers = {
  'LaunchRequest': function() {
    var speechOutput = "Welcome to zoom";
    this.emit(":tellWithCard", speechOutput, SKILL_NAME);
  },

// use this to process scheduling a meeting on ZR
  'schedule': function() {
  },

// use this function to join a scheduled meeting
  'join': function() {
    console.log("#Log:", this.event.request.intent);
    switch(this.event.request.intent.dialogState) {
	case "STARTED":
    		console.log("intent started ");
  		break;
	case "COMPLETED":
    		console.log("intent completed");
		break;
	default:
    		console.log("intent not completed");
   		break;
    }
    console.log("Join function called");
    //this.emit(":ask", speechOutput, reprompt);
  },

// use this function to start an instant meeting on the ZR
  'start': function() {
     var speechOutput = "Launching a new meeting";
     var found = 0;
     console.log("start function called");

     // Let's get the list of Zoom Rooms in my account
     var zr_getrooms = "https://api.zoom.us/v2/rooms/zrlist?access_token=" + token;
     var option = {
        qs: {access_token: token},
        json: {method: "list"},
     };

     // Do not use blocking calls like syncrequesst in production - use async instead
     var syncres = syncrequest('POST', zr_getrooms, option);
     var response=JSON.parse(syncres.getBody('utf8'));
     for (var i in response.result.data) {
	if (response.result.data[i].zr_name == my_zr) {
  	    //console.log("data =", response.result.data[i]);
	    zr_id = response.result.data[i].zr_id;
	    console.log("Found ZR = ", my_zr);
	    // call join meeting with the zr id 
	    option.json.method = "join";
	    console.log("options: ", option);
	    var zr_join = "https://api.zoom.us/v2/rooms/" + zr_id + "/meetings";
	    var syncres = syncrequest('POST', zr_join, option);
	    console.log("ZR meeting launched");
	    found = true;
	}
     }

    if (!found) {
	console.log("Could not locate ZR = ", my_zr);
	speechOutput = "Sorry, I cannot locate your Zoom Room";       
    }
     this.emit(":tell", speechOutput);

  },

   // use this to end a meeting in the ZR
  'end': function() {


  },

  'AMAZON.HelpIntent': function() {
    var speechOutput;
    var reprompt;

    if (params.meetingId === 0) {
       speechOutput = "You say id is";
       reprompt = "Can not get meeting id, You say id is";
    } else if (params.meetingPin === 0) {
       speechOutput = "You say pin is";
       reprompt = "Can not get meeting pin, You say pin is";
    } else {
      speechOutput = `Meeting id is ${params.meetingId} and meeting pin is ${params.meetingPin}` ;
    }
    console.log(`meetingId: ${params.meetingId} meetingPin: ${params.meetingPin}`);
    this.emit(":ask", speechOutput, reprompt);
  },
  'AMAZON.StopIntent': function() {
     this.emit(":tell", "Goodbye");
  },
  'AMAZON.CancelIntent': function() {
     this.emit(":tell", "Goodbye");
  }
};
