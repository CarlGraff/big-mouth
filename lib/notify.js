'use strict';

const _                  = require('lodash');
const AWSXray            = require('aws-xray-sdk');
const AWS                = AWSXray.captureAWS(require('aws-sdk'));
const kinesis            = new AWS.Kinesis();
const sns                = new AWS.SNS();
const streamName         = process.env.order_events_stream;
const restaurantTopicArn = process.env.restaurant_notification_topic;
const chance             = require('chance').Chance();
const cloudwatch         = require('./cloudwatch');

const notifyRestaurantOfOrder = async (order) => {
  try {
    if (chance.bool({likelihood: 50})) { // 50% chance of failure
      console.log('thew boom error - should go to dlq?');
      throw new Error('boom');
    }

    const pubReq = {
      Message: JSON.stringify(order),
      TopicArn: restaurantTopicArn
    };
    
    //await sns.publish(pubReq).promise();
    await cloudwatch.trackExecTime(
      "SnsPublishLatency",
      () => sns.publish(pubReq).promise()
    );

    console.log(`notified restaurant [${order.restaurantName}] of order [${order.orderId}]`);

    const data = _.clone(order);
    data.eventType = 'restaurant_notified';
    
    const putRecordReq = {
      Data: JSON.stringify(data),
      PartitionKey: order.orderId,
      StreamName: streamName
    };
    //await kinesis.putRecord(putRecordReq).promise();
    await cloudwatch.trackExecTime(
      "KinesisPutRecordLatency",
      () => kinesis.putRecord(putRecordReq).promise()
    );

    console.log(`published 'restaurant_notified' event to Kinesis`);

    cloudwatch.incrCount("NotifyRestaurantSuccess");
  } catch (err) {
    cloudwatch.incrCount("NotifyRestaurantFailed");
    throw err;
  }
};

module.exports = {
  restaurantOfOrder: notifyRestaurantOfOrder
};