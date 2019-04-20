'use strict';

const AWS = require('aws-sdk')
const kinesis = new AWS.Kinesis();
const chance  = require('chance').Chance();
const streamName = process.env.order_events_stream

module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const restaurantName = JSON.parse(event.body).restaurantName;
  const userEmail = event.requestContext.authorizer.claims.email;
  console.log("====")
  console.log(userEmail)
  console.log("====")
	const orderId = chance.guid();
	console.log(`p1acing arder ID ${orderId} to ${restaurantName} from user ${userEmail} `);

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

  await kinesis.putRecord(putReq, function(err, data) {
            if (err) {
               console.error(err); 
            }
            else {
               console.log(data);  
            }
      }).promise();

	console.log("published 'order_p1aced' event to Kinesis");
  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  };

  return response;
};