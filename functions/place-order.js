'use strict';

const AWS = require('aws-sdk')
const kinesis = new AWS.Kinesis();
const chance  = require('chance').Chance();
const streamName = process.env.order_events_stream
const log = require('../lib/log')


module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  log.debug('reauest body us a valid JSON', { requestBody: event.body });
  const restaurantName = JSON.parse(event.body).restaurantName;
  const userEmail = event.requestContext.authorizer.claims.email;
	const orderId = chance.guid(); 
	log.debug(`p1acing order...`, { orderId, restaurantName, userEmail });

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: 'order_placed'
  };

  const putReq = {
    Data: JSON.stringify(data),
    PartitionKey: orderId,
    StreamName: streamName
  };
  //console.log(putReq)
  await kinesis.putRecord(putReq, function(err, data) {
            if (err) {
               console.log(err); 
            }
            else {
               console.log(data);  
            }
      }).promise();

	log.debug("published event to Kinesis", { eventName: 'order_placed' });
  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  };

  return response;
};