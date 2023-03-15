const express = require("express")
const router = express.Router()
const Activities = require("../model/events")
const { google } = require('googleapis')
const { OAuth2 } = google.auth
const redis = require("redis")
const {
    REDIS_URL,
    REDIS_PORT,
    CLIENT_ID,
    CLIENT_SECRET,
} = require("../config/config")
const { default: isEmail } = require("validator/lib/isEmail")

let redisClient = redis.createClient({
    url: `redis://:@${REDIS_URL}:${REDIS_PORT}`,
})
redisClient.connect()

const client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3000/api/v1/google/check'
)

const scope = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

const url = client.generateAuthUrl({ access_type: 'offline', scope })

let calendarId

router.get('/google/login', async (req, res) => {
    return res.redirect(url)
})

router.get('/google/check', async (req, res) => {

    const { code } = req.query
    let { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    await redisClient.set('access_token', JSON.stringify(tokens))

    const calendar = google.calendar({ version: 'v3', auth: client })
    calendarId = await calendar.calendarList.list()
    calendarId = calendarId.data.items[0].id

    res.status(200).json({
        status: 'Success',
        message: 'Successfully login, you may access the API now'
    })
})

router.get('/google/calendar', async (req, res) => {
    try {
        let tokens = await redisClient.get('access_token')
        tokens = JSON.parse(tokens)
        client.setCredentials(tokens)

        const calendar = google.calendar({ version: 'v3', auth: client })
        const result = await calendar.calendarList.list()
        calendarId = result.data.items[0].id
        console.log(result.data.items)

        res.status(200).json({
            status: 'Success',
            data: result.data
        })
    } catch (error) {
        let url = req.protocol + '://' + req.get('host') + '/api/v1/google/login'

        return res.status(400).json({
            status: 'Bad Request',
            message: error.message + ' Please login first to ' + url
        })
    }
})

router.get('/google/events', async (req, res) => {
    try {
        let finalData = []
        let tokens = await redisClient.get('access_token')
        tokens = JSON.parse(tokens)
        client.setCredentials(tokens)

        const calendar = google.calendar({ version: 'v3', auth: client })
        let result = await calendar.events.list({ calendarId, timeZone: 'Asia/Jakarta' })

        let activities = await Activities.find({ eventId: { "$ne": undefined } })

        activities.forEach(value => {
            value = createStatusActivity(value)
            finalData.push(value)
        })

        return res.status(200).json({
            status: 'Success',
            data: {
                event: result.data.items,
                activity: finalData
            }
        })
    } catch (error) {
        let url = req.protocol + '://' + req.get('host') + '/api/v1/google/login'

        return res.status(400).json({
            status: 'Bad Request',
            message: error.message + ' Please login first to ' + url
        })
    }
})

router.get('/google/events/:id', async (req, res) => {
    try {
        const { id } = req.params
        let activity = await Activities.findById(id)

        if (activity === null) return res.status(404).json({
            status: 'Not Found',
            message: 'Cannot find the id of activity'
        })

        activity = createStatusActivity(activity)

        let tokens = await redisClient.get('access_token')
        tokens = JSON.parse(tokens)
        client.setCredentials(tokens)

        const calendar = google.calendar({ version: 'v3', auth: client })
        let result = await calendar.events.get({ calendarId, eventId: activity.eventId })

        return res.status(200).json({
            status: 'Success',
            data: {
                event: result.data,
                activity: activity
            }
        })
    } catch (error) {
        let url = req.protocol + '://' + req.get('host') + '/api/v1/google/login'

        return res.status(400).json({
            status: 'Bad Request',
            message: error.message + ' Please login first to ' + url
        })
    }
})

router.post('/google/events', async (req, res) => {
    try {
        let guests
        const { activityName, date, start, end, attendances } = req.body
        const dateCheck = new Date(date)
        const calendar = google.calendar({ version: 'v3', auth: client })

        if (attendances != undefined && attendances != '') guests = attendances.split(',')
        else guests = calendarId

        let tokens = await redisClient.get('access_token')
        tokens = JSON.parse(tokens)
        client.setCredentials(tokens)

        try {
            await calendar.calendarList.list()
        } catch (error) {
            let url = req.protocol + '://' + req.get('host') + '/api/v1/google/login'

            return res.status(400).json({
                status: 'Bad Request',
                message: error.message + ' Please login first to ' + url
            })
        }

        try {
            guests.forEach((value, index) => {
                if (!isEmail(value)) throw new Error('Attendances email is not valid')
                guests[index] = { email: value }
            })
        } catch (error) {
            return res.status(400).json({
                status: 'Bad Request',
                message: error.message
            })
        }

        if (dateCheck == 'Invalid Date') return res.status(400).json({
            status: 'Bad Request',
            message: 'Please include date and use DD-MMM-YYYY format'
        })

        if (start > end) return res.status(400).json({
            status: 'Bad Request',
            message: 'End hours cannot be lesser than start hours'
        })

        let activity
        try {
            activity = await Activities.create({
                activityName,
                date,
                start,
                end
            })
        } catch (error) {
            return res.status(400).json({
                status: 'Bad Request',
                message: error.message
            })
        }

        activity = createStatusActivity(activity)

        let eventName = activity.activityName
        let startTime = new Date(activity.date)
        let endTime = new Date(activity.date)

        startTime.setHours(activity.start)
        endTime.setHours(activity.end)

        let event = {
            summary: eventName,
            start: {
                dateTime: startTime,
                timeZone: 'Asia/Jakarta'
            },
            end: {
                dateTime: endTime,
                timeZone: 'Asia/Jakarta'
            },
            attendees: guests
        }

        const result = await calendar.events.insert({
            auth: client,
            calendarId: calendarId,
            requestBody: event
        })

        await Activities.findByIdAndUpdate(activity._id, {
            eventId: result.data.id
        })

        return res.status(201).json({
            status: 'Created',
            data: {
                event: result.data,
                activity: activity
            }
        })
    } catch (error) {
        return res.status(500).json({
            status: 'Internal Server Error',
            message: error.message,
        })
    }
})

router.put('/google/events/:id', async (req, res) => {
    try {
        let guests
        const { id } = req.params
        const { activityName, date, start, end, attendances } = req.body
        const calendar = google.calendar({ version: 'v3', auth: client })

        if (attendances != undefined && attendances != '') guests = attendances.split(',')
        else guests = calendarId

        let tokens = await redisClient.get('access_token')
        tokens = JSON.parse(tokens)
        client.setCredentials(tokens)

        try {
            await calendar.calendarList.list()
        } catch (error) {
            let url = req.protocol + '://' + req.get('host') + '/api/v1/google/login'

            return res.status(400).json({
                status: 'Bad Request',
                message: error.message + ' Please login first to ' + url
            })
        }

        try {
            guests.forEach((value, index) => {
                if (!isEmail(value)) throw new Error('Attendances email is not valid')
                guests[index] = { email: value }
            })
        } catch (error) {
            return res.status(400).json({
                status: 'Bad Request',
                message: error.message
            })
        }

        if (date !== undefined) {
            const dateCheck = new Date(date)
            if (dateCheck == 'Invalid Date') return res.status(400).json({
                status: 'Bad Request',
                message: 'Please include date and use DD-MMM-YYYY format'
            })
        }

        if (start > end) return res.status(400).json({
            status: 'Bad Request',
            message: 'End hours cannot be lesser than start hours'
        })

        let activity
        try {
            activity = await Activities.findByIdAndUpdate(id, {
                activityName,
                date,
                start,
                end
            }, {
                runValidators: true
            })
        } catch (error) {
            return res.status(400).json({
                status: 'Bad Request',
                message: error.message
            })
        }

        if (activity == null) return res.status(404).json({
            status: 'Not Found',
            message: 'Cannot find activity with specified id'
        })

        activity = await Activities.findById(id)
        activity = createStatusActivity(activity)

        let startTime = new Date(activity.date)
        let endTime = new Date(activity.date)

        startTime.setHours(activity.start)
        endTime.setHours(activity.end)

        let event = {
            summary: activity.activityName,
            start: {
                dateTime: startTime,
                timeZone: 'Asia/Jakarta'
            },
            end: {
                dateTime: endTime,
                timeZone: 'Asia/Jakarta'
            },
            attendees: guests
        }

        const result = await calendar.events.update({
            auth: client,
            calendarId: calendarId,
            eventId: activity.eventId,
            requestBody: event
        })

        return res.status(200).json({
            status: 'Success',
            data: {
                event: result.data,
                activity: activity
            }
        })

    } catch (error) {
        return res.status(500).json({
            status: 'Internal Server Error',
            message: error.message,
        })
    }
})

router.delete('/google/events/:id', async (req, res) => {
    try {
        const { id } = req.params

        let tokens = await redisClient.get('access_token')
        tokens = JSON.parse(tokens)
        client.setCredentials(tokens)

        const calendar = google.calendar({ version: 'v3', auth: client })

        let activity = await Activities.findByIdAndDelete(id)

        if (activity == null) return res.status(404).json({
            status: 'Not Found',
            message: 'Cannot find activity with specified id'
        })

        await calendar.events.delete({
            auth: client,
            calendarId: calendarId,
            eventId: activity.eventId
        })

        return res.status(200).json({
            status: 'Success',
            message: 'Successfully delete an activity'
        })

    } catch (error) {
        return res.status(500).json({
            status: 'Internal Server Error',
            message: error.message,
        })
    }
})

module.exports = router

function createStatusActivity(activity) {
    activity = activity.toJSON()
    const now = new Date().getHours()
    const today = new Date(new Date().toDateString()).getTime()
    const date = new Date(activity.date).getTime()

    if (date > today || (date == today && now < activity.start)) activity.status = "Belum Dilaksanakan"
    else if (activity.start < now && activity.end > now && today == date) activity.status = "Sedang Dilaksanakan"
    else activity.status = "Telah Dilaksanakan"

    return activity
}