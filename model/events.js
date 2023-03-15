const mongoose = require("mongoose")

const activitiesSchema = new mongoose.Schema({
  activityName: {
    type: String,
    require: [true, "Please define the name of activity"],
  },
  date: {
    type: String,
    require: [true, "Please insert date of activity"],
  },
  start: {
    type: Number,
    require: [true, "Please insert start hour"],
    min: [0, "Start hours cannot less than 0 and more than 23"],
    max: [23, "Start hours cannot less than 0 and more than 23"]
  },
  end: {
    type: Number,
    require: [true, "Please insert end hour"],
    min: [1, "Hours cannot less than 1 and more than 24"],
    max: [24, "Hours cannot less than 1 and more than 24"],
  },
  eventId: {
    type: String,
    require: false
  }
})

const activities = mongoose.model("Activity", activitiesSchema)
module.exports = activities
