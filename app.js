/*jshint node:true*/

var config = require('./config.js');

var path = require('path');
var express = require('express');
var session = require('express-session');

var Respoke = require('respoke-admin');
var admin = new Respoke({
	// from the Respoke developer console under one of your apps
	appId: config.respoke.appId,
	'App-Secret': config.respoke.appSecret
});

var iod = require('iod-node');
var iodclient = new iod.IODClient('https://api.idolondemand.com', config.iod.apikey);

var AlchemyAPI = require('./alchemyapi'); 
var alchemyapi = new AlchemyAPI(config.alchemyapi.apikey);

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// support user sessions
app.use(session({
	"secret": config.session.secret,
	"unset": "destroy",
	"cookie": {},
	"resave": false,
	"saveUninitialized": false
}));

// database
var loggedInUsers = {};
var openedRooms = {};
var userOpened = {};

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// serve dynamic pages using views in ./views and the ejs templating engine
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs'); 

// Homepage
app.get('/', function (req, res) {
	res.setHeader('Cache-Control', 'cache-control: private, max-age=0, no-cache');
	
	var data = { 
		user: req.user,
		session: req.session,
		error: null
	};
	
	if (req.query.nickname) {
		if (!req.session.nickname) {
			if (req.query.nickname in loggedInUsers && req.query.nickname.toUpperCase() === "__SYSTEM__") {
				data["error"] = "Someone else has that nickname; please choose another.";
			} else {
				req.session.nickname = req.query.nickname;
				loggedInUsers[req.query.nickname] = true;
				userOpened[req.query.nickname] = {};
			}
		} else if (req.session.nickname !== req.query.nickname) {
			return res.redirect("/logout");
		}
	}

	if (req.session.nickname) {
		admin.auth.endpoint({
			endpointId: req.session.nickname,
			roleId: config.respoke.userRoleId
		}, function (err, authData) {
			if (err) { console.error(err); return; }
			data["token"] = authData.tokenId;
			data["rooms"] = openedRooms;
			data["userOpened"] = userOpened[req.session.nickname];
			return res.render('interface', data);
		});
	} else { 
		return res.render('login', data); 
	}
});

// Logout
app.get('/logout', function (req, res) {
	if (req.session.nickname) {
		delete loggedInUsers[req.session.nickname];
		req.session.destroy();
	}
	return res.redirect("/");
});

app.get('/roomtrack', function (req, res) {
	res.setHeader('Cache-Control', 'cache-control: private, max-age=0, no-cache');

	if (!req.session.nickname || !req.query.id) {
		res.redirect("/");
	}

	if (!(req.query.id in openedRooms)) {
		openedRooms[req.query.id] = { history: [], topicLog: [] };
		admin.groups.join({ groupId: req.query.id }, function () {
			console.log("Created chatroom", req.query.id);
		});
		
		for (var endpointId in loggedInUsers) {
			admin.messages.send({
				to: endpointId,
				endpointId: admin.endpointId,
				message: JSON.stringify({
					rel: "new-room",
					data: req.query.id
				})
			});
		}
	}

	console.log("User", req.session.nickname, "is connecting to", req.query.id);
	admin.messages.send({
		to: req.session.nickname,
		endpointId: admin.endpointId,
		message: JSON.stringify({
			rel: "user-opened-room",
			data: req.query.id
		})
	});

	if (!(req.query.id in userOpened[req.session.nickname])) {
		userOpened[req.session.nickname][req.query.id] = true;
	}
	
	return res.end();
});

admin.on('join', function (message) {
	if (message.header.from === "__SYSTEM__") return;
	RecomputeTopicRankings(message.header.groupId);
});

admin.on('message', function (message) {
	console.log('onMessage', message);
});

admin.on('error', function (message) {
	console.log('onError', message);
});

admin.on('pubsub', function (message) {
	if (message.header.from === "__SYSTEM__") return;
	console.log('new message', message);
	AjaxCallTaxonomy(message.header.groupId, message.message);
	AjaxCallConceptExtraction(message.header.groupId, message.message);
});

function RecomputeTopicRankings(roomId) {
	var topicLog = openedRooms[roomId].topicLog;
    while (topicLog.length > 20) {
        topicLog.shift();
    }

    var topicFrequencies = {}, i, j;
    for (i = 0; i < topicLog.length; i++) {
        for (j = 0; j < topicLog[i].length; j++) {
            if (!(topicLog[i][j] in topicFrequencies)) {
                topicFrequencies[topicLog[i][j]] = 0;
            }
            topicFrequencies[topicLog[i][j]]++;
        }
    }

    var sortable = [];
    for (var topic in topicFrequencies) {
        sortable.push([topic, topicFrequencies[topic]]);
    }
    sortable.sort(function (a, b) {
        return b[1] - a[1];
    });
    
	admin.groups.publish({
		groupId: roomId,
		message: JSON.stringify({
			rel: "room-topics",
			data: sortable
		})
	});
}

function AjaxCallConceptExtraction(roomId, userText){
    //var userText = "how does Amazon's elastic service do load balancing?";
	var topicLog = openedRooms[roomId].topicLog;
	iodclient.call('extractconcepts', { text: userText }, function (err, resp, output) {
        var crappyWords = ['does', 'was', 'is', 'are', 'were', 'be', 'am', 'do'];

        var goodLabels = [], i, j;
        for (i = 0; i < crappyWords.length;i++) {
            for (j = 0; j < output.concepts.length; j++){
                if (output.concepts[j].concept.indexOf(crappyWords[i]) != -1){
                    continue;
                }
                else {
                    if (goodLabels.indexOf(output.concepts[j].concept) == -1){
                        goodLabels.push(output.concepts[j].concept);
                    }
                }
            }
        }
        
        topicLog.push(goodLabels);
        RecomputeTopicRankings(roomId);
	});
}

function AjaxCallTaxonomy(roomId, userText) {
	var topicLog = openedRooms[roomId].topicLog;
	alchemyapi.taxonomy('text', userText, {}, function (output) { 
        var numberOfLabels = output.taxonomy.length;
        
        var goodLabels = [], i;
        for (i = 0; i < numberOfLabels; i++){
            if (output.taxonomy[i].score >= 0.2) {
                if (output.taxonomy[i].label.indexOf('/') != -1){
                    var res = output.taxonomy[i].label.split("/");
                    if (res.length > 2 ){
                        goodLabels.push(res[2]);
                    } else {
                        goodLabels.push(res[1]);
                    }
                } else{
                    goodLabels.push(output.taxonomy[i].label);
                }
            }
        }

		topicLog.push(goodLabels);
        RecomputeTopicRankings(roomId);
	});
}


// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

admin.auth.connect({ endpointId: "__SYSTEM__" });
admin.on('connect', function () {
	console.log('__SYSTEM__ is connected to respoke');
});
