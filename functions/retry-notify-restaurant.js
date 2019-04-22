'use strict';

const notify = require('../lib/notify');

module.exports.handler = async (event, context) => {
  const order = JSON.parse(event.Records[0].Sns.Message);
  order.retried = true;

  try {
    await notify.restaurantOfOrder(order);
    return "all done";
  } catch (err) {
    return err;
  }
};