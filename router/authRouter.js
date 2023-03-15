const User = require("../model/users")
const bcrypt = require("bcryptjs")
const express = require('express')
const router = express.Router()

router.post('/signup', async (req, res) => {
    let { email, password } = req.body

    if (email !== undefined && password !== undefined) {
        password = bcrypt.hashSync(password, 10)
        try {
            const newUser = await User.create({
                email,
                password,
            })

            req.session.user = newUser
            return res.status(201).json({
                status: "Success",
                data: {
                    newUser,
                },
            })
        } catch (error) {
            return res.status(400).json({
                status: "Fail",
                message: error.message
            })
        }
    } else
        res.status(400).json({
            status: "Fail",
        })
})

router.post('/login', async (req, res) => {
    let { email, password } = req.body

    if (email !== undefined && password !== undefined) {
        try {
            const user = await User.findOne({ email })
            if (user === null)
                return res.status(404).json({
                    status: "Fail",
                    message: "User not found",
                })

            const check = bcrypt.compareSync(password, user.password)

            if (!check)
                return res.status(400).json({
                    status: "Fail",
                    message: "Password is incorrect",
                })

            req.session.user = user

            return res.status(200).json({
                status: "Success",
            })
        } catch (error) {
            return res.status(400).json({
                status: "Fail",
            })
        }
    } else
        return res.status(400).json({
            status: "Fail",
        })
})

module.exports = router
