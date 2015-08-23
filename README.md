# Tangents-Community-Edition

A dynamic topic based messaging app where if you are in an instant messaging conversation with one or more people, and you start going on a tangent, that tangent gets automatically split off and relevant people of interest are invited to join that tangent conversation.

API's: Respoke (for instant messaging), IBM Bluemix (for backend) and Watson (for NLP stuff), HP Haven OnDemand (for NLP stuff)

Link to app prototype/demo on Bluemix: http://tangents-angelhack.mybluemix.net

Link to app submission page on Hackathon.io: http://www.hackathon.io/tangents

## Setup

First, type this into the command line to install node modules

    cd Tangents-Community-Edition
    npm install

Copy the config.template.js to config.js:

    cp config.template.js config.js

Edit config.js so that it applies to your setup. Then, start the server using the command

    npm start
