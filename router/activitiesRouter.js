const express = require("express")
const router = express.Router()
const Activities = require("../model/events")

router.get("/activities", protect, async (req, res) => {
  try {
    let finalData = []

    let activity = await Activities.find()
    activity.forEach(value => {
      value = createStatusActivity(value)
      finalData.push(value)
    })

    return res.status(200).json({
      status: 'Success',
      data: finalData
    })
  } catch (error) {
    return res.status(500).json({
      status: 'Internal Server Error',
      message: error.message,
    })
  }
})

router.get("/activities/:id", protect, async (req, res) => {
  try {
    const { id } = req.params

    let activity = await Activities.findById(id)

    if (activity === null) return res.status(404).json({
      status: 'Not Found',
      message: 'Cannot find the id of activity'
    })

    activity = createStatusActivity(activity)

    return res.status(200).json({
      status: 'Success',
      data: activity
    })

  } catch (error) {
    return res.status(500).json({
      status: 'Internal Server Error',
      message: error.message,
    })
  }
})

router.post("/activities", protect, async (req, res) => {
  try {
    const { activityName, date, start, end } = req.body
    const dateCheck = new Date(date)

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

    return res.status(201).json({
      status: 'Created',
      data: activity
    })
  } catch (error) {
    return res.status(500).json({
      status: 'Internal Server Error',
      message: error.message,
    })
  }
})

router.put("/activities/:id", protect, async (req, res) => {
  try {
    const { activityName, date, start, end } = req.body
    const { id } = req.params

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

    return res.status(200).json({
      status: 'Success',
      data: activity
    })

  } catch (error) {
    return res.status(500).json({
      status: 'Internal Server Error',
      message: error.message,
    })
  }
})

router.delete("/activities/:id", protect, async (req, res) => {
  try {
    const { id } = req.params

    let activity = await Activities.findByIdAndDelete(id)

    if (activity == null) return res.status(404).json({
      status: 'Not Found',
      message: 'Cannot find activity with specified id'
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

async function protect(req, res, next) {
  if (!req.session.user)
    return res.status(401).json({
      status: "Unauthorized",
      message: 'Please Authenticate first'
    })

  next()
}

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