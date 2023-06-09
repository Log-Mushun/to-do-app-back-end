const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");

const { User } = require("../models/user");

const router = express.Router();

//Joi
router.post("/", async(req, res) => {
    const joiSchema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
        email: Joi.string().min(3).max(200).email().required(),
        password: Joi.string().min(6).max(200).required()
    });

    const { error } = joiSchema.validate(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    // Validate if user exists

    try {
        let user = await User.findOne({
            email: req.body.email
        });
        if (user) return res.status(400).send("Email already registered");

        const { name, email, password } = req.body;

        user = new User({
            name,
            email,
            password
        });

        //Hash the password => bcrypt

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)

        // Save User
        await user.save()

        // jwt => send to client
        const secretKey = process.env.SECRET_KEY;
        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email }, secretKey);

        res.send(token);

    } catch (error) {
        res.status(500).send(error.message);
        console.log(error.message);
    }
});

module.exports = router