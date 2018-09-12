const request = require('request');
const config = require('./config.json');
const jsdom = require('jsdom');
const moment = require('moment');
const ics = require('ics');

moment.locale("nl");

function getCSRF(callback) {
  var cjar = request.jar();
  request.get({
    url: config.rooster.baseUrl,
    jar: cjar
  }, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      const dom = new jsdom.JSDOM(body);
      const $ = (require('jquery'))(dom.window);
      callback($("input[name=csrf]").val(), cjar);
    } else {
      throw err;
    }
  });
}

function getSchedule(username, password, week, csrf, cjar, callback) {
  request.post({
    url: config.rooster.baseUrl,
    jar: cjar,
    form: {
      csrf: csrf,
      user: username,
      paswoord: password,
      login: "loginform",
      weeknummer: week
    }
  }, function (err, res, body) {
    console.log(body);
    callback(body);
  });
}

function scheduleToICS(data, callback) {
  const dom = new jsdom.JSDOM(data);
  const $ = (require('jquery'))(dom.window);
  var weeknum = $("option[selected='selected']").val();
  var events = [];
  $(".container").each(function (i) {
    var curevent = $(this).attr("id").substring(3).split(",");
    var curnobr = $(this).find(".nobr").html().split("<br>");
    var event = {
      start: moment()
        .day(curevent[3])
        .week(weeknum)
        .startOf("day")
        .hour(curevent[0].split(":")[0])
        .minute(curevent[0].split(":")[1])
        .format('YYYY-M-D-H-m').split("-"),
      end: moment()
        .day(curevent[3])
        .week(weeknum)
        .startOf("day")
        .hour(curevent[1].split(":")[0])
        .minute(curevent[1].split(":")[1])
        .format('YYYY-M-D-H-m').split("-"),
      title: curnobr[1],
      description: curnobr[1] + " door " + curnobr[0] + " in " + curnobr[2],
      location: curnobr[2],
      alarms: [{
        action: 'display',
        trigger: {
          minutes: 5,
          before: true
        }
      }]
    }
    events[events.length] = event;
  });
  console.log(events);
  ics.createEvents(events, function (err, output) {
    if (!err) {
      console.log(output);
      callback(output);
    } else {
      console.error(err);
      throw err;
    }
  });
}

  module.exports.getCSRF = getCSRF;
  module.exports.getSchedule = getSchedule;
  module.exports.scheduleToICS = scheduleToICS;

  // console.log(cookieJar.getCookieString(config.rooster.baseUrl));