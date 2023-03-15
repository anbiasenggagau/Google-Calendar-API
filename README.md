# Google Calendar API Event

This an example of Google Calendar API, using [NodeJS](https://nodejs.org/). There are two section of this app would do, first managing CRUD data of activity you want to store at your database and second managing CRUD data of events in you Google Calendar that correspond with this API, so you don't have to worry if you accidently delete or alter you Google Calendar Event that is not created from this API.

## Instalation
This API requires [NodeJS](https://nodejs.org/) v14+ , [MongoDB](https://www.mongodb.com/) Database and [Redis](https://redis.io/) to run.
> Note: Don't forget to manually run your Redis client

#### Setting Up Google API
Firstly, before using this app, you must configure the OAuth Client ID for using Google API. Go to [Google Developers](https://console.cloud.google.com/apis), and create new project. After you've created a project, on left side bar, create OAuth Consent Screen, just fill all the mandatory fields and leave all optional fields, please make sure you click "PUBLISH APP" button after OAuth Consent Screen created. After that, go to credentials tab and click "CREATE CREDENTIALS" button on top of your screen to create OAuth Client ID. Make sure to add URL of `http://localhost:3000/api/v1/google/check` on Authorised redirect URIs section. Get the Client ID value and Client Secret value to .env file which will be on the next section.

### Running on local machine

Make sure you create .env file that contain theese environment variables:
```
PORT=3000
MONGO_PORT=27017
MONGO_IP=localhost
MONGO_DATABASE=google-calendar-api
ACCESS_TOKEN=supersecret
COOKIE_SECRET=supersecret
REDIS_URL=localhost
REDIS_PORT=6379
CLIENT_ID=xyz
CLIENT_SECRET=xyz
```
After setting up all the environment variables, on command prompt, you can execute theese code to run the app
```
npm i
npm run start
```

You also could access the example request using Postman. You can access the file in directory named "Postman Request" and import the files to your local Postman. I encourage you to use Postman to get better understanding.

> Note: Upon accessing API that manage CRUD of Google Calendar Event, you will get response that you need to authenticate your google account first for using the API. The response will also tell which URL to use to authenticate, or you also could directly go to this URL `http://localhost:3000/api/v1/google/login`.

### Running on docker container
If you wish to run this application via docker container, I already create a docker compose file so you could immediately start the app. Same as running at local machine, you must set some environment variables before running the containers. I already create the template that you would use for your environment variables. Don't forget to pass you Client ID API and Client Secret API within environment variables of docker compose file.

After setting up all the environment variables, on command prompt, you can execute theese code to run the app
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

You also could access the example request using Postman. You can access the file in directory named "Postman Request" and import the files to your local Postman. I encourage you to use Postman to get better understanding.

> Note: Upon accessing API that manage CRUD of Google Calendar Event, you will get response that you need to authenticate your google account first for using the API. The response will also tell which URL to use to authenticate, or you also could directly go to this URL `http://localhost:3000/api/v1/google/login`.

Run this command if you want to terminate and delete the containers
```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

## Between 2 Folders Postman Requests
You'll notice there are 2 folders within Postman Request you've imported. First is Local Activity and second Google Events. When you execute API route of local activity, it'll we only stored in your Mongo Database, while execute API route of Google Events, it will be stored both in Google Calendar and your Mongo Database, 1 thing to note there is 1 additional properties of `eventId` in your document within Mongo Database, which reffering the events in your Google Calendar that have been created using this API. Another thing is you could passing opptional properties of `attendances` within request body to decide which email account you want to invite.

## Error/Bug Discoveries
Find some errors or bugs while running the app? You can contribute by telling me what the errors and bugs are, or you could straight up make a pull request on this repository.
