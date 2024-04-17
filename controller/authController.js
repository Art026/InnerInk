const collection = require("../models/collection");
const entry = require('../models/entry');
const ReflectEntry = require('../models/reflectEntry'); 
const Goal = require('../models/goalsentry');

const jwt = require('jsonwebtoken')
const maxAge = 3 * 24 * 60 * 60

const createToken = (id) => {
    return jwt.sign({id}, 'secret', {
        expiresIn:maxAge
    })
}
module.exports.signup_get = (req,res) => {
    try{
        res.render('signup')
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
const handleErrors = (err) => {
    console.log(err.message, err.code)

    let errors = {
        name: '',
        email: '',
        password: ''
    }

    if(err.message === "incorrect email"){
        errors.email = "this email is not registered";
    }

    if(err.message === "incorrect username"){
        errors.name = "this username is not registered";
    }

    if(err.message === "incorrect password"){
        errors.password = "this password is incorrect";
    }

    if(err.code === 11000){
        errors.email = "this email is already registered";
        return errors;
    }

    if(err.message.includes("newusers validation failed")){
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
};

var PASSWORD = 'btxs vojn knsx paal';
var ID = 'astridx1826@gmail.com';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ID, 
        pass: PASSWORD 
    }
});

module.exports.signup_post = async(req,res) => {
    const { name, email, password } = req.body;

    try{
        const user = await collection.create({
            name,email,password
        })
        const token = createToken(user._id);
        const mailOptions = {
            from: ID, // Sender address
            to: email, // Recipient address
            subject: 'Welcome to InnerInk!',
            text: `Hi ${name}, Welcome to InnerInk!`,
            html: `<p>Hi ${name},<br>Welcome to InnerInk!</p>`
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.cookie('jwt', token, {httpOnly:true, maxAge:maxAge})
        res.status(201).json({user: user._id});
    }
    catch(err){
        console.log(err);
        const errors = handleErrors(err);
        res.status(400).json({errors});
    }
}
module.exports.login_get = (req,res) => {
    try{
        res.render('login')
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.login_post = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await collection.login(name, email, password);

        const token = createToken(user._id);

        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge });

        res.status(200).json({ user: user._id });
    } catch (err) {
        console.log(err);
        const errors = handleErrors(err);
        res.status(400).json({ errors: 'Incorrect username or password' }); // Return the correct error message
    }
}
module.exports.logout_get = (req,res) => {
    try{
        res.cookie("jwt", '', {maxAge:1})
        res.redirect('/')
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.journals_get = (req,res) => {
    try{
        res.render('journals')
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.jtype_get = (req,res) => {
    try{
        res.render('jtype')
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
    
}
module.exports.save_post = async (req, res) => {
    const { diary: content, userId, mood, tags, day ,date , imageUrl} = req.body; // Extract user ID from request body
    try {
        const newEntry = await entry.create({
            diary: content,
            userId: userId, 
            mood: mood,
            tags: tags,
            day: day,
            date: date,
            image: imageUrl
        });
        console.log("New journal entry saved:", newEntry);
        res.status(201).json({ diary: newEntry });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Failed to save journal entry' });
    }
};
module.exports.calendar_get = async(req,res) => {
    try{
        res.render('calendar');
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.reflect_get = async(req,res)=>{
    try{
        res.render('reflect');
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.reflectsave_post = async (req, res) => {
    const { question, userId, answer, day, date, image } = req.body;
    try {
        const newEntry = await ReflectEntry.create({
            question,
            userId,
            answer,
            day,
            date,
            image
        });

        console.log('New reflection entry saved:', newEntry);
        res.status(201).json({ message: 'Reflection saved successfully', entry: newEntry });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save reflection' });
    }
};
module.exports.newgoal_get = async(req,res) => {
    try{
        res.render('todo', { user: req.user });
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
    }
}
async function getCombinedEntries(userId) {
    try {
        const journalEntries = await entry.find({ userId: userId });
        const reflectEntries = await ReflectEntry.find({ userId: userId });
        return [...journalEntries, ...reflectEntries];
    } catch (error) {
        console.error("Error fetching entries:", error);
        throw error;
    }
}
function countEntriesByDate(entries) {
        const countMap = new Map();
        entries.forEach(entry => {
            const dateString = entry.date.toDateString(); // Convert date to string for counting
            countMap.set(dateString, (countMap.get(dateString) || 0) + 1);
        });
        return countMap;
}
module.exports.timeline_get = async (req, res) => {
    try {
        const userId = req.query.userId; // Retrieve user ID from query parameter
        const entries = await getCombinedEntries(userId); // Pass userId to getCombinedEntries
        const sortedEntries = entries.sort((a, b) => a.date - b.date);
        const entryCounts = countEntriesByDate(sortedEntries);
        res.render("timeline", { entries: sortedEntries, entryCounts });
    } catch (error) {
        console.error("Error rendering timeline:", error);
        res.status(500).send("Internal Server Error");
    }
};
module.exports.count_get = async (req, res) => {
        const { date, userId } = req.query;
        try {
            const journalCount = await entry.countDocuments({ date: new Date(date) , userId: userId });
            const reflectCount = await ReflectEntry.countDocuments({ date: new Date(date) , userId: userId });

            res.status(200).json({ journalCount, reflectCount });
        } catch (error) {
            console.error("Error fetching entry counts:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
};
module.exports.daycount_get = async (req, res) => {
    const { dayOfWeek, userId } = req.query; // Retrieve dayOfWeek and userId from the query parameters

    try {
        // Retrieve counts for entries with the specified day value and user ID
        const journalCount = await entry.countDocuments({ day: dayOfWeek, userId: userId });
        const reflectCount = await ReflectEntry.countDocuments({ day: dayOfWeek, userId: userId });

        res.status(200).json({ journalCount, reflectCount });
    } catch (error) {
        console.error("Error fetching entry counts:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
module.exports.upload_post = async(req,res) => {

    if (!req.file) {
        res.status(403).json({ status: false, error: "Please upload a file" });
        return;
    }

    try {
        const imageUrl = req.file.location; // Get the URL of the uploaded image
        res.status(200).json({ status: true, message: 'Image uploaded successfully', data: imageUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, error: "Failed to upload image" });
    }
};
module.exports.reflectentries_get = async(req,res) => {
    try {
        const userId = req.query.userId; // Retrieve user ID from query parameter
        if (!userId) {
            return res.status(400).send('User ID is required');
        }
        // Find entries made by the user with the provided user ID
        const reflects = await ReflectEntry.find({ userId: userId });
        res.render('entrydisplay', { entries: reflects });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.journaldisplay_get = async(req,res) => {
    try {
        const userId = req.query.userId; // Retrieve user ID from query parameter
        if (!userId) {
            return res.status(400).send('User ID is required');
        }
        // Find entries made by the user with the provided user ID
        const entries = await entry.find({ userId: userId });
        res.render('journaldisplay', { entries: entries });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports.entrycount_get = async(req,res) => {
    try {
        const { userId } = req.params;

        // Fetch total number of entries for the user
        const totalEntries = await entry.countDocuments({ userId });
        const second = await ReflectEntry.countDocuments({ userId });

        const sum = totalEntries + second;
    
        res.json({ sum });
    } catch (err) {
        console.error('Error fetching total entries:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
require('dotenv').config();
const AWS = require('aws-sdk');
const { S3Client } = require('@aws-sdk/client-s3')
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();
module.exports.deleteentry_delete = async(req,res) => {
    try {
        const entryId = req.params.id; // Correct way to access the id parameter
        const entry1 = await entry.findById(entryId);

        if (!entry1) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        if (entry1.image) {
            const imageUrl = entry1.image;
            const key = imageUrl.split('/').pop(); // Extract the filename from the image URL
            const params = {
                Bucket: 'innerink-s3-bucket',
                Key: key
            };
            try {
                await s3.headObject(params).promise()
                console.log("File Found in S3")
                try {
                    await s3.deleteObject(params).promise()
                    console.log("file deleted Successfully")
                }
                catch (err) {
                     console.log("ERROR in file Deleting : " + JSON.stringify(err))
                }
            } catch (err) {
                    console.log("File not Found ERROR : " + err.code)
            }    
        }
        await entry.findByIdAndDelete(entryId); // Use findByIdAndDelete to delete the entry directly

        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports.deletereflectentry_delete = async(req,res) => {
        try {
            const entryId = req.params.id; // Correct way to access the id parameter
            const entry1 = await ReflectEntry.findById(entryId);

            if (!entry1) {
                return res.status(404).json({ message: 'Entry not found' });
            }
            await ReflectEntry.findByIdAndDelete(entryId); // Use findByIdAndDelete to delete the entry directly

            res.status(200).json({ message: 'Entry deleted successfully' });
        } catch (error) {
            console.error('Error deleting entry:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
}
module.exports.searchEntries = async (req, res) => {
    console.log("auth");
    const keyword = req.query.keyword; // Access keyword from query parameters
    const userId = req.query.userId; // Access user ID from query parameters
    console.log(keyword);
    try {
        const results = await entry.find(
            { userId, $text: { $search: keyword} } // Search keyword in the 'diary' field for the given userId
        );
        res.json(results);
    } catch (error) {
        console.error('Error searching entries:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports.message_get = async(req, res) => {
    try{
        res.render('chatbot')
    }catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).send('Internal Server Error');
}
}
const axios = require('axios');

async function handleChatGPT(message) {
    const options = {
        method: 'POST',
        url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': 'b3c6e12658msh3210b4d8ab3fe72p1be3dajsn3d5c36180313',
            'X-RapidAPI-Host': 'chatgpt-42.p.rapidapi.com'            
        },
        data: {
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ],
            system_prompt: '',
            temperature: 0.9,
            top_k: 5,
            top_p: 0.9,
            max_tokens: 256,
            web_access: false
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.handleMessage = async(req, res) => {
    const content = req.body.message;

    if (content.trim() === "") {
        return res.status(400).json({ error: "Empty message" });
    }

    try {
        const chatbotResponse = await handleChatGPT(content);
        return res.json({ message: chatbotResponse });
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while processing the request" });
    }
}
module.exports.handleChatGPT = handleChatGPT;
module.exports.handleErrors = handleErrors;