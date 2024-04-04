const {Router} = require("express")
const mongoose = require("mongoose")
const authController =  require("../controller/authController")
const {requireAuth} = require('../middlewares/authMiddlewares');
const entry = require('../models/entry');
const ReflectEntry = require('../models/reflectEntry'); 
const collection = require('../models/collection');
const { UploadMiddleWares } = require('../middlewares/fileupload');
const router = Router()
require('dotenv').config();
const AWS = require('aws-sdk');
const { S3Client } = require('@aws-sdk/client-s3')
    

router.get('/signup', authController.signup_get)
router.post('/signup', authController.signup_post)

router.get('/login', authController.login_get)
router.post('/login', authController.login_post)
router.get('/logout', authController.logout_get);

router.get('/journals', requireAuth, authController.journals_get);

router.get('/jtype', requireAuth, authController.jtype_get);
router.post('/save', authController.save_post);

router.get('/calendar', requireAuth ,authController.calendar_get);

router.get('/reflect', requireAuth, authController.reflect_get);
router.post('/reflectsave', authController.reflectsave_post);
router.get('/reflectentries', authController.reflectentries_get);

router.get('/journaldisplay', authController.journaldisplay_get);

router.get('/entrycount/:userId', authController.entrycount_get);

router.get('/newgoal', authController.newgoal_get);

router.get('/timeline', authController.timeline_get);


router.get('/count', authController.count_get);
router.get('/daycount', authController.daycount_get);

router.post('/upload', UploadMiddleWares.single('file'), authController.upload_post);

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

router.delete('/delete-entry/:id', authController.deleteentry_delete);


module.exports = router



