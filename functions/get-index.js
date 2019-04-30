const co            = require("co");
const Promise       = require("bluebird");
const fs            = require("fs")
const Mustache      = require('mustache')
const http          = require('superagent-promise')(require('superagent'), Promise)
const aws4          = require('aws4')
const URL           = require('url')
const log           = require('../lib/log')
const cloudwatch    = require('../lib/cloudwatch')
const middy         = require('middy')
const sampleLogging = require('../middleware/sample-logging')
const AWSXRay       = require('aws-xray-sdk');

const restaurantsApiRoot = process.env.restaurants_api
const ordersApiRoot = process.env.orders_api
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const awsRegion = process.env.AWS_REGION
const cognitoUserPoolId = process.env.cognito_user_pool_id
const cognitoClientId = process.env.cognito_client_id

let html

function loadHtml () {
  if (!html) {
    //console.log('loading index.html...')
    html = fs.readFileSync('static/index.html', 'utf-8')
    //console.log('loaded')
  }
  
  return html
}

const getRestaurants = async () => {
  const url = URL.parse(restaurantsApiRoot)
  const opts = {
    host: url.hostname, 
    path: url.pathname
  }

  aws4.sign(opts)

  const httpReq = http
    .get(restaurantsApiRoot)
    .set('Host', opts.headers['Host'])
    .set('X-Amz-Date', opts.headers['X-Amz-Date'])
    .set('Authorization', opts.headers['Authorization'])
    
  if (opts.headers['X-Amz-Security-Token']) {
    httpReq.set('X-Amz-Security-Token', opts.headers['X-Amz-Security-Token'])
  }

  //return (await httpReq).body

  return new Promise((resolve, reject) => {
    let f = co.wrap(function*(subsegment) {
      subsegment.addMetadata('url', restaurantsApiRoot);
      
      try {
        let body = (yield httpReq).body;
        subsegment.close();
        resolve(body);
      } catch (err) {
        subsegment.close(err);
        reject(err);
      }
    });
    let segment = AWSXRay.getSegment();
    AWSXRay.captureAsyncFunc("getting restaurant", f, segment);
  });

}

const handler = async (event, context) => {
  const template = loadHtml()
  log.debug('loaded HTML template')

  //const restaurants = await getRestaurants()
  const restaurants = await cloudwatch.trackExecTime(
    "GetRestaurantsLatency",
    () => getRestaurants()
  );

  log.debug(`loaded ${restaurants.length} restaurants`)
  const dayOfWeek = days[new Date().getDay()]
  const view = { 
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    dayOfWeek, 
    restaurants,
    searchUrl: `${restaurantsApiRoot}/search`,
    placeOrderUrl: `${ordersApiRoot}`
  }
  const html = Mustache.render(template, view)
  log.debug(`debug generated ${html.length} bytes`)
  log.info(`info generated ${html.length} bytes`)

  cloudwatch.incrCount("RestaurantsReturned", restaurants.length);

  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8'
    },
    body: html
  }

  return response
}

module.exports.handler = middy(handler)
  .use(sampleLogging({ sampleRate: 0.2 }));