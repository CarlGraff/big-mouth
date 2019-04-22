'use strict';

const getRecords = require('../lib/kinesis').getRecords;
const notify = require('../lib/notify');
const retry = require('../lib/retry');

module.exports.handler = async (event, context) => {
  const records = getRecords(event);
  const orderPlaced = records.filter(r => r.eventType === 'order_placed');

  for (const order of orderPlaced) {
    try {
      await notify.restaurantOfOrder(order);
    } catch (err) {
      await retry.restaurantNotification(order);
    }
  }

  return 'all done';
};