const express = require("express")
const session = require("express-session")
const redis = require("redis")
const mongoose = require("mongoose")
const {
  MONGO_INITDB_ROOT_USERNAME,
  MONGO_INITDB_ROOT_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  MONGO_DATABASE,
  COOKIE_SECRET,
} = require("./config/config")
const activitiesRouter = require('./router/activitiesRouter')
const authRouter = require('./router/authRouter')
const gapiRouter = require('./router/gapiRouter')
const app = express()

function loopConnect() {
  let connectionString = `mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/${MONGO_DATABASE}?authSource=admin`
  if (MONGO_IP === 'localhost') connectionString = `mongodb://127.0.0.1:27017/${MONGO_DATABASE}`
  mongoose
    .connect(connectionString)
    .then(() => console.log("Connected to database"))
    .catch((e) => {
      console.log(e.message)
      console.log("Trying to reconnect...")
      setTimeout(loopConnect, 5000)
    })
}

let RedisStore = require("connect-redis")(session)
let redisClient = redis.createClient({
  url: `redis://:@${REDIS_URL}:${REDIS_PORT}`,
  legacyMode: true,
})
redisClient.connect().then(() => {
  console.log("Connected to Redis")
})

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      resave: false,
      maxAge: 20000000,
    },
  })
)

mongoose.set("strictQuery", true)
loopConnect()

const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/v1', activitiesRouter)
app.use('/api/v1', authRouter)
app.use('/api/v1', gapiRouter)

app.listen(port, () => {
  console.log(`I'm listening to port ${port}`)
})

module.exports = redisClient
