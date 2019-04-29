const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB.DocumentClient()
const log = require('../lib/log')
const cloudwatch = require('../lib/cloudwatch')

const defaultResults = process.env.defaultResults || 8
const tableName = process.env.restaurants_table

const getRestaurants = async (count) => {
  const req = {
    TableName: tableName,
    Limit: count
  }

  //const resp = await dynamodb.scan(req).promise()
  const resp = await cloudwatch.trackExecTime(
    "DynamoDBScanLatency",
    () => dynamodb.scan(req).promise()
  );

  log.debug(`fetched ${resp.Items.length} restaurants`)
  return resp.Items
}

module.exports.handler = async (event, context) => {
  const restaurants = await getRestaurants(defaultResults)

  cloudwatch.incrCount("RestaurantsReturned", restaurants.length)

  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  return response
}