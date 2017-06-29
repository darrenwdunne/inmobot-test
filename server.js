// Create a new feature in JIRA via a conversation with inMoBot
// Author: Darren Dunne

// TODO: update .env and bot.yml and var on beepboop with real component ownerid
// TODO: deal value
// TODO: set Originator (or Watcher, if Assignee not possible/practical)
// TODO: it's creating a Task in the DWD project - what about CLW?
// TODO: throw early error if .env isn't setup correctly

'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
require('dotenv').config() // uid/pw go in .env file not checked in

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})

require('./flows')(slapp) // imports everything in the flows directory

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})

