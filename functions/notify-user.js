'use strict';

const _          = require('lodash');
const getRecords = require('../lib/kinesis').getRecords;
const AWSXray    = require('aws-xray-sdk');
const AWS        = AWSXray.captureAWS(require('aws-sdk'));
const kinesis    = new AWS.Kinesis();
const sns        = new AWS.SNS();
const streamName = process.env.order_events_stream;
const topicArn   = process.env.user_notification_topic;

module.exports.handler = async (event, context) => {
  const records = getRecords(event);
  const orderAccepted = records.filter(r => r.eventType === 'order_accepted');

  for (const order of orderAccepted) {
    const snsReq = {
      Message: JSON.stringify(order),
      TopicArn: topicArn
    };
    await sns.publish(snsReq).promise();
    console.log(`notified user [${order.userEmail}] of order [${order.orderId}] being accepted`);

    const data = _.clone(order);
    data.eventType = 'user_notified';

    const kinesisReq = {
      Data: JSON.stringify(data), // the SDK would base64 encode this for us
      PartitionKey: order.orderId,
      StreamName: streamName
    };
    await kinesis.putRecord(kinesisReq).promise();
    console.log(`published 'user_notified' event to Kinesis`);
  }
  
  return 'all done';
};