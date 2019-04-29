'use strict';

const notify = require('../lib/notify');
const middy = require('middy');
const sampleLogging = require('../middleware/sample-logging');
const flushMetrics = require('../middleware/flush-metrics');

const handler = async (event, context) => {
  const order = JSON.parse(event.Records[0].Sns.Message);
  order.retried = true;

  try {
    await notify.restaurantOfOrder(order);
    return "all done";
  } catch (err) {
    return err;
  }
};

module.exports.handler = middy(handler)
  .use(sampleLogging({ sampleRate: 0.2 }))
  .use(flushMetrics)
