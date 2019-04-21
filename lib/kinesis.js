'use strict';

function parsePayload(record) {
  let json = new Buffer(record.kinesis.data, 'base64').toString('utf8');
  console.log(json)
  return JSON.parse(json);
}

function getRecords(event) {
  return event.Records.map(parsePayload);
}

module.exports = {
  getRecords
};