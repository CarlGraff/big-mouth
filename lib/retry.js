'use strict';

const co         = require('co');
const AWSXray    = require('aws-xray-sdk');
const AWS        = AWSXray.captureAWS(require('aws-sdk'));
const sns        = new AWS.SNS();
const cloudwatch = require('./cloudwatch');

const restaurantRetryTopicArn = process.env.restaurant_notification_retry_topic;

const retryRestaurantNotification = async (order) => {
  const pubReq = {
    Message: JSON.stringify(order),
    TopicArn: restaurantRetryTopicArn
  };
  //await sns.publish(pubReq).promise();
  await cloudwatch.trackExecTime(
    "SnsPublishLatency",
    () => sns.publish(pubReq).promise()
  );

  console.log(`order [${order.orderId}]: queued restaurant notification for retry`);
  cloudwatch.incrCount("NotifyRestaurantQueued");
};

module.exports = {
  restaurantNotification: retryRestaurantNotification
};