const { promisify } = require('util')
const awscred = require('awscred')

let initialized = false

const init = async () => {
  if (initialized) {
    return
  }

  process.env.TEST_ROOT            = "https://57q1hvww24.execute-api.us-east-1.amazonaws.com/dev"
  process.env.restaurants_api      = "https://57q1hvww24.execute-api.us-east-1.amazonaws.com/dev/restaurants"
  process.env.restaurants_table    = "restaurants"
  process.env.AWS_REGION           = "us-east-1"
  process.env.cognito_user_pool_id = "us-east-1_TNFobaoDl"
  process.env.cognito_client_id    = "test_cognito_client_id"
  process.env.cognito_server_client_id = "1kdhn284frj5okpubeh9asbmg73v"
  
  const { credentials } = await promisify(awscred.load)()
  
  process.env.AWS_ACCESS_KEY_ID     = credentials.accessKeyId
  process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey

  if (credentials.sessionToken) {
    process.env.AWS_SESSION_TOKEN = credentials.sessionToken
  }

  console.log('AWS credential loaded')

  initialized = true
}

module.exports = {
  init
}