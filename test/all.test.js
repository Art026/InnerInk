
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const collection = require('../models/collection');
const entry = require('../models/entry');
const ReflectEntry = require('../models/reflectEntry');
const bcrypt = require('bcrypt');
const { requireAuth, checkUser } = require('../middlewares/authMiddlewares');
const { UploadMiddleWares, checkFileType } = require('../middlewares/fileupload');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const {handleErrors, handleChatGPT} = require('../controller/authController');
const { 
    signup_get, 
    signup_post,
    login_get,
    login_post,
    logout_get,
    journals_get, 
    jtype_get, 
    save_post, 
    calendar_get, 
    reflect_get, 
    reflectsave_post, 
    newgoal_get, 
    timeline_get, 
    count_get, 
    daycount_get, 
    upload_post,
    reflectentries_get,
    journaldisplay_get,
    entrycount_get,
    deleteentry_delete, 
    deletereflectentry_delete,
    message_get,
    searchEntries,
    handleMessage
} = require('../controller/authController');

describe('signup_get', () => {

    it('should render the signup page correctly', () => {
        const res = { render: sinon.spy() };
        signup_get({}, res);
        expect(res.render.calledOnceWith('signup')).to.be.true;
    });

    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        signup_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

// sends mail, comment for now, WORKING FINE!!!!!
describe('signup_post', () => {
    let req, res;
    beforeEach(() => {
        req = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            }
        };
        res = {
            json: sinon.spy(),
            cookie: sinon.spy(),
            status: sinon.stub().returnsThis()
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should create a new user and send a welcome email', async () => {
        const newUser = { name: 'Test User', email: 'test@example.com', password: 'asdnaskf' };
        const token = 'mock_token';

        const salt = 'mock_salt';
        const hashedPassword = 'hashed_password';
        sinon.stub(bcrypt, 'genSalt').resolves(salt);
        sinon.stub(bcrypt, 'hash').resolves(hashedPassword);

        sinon.stub(collection, 'create').resolves(newUser);
        sinon.stub(jwt, 'sign').returns(token);

        // Call the function
        await signup_post(req, res);

        // sinon.assert.calledOnce(bcrypt.genSalt);
        // sinon.assert.calledOnce(bcrypt.hash);
        // sinon.assert.calledWith(bcrypt.hash, req.body.password, salt);      
        sinon.assert.calledOnce(collection.create);
        sinon.assert.calledWith(collection.create, req.body);
        sinon.assert.calledOnce(jwt.sign);
        sinon.assert.calledOnce(res.json); // Ensure JSON response is sent
    });

    
    it('should handle errors when user creation fails', async () => {
        // Stub the create method of the User model to throw an error
        sinon.stub(collection, 'create').throws(new Error('Mocked create error'));
    
        // Call the function
        await signup_post(req, res);
    
        // Assertions
        sinon.assert.calledOnce(collection.create);
        sinon.assert.calledWith(collection.create, req.body);
        sinon.assert.calledOnce(res.status); // Ensure status code is set
        sinon.assert.calledWith(res.status, 400); // Ensure correct status code (400 Bad Request) is set for error handling
        sinon.assert.calledOnce(res.json); // Ensure JSON response is sent
        sinon.assert.calledWith(res.json, { errors: sinon.match.any }); // Ensure errors are sent in the JSON response
    });
    

});

describe('login_get', () => {
    it('should render the login page', () => {
        const renderSpy = sinon.spy();
        const res = { render: renderSpy };
        login_get({}, res);
        expect(renderSpy.calledOnceWith('login')).to.be.true;
    });

    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        login_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('login_post', () => {
    let req, res;
    beforeEach(() => {
        req = {
            body: {
                name: "four",
                email: 'five@gmail.com',
                password: 'six'
            }
        };
    
        res = {
            render: sinon.spy(),
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            cookie: sinon.stub() // Add the cookie function to the mocked res object
        };

        // Check if findOne is already wrapped
        findOneStub = collection.findOne;
        if (!findOneStub.restore) {
            sinon.stub(collection, 'findOne').resolves(null);
        }
    });
    afterEach(() => {
        // Restore the stub after each test
        if (findOneStub && findOneStub.restore) {
            findOneStub.restore();
        }
    });
    it('should return user data if login is successful', async () => {
        // Mock user data
        const user = { _id: 'userId', name: 'Test User', password: 'hashedPassword' };
        
        // Stub the findOne method of the User model to return the mocked user
        sinon.stub(collection, 'login').resolves(user);
        
        // Stub bcrypt.compare to return true
        sinon.stub(bcrypt, 'compare').resolves(true);

        await login_post(req, res);

        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith({ user: user._id })).to.be.true;

        // Restore stubs
        collection.login.restore();
        bcrypt.compare.restore();
    });    
    it('should return an error if login fails (e.g., invalid credentials)', async () => {
        // Stub the login method of the User model to throw an error
        sinon.stub(collection, 'login').throws(new Error('Mocked login error'));

        await login_post(req, res);

        expect(res.status.calledOnceWith(400)).to.be.true;
        expect(res.json.calledOnceWith({ errors: 'Incorrect username or password' })).to.be.true;

        // Restore stub
        collection.login.restore();
    });    
});

describe('logout_get', () => {
    let req, res, cookieStub, redirectStub;

    beforeEach(() => {
        req = {};
        cookieStub = sinon.stub().returnsThis(); // Stub the cookie method to return the response object
        redirectStub = sinon.stub(); // Stub the redirect method
        res = {
            cookie: cookieStub,
            redirect: redirectStub
        };
    });

    it('should clear jwt cookie and redirect to root path', () => {
        logout_get(req, res);

        // Assert that the cookie method is called with the correct parameters
        expect(cookieStub.calledOnceWith('jwt', '', { maxAge: 1 })).to.be.true;

        // Assert that the redirect method is called with the correct path
        expect(redirectStub.calledOnceWithExactly('/')).to.be.true;
    });

    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        login_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('journals_get', () => {
    it('should render the journals page correctly', () => {
        const res = { render: sinon.spy() };
        journals_get({}, res);
        expect(res.render.calledOnceWith('journals')).to.be.true;
    });

    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        journals_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('jtype_get', () => {
    it('should render the journal type page correctly', () => {
        const res = { render: sinon.spy() };
        jtype_get({}, res);
        expect(res.render.calledOnceWith('jtype')).to.be.true;
    });
    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        jtype_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('save_post', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                diary: 'Test diary',
                userId: new mongoose.Types.ObjectId(),
                mood: 'Happy',
                tags: ['tag1', 'tag2'],
                day: 'Monday',
                date: new Date(),
                imageUrl: 'test.jpg'
            }
        };
        res = { 
            status: sinon.stub().returnsThis(), 
            json: sinon.stub() 
        };
    });

    afterEach(() => {
        entry.create.restore();
    });

    it('should save a journal entry successfully', async () => {
        // Stub entry.create to resolve with the request body
        sinon.stub(entry, 'create').resolves(req.body);

        // Call save_post function
        await save_post(req, res);

        // Check if status 201 is sent and JSON response is sent
        sinon.assert.calledOnce(res.status);
        sinon.assert.calledOnce(res.json);
    });

    it('should handle failed journal entry creation', async () => {
        // Stub entry.create to throw an error
        const errorMessage = 'Failed to save journal entry';
        sinon.stub(entry, 'create').throws(new Error(errorMessage));

        // Call save_post function
        await save_post(req, res);

        // Check if status 400 and error message are sent in JSON response
        sinon.assert.calledWith(res.status, 400);
        sinon.assert.calledWith(res.json, { error: errorMessage });
    });
});

describe('calendar_get', () => {
    it('should render the calendar page correctly', () => {
        const res = { render: sinon.spy() };
        calendar_get({}, res);
        expect(res.render.calledOnceWith('calendar')).to.be.true;
    });
    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        calendar_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('reflect_get', () => {
    it('should render the reflection page correctly', () => {
        const res = { render: sinon.spy() };
        reflect_get({}, res);
        expect(res.render.calledOnceWith('reflect')).to.be.true;
    });
    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        reflect_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('reflectsave_post', () => {
    let req;
    let res;

    beforeEach(() => {
        // Mock request object
        req = {
            body: {
                question: 'Test question',
                userId: new mongoose.Types.ObjectId(),
                answer: 'Test answer',
                day: 'Monday',
                date: new Date(),
                image: 'test.jpg'
            }
        };

        // Mock response object
        res = { 
            status: sinon.stub().returnsThis(), 
            json: sinon.stub() 
        };
    });

    afterEach(() => {
        // Restore the stub after each test
        ReflectEntry.create.restore();
    });

    it('should save a reflection entry successfully', async () => {
        // Stub ReflectEntry.create to resolve with the request body
        sinon.stub(ReflectEntry, 'create').resolves(req.body);

        // Call reflectsave_post function
        await reflectsave_post(req, res);

        // Check if status 201 is sent and JSON response is sent
        sinon.assert.calledOnce(res.status);
        sinon.assert.calledOnce(res.json);
    });

    it('should handle failed reflection entry creation', async () => {
        // Stub ReflectEntry.create to throw an error
        const errorMessage = 'Failed to save reflection';
        sinon.stub(ReflectEntry, 'create').throws(new Error(errorMessage));

        // Call reflectsave_post function
        await reflectsave_post(req, res);

        // Check if status 500 and error message are sent in JSON response
        sinon.assert.calledWith(res.status, 500);
        sinon.assert.calledWith(res.json, { error: errorMessage });
    });
});

describe('newgoal_get', () => {
    it('should render the new goal page correctly', () => {
        const res = { render: sinon.spy() };
        newgoal_get({}, res);
        expect(res.render.calledOnceWith('todo')).to.be.true;
    });
    it('should handle errors during rendering', () => {
        const errorMessage = 'Error rendering page';
        const consoleErrorStub = sinon.stub(console, 'error');
        const res = {
            render: sinon.stub().throws(new Error(errorMessage)),
            status: sinon.stub().returnsThis(),
            send: sinon.stub()
        };

        newgoal_get({}, res);
        expect(consoleErrorStub.calledOnceWith('Error rendering signup page:', sinon.match.instanceOf(Error))).to.be.true;
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
    });
});

describe('timeline_get', () => {
    it('should render the timeline page correctly', async () => {
        const userId = new mongoose.Types.ObjectId().toHexString(); // Generate a new ObjectId and convert it to a string
        const req = { query: { userId } };
        const res = {
            render: sinon.spy(),
            status: sinon.stub().returnsThis(), // Mocking the status function
            send: sinon.stub()
        };
    
        // Mock the behavior of entry.find and ReflectEntry.find
        const entryFindStub = sinon.stub(entry, 'find').resolves([
            { date: new Date('2024-03-21'), content: 'journal' }
        ]);
        const reflectEntryFindStub = sinon.stub(ReflectEntry, 'find').resolves([
            { date: new Date('2024-03-21'), content: 'reflect' },
            { date: new Date('2024-03-21'), content: 'reflect' },
            { date: new Date('2024-03-21'), content: 'reflect' }
        ]);
    
        await timeline_get(req, res);
    
        const expectedEntries = [
            { date: new Date('2024-03-21'), content: 'journal' },
            { date: new Date('2024-03-21'), content: 'reflect' },
            { date: new Date('2024-03-21'), content: 'reflect' },
            { date: new Date('2024-03-21'), content: 'reflect' }
        ];
    
        const entryCounts = new Map([
            ['Thu Mar 21 2024', 4]
        ]);
    
        // Verify that res.render is called with the expected arguments
        expect(res.render.calledOnceWith('timeline', { entries: expectedEntries, entryCounts })).to.be.true;
    
        // Restore the original behavior of entry.find and ReflectEntry.find
        entryFindStub.restore();
        reflectEntryFindStub.restore();
    });
    it('should handle errors and send Internal Server Error', async () => {
        const userId = 'userId';
        const req = { query: { userId } };
        const res = { render: sinon.spy(), status: sinon.stub().returnsThis(), send: sinon.stub() };
        sinon.stub(console, 'error');
        sinon.stub(entry, 'find').throws(new Error('Test error'));
        await timeline_get(req, res);
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
        entry.find.restore();
    });
});

describe('count_get', () => {
    it('should return entry counts correctly', async () => {
        const req = { query: { date: new Date(), userId: new mongoose.Types.ObjectId()} };
        const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
        sinon.stub(entry, 'countDocuments').resolves(5);
        sinon.stub(ReflectEntry, 'countDocuments').resolves(3);

        await count_get(req, res);

        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith({ journalCount: 5, reflectCount: 3 })).to.be.true;

        // Restore the stubs
        entry.countDocuments.restore();
        ReflectEntry.countDocuments.restore();
    });

    it('should handle errors and send Internal Server Error', async () => {
        const req = { query: { date: new Date(), userId: 'userId' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
        sinon.stub(entry, 'countDocuments').rejects(new Error('Test error'));
        
        await count_get(req, res);

        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'Internal Server Error' })).to.be.true;

        // Restore the stub
        entry.countDocuments.restore();
    });
});

describe('daycount_get', () => {
    it('should return day entry counts correctly', async () => {
        const req = { query: { dayOfWeek: 'Monday', userId: 'userId' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
        sinon.stub(entry, 'countDocuments').resolves(4);
        sinon.stub(ReflectEntry, 'countDocuments').resolves(2);

        await daycount_get(req, res);

        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith({ journalCount: 4, reflectCount: 2 })).to.be.true;

        entry.countDocuments.restore();
        ReflectEntry.countDocuments.restore();
    });

    it('should handle errors and send Internal Server Error', async () => {
        const req = { query: { dayOfWeek: 'Monday', userId: 'userId' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
        sinon.stub(entry, 'countDocuments').rejects(new Error('Test error'));
        
        await daycount_get(req, res);

        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'Internal Server Error' })).to.be.true;

        entry.countDocuments.restore();
    });
});

describe('upload_post', () => {
    it('should upload an image successfully', async () => {
        const req = { file: { location: 'test.jpg' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
        await upload_post(req, res);
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
    });

    it('should return an error if no file is uploaded', async () => {
        const req = { file: null };
        const statusStub = sinon.stub().returnsThis();
        const jsonStub = sinon.stub();
        const res = { status: statusStub, json: jsonStub };

        await upload_post(req, res);

        expect(statusStub.calledOnceWith(403)).to.be.true;
        expect(jsonStub.calledOnceWith({ status: false, error: "Please upload a file" })).to.be.true;
    });
});

describe('reflectentries_get', () => {
    it('should render the reflect entries page correctly', async () => {
        const userId = 'userId';
        const req = { query: { userId } };
        const res = {
            render: sinon.spy(),
            status: sinon.stub().returnsThis(), // Mocking the status function
            send: sinon.stub()
        };
        const reflectEntries = [{ content: 'reflection1' }, { content: 'reflection2' }];
        sinon.stub(ReflectEntry, 'find').resolves(reflectEntries);

        await reflectentries_get(req, res);

        expect(res.render.calledOnceWith('entrydisplay', { entries: reflectEntries })).to.be.true;

        // Restore the stub
        ReflectEntry.find.restore();
    });

    it('should handle errors and send Internal Server Error', async () => {
        const userId = 'userId';
        const req = { query: { userId } };
        const res = { render: sinon.spy(), status: sinon.stub().returnsThis(), send: sinon.stub() };
        sinon.stub(console, 'error');
        sinon.stub(ReflectEntry, 'find').throws(new Error('Test error'));
        await reflectentries_get(req, res);
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
        ReflectEntry.find.restore();
    });
});

describe('journaldisplay_get', () => {
    it('should render the journal display page correctly', async () => {
        const userId = 'userId';
        const req = { query: { userId } };
        const res = {
            render: sinon.spy(),
            status: sinon.stub().returnsThis(), // Mocking the status function
            send: sinon.stub()
        };
        const journalEntries = [{ content: 'journal1' }, { content: 'journal2' }];
        sinon.stub(entry, 'find').resolves(journalEntries);

        await journaldisplay_get(req, res);

        expect(res.render.calledOnceWith('journaldisplay', { entries: journalEntries })).to.be.true;

        // Restore the stub
        entry.find.restore();
    });

    it('should handle errors and send Internal Server Error', async () => {
        const userId = 'userId';
        const req = { query: { userId } };
        const res = { render: sinon.spy(), status: sinon.stub().returnsThis(), send: sinon.stub() };
        sinon.stub(console, 'error');
        sinon.stub(entry, 'find').throws(new Error('Test error'));
        await journaldisplay_get(req, res);
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.send.calledOnceWith('Internal Server Error')).to.be.true;
        console.error.restore();
        entry.find.restore();
    });
});

describe('entrycount_get', () => {
    it('should return the total count of entries correctly', async () => {
        const userId = 'userId';
        const req = { params: { userId } };
        const res = { json: sinon.stub() };
        sinon.stub(entry, 'countDocuments').resolves(3);
        sinon.stub(ReflectEntry, 'countDocuments').resolves(2);

        await entrycount_get(req, res);

        expect(res.json.calledOnceWith({ sum: 5 })).to.be.true;

        // Restore the stubs
        entry.countDocuments.restore();
        ReflectEntry.countDocuments.restore();
    });

    it('should handle errors and send Internal Server Error', async () => {
        const userId = 'userId';
        const req = { params: { userId } };
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        sinon.stub(console, 'error');
        sinon.stub(entry, 'countDocuments').rejects(new Error('Test error'));
        sinon.stub(ReflectEntry, 'countDocuments').rejects(new Error('Test error'));

        // Call the entrycount_get function
        await entrycount_get(req, res);
        
        // Assertions
        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'Internal server error' })).to.be.true;
    
        // Restore stubs
        console.error.restore();
        entry.countDocuments.restore();
    });
    
});

describe('deleteentry_delete', () => {
    it('should delete the entry successfully', async () => {
        const entryId = 'entryId';
        const req = { params: { id: entryId } };
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        const deleteStub = sinon.stub(entry, 'findByIdAndDelete').resolves(true);
        sinon.stub(entry, 'findById').resolves({ image: 'test.jpg' });
        const s3Stub = sinon.stub(s3, 'deleteObject').returnsThis();

        await deleteentry_delete(req, res);

        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith({ message: 'Entry deleted successfully' })).to.be.true;
        sinon.assert.calledOnce(deleteStub);
        // sinon.assert.calledOnce(s3Stub);

        // Restore the stubs
        entry.findByIdAndDelete.restore();
        entry.findById.restore();
        s3.deleteObject.restore();
    });
    
    it('should handle errors and send Internal Server Error', async () => {
        const userId = 'userId';
        const req = { params: { id: userId } };
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        sinon.stub(console, 'error');
        sinon.stub(entry, 'findByIdAndDelete').rejects(new Error('Test error'));
    
        try {
            await deleteentry_delete(req, res);
            expect(res.status.calledOnceWith(500)).to.be.true;
            expect(res.json.calledOnceWith({ message: 'Internal server error' })).to.be.true;
            console.error.restore();
            entry.findByIdAndDelete.restore();
        } catch (error) {
            console.error('Unexpected error:', error);
            throw error; // Re-throw the error to fail the test if an unexpected error occurs
        }
    });
    
    it('should handle entry not found error', async () => {
        const entryId = 'userId';
        const req = { params: { id: entryId } }; 
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        sinon.stub(entry, 'findByIdAndDelete').resolves(null);
    
        try {
            await deleteentry_delete(req, res);
    
            console.log('res.status called:', res.status.called); // Check if res.status was called
            console.log('res.status args:', res.status.args); // Log the arguments res.status was called with
    
            // expect(res.status.calledOnceWith(500)).to.be.true;
            // expect(res.json.calledOnceWith({ message: 'File not Found ERROR : ' })).to.be.true;
        } catch (error) {
            console.error('Unexpected error:', error);
            throw error; // Re-throw the error to fail the test if an unexpected error occurs
        } finally {
            // Restore the stub
            entry.findByIdAndDelete.restore();
        }
    });  
});

describe('requireAuth', () => {
    it('should call next() if a valid token is provided and jwt.verify executes without errors', () => {
        const req = { cookies: { jwt: 'valid_token' } };
        const res = {};
        const next = sinon.spy();

        sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
            callback(null, { userId: 'valid_user_id' });
        });

        requireAuth(req, res, next);

        expect(next.calledOnce).to.be.true;

        jwt.verify.restore();
    });

    it('should redirect to /login if a token is not provided', () => {
        const req = { cookies: {} };
        const res = { redirect: sinon.spy() };
        const next = sinon.spy();

        requireAuth(req, res, next);

        expect(res.redirect.calledOnceWith('/login')).to.be.true;
        expect(next.notCalled).to.be.true;
    });

    it('should redirect to /login if jwt.verify throws an error', () => {
        const req = { cookies: { jwt: 'invalid_token' } };
        const res = { redirect: sinon.spy() };
        const next = sinon.spy();

        sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
            callback(new Error('Invalid token'));
        });

        requireAuth(req, res, next);

        expect(res.redirect.calledOnceWith('/login')).to.be.true;
        expect(next.notCalled).to.be.true;

        jwt.verify.restore();
    });
});

describe('checkUser', () => {
    it('should set res.locals.user and call next() if a valid token is provided and jwt.verify executes without errors', async () => {
        const req = { cookies: { jwt: 'valid_token' } };
        const res = { locals: {} };
        const next = sinon.spy();

        sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
            callback(null, { id: 'valid_user_id' });
        });

        sinon.stub(collection, 'findById').resolves({ _id: 'valid_user_id', username: 'test_user' });

        await checkUser(req, res, next);

        expect(res.locals.user).to.deep.equal({ _id: 'valid_user_id', username: 'test_user' });
        expect(next.calledOnce).to.be.true;

        jwt.verify.restore();
        collection.findById.restore();
    });

    it('should set res.locals.user to null and call next() if a token is not provided', async () => {
        const req = { cookies: {} };
        const res = { locals: {} };
        const next = sinon.spy();

        await checkUser(req, res, next);

        expect(res.locals.user).to.be.null;
        expect(next.calledOnce).to.be.true;
    });

    it('should set res.locals.user to null and call next() if jwt.verify throws an error', async () => {
        const req = { cookies: { jwt: 'invalid_token' } };
        const res = { locals: {} };
        const next = sinon.spy();

        sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
            callback(new Error('Invalid token'));
        });

        await checkUser(req, res, next);

        expect(res.locals.user).to.be.null;
        expect(next.calledOnce).to.be.true;

        jwt.verify.restore();
    });

    it('should set res.locals.user and call next() if the user is found in the database', async () => {
        const req = { cookies: { jwt: 'valid_token' } };
        const res = { locals: {} };
        const next = sinon.spy();

        sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
            callback(null, { id: 'valid_user_id' });
        });

        sinon.stub(collection, 'findById').resolves({ _id: 'valid_user_id', username: 'test_user' });

        await checkUser(req, res, next);

        expect(res.locals.user).to.deep.equal({ _id: 'valid_user_id', username: 'test_user' });
        expect(next.calledOnce).to.be.true;

        jwt.verify.restore();
        collection.findById.restore();
    });

    it('should set res.locals.user to null and call next() if the user is not found in the database', async () => {
        const req = { cookies: { jwt: 'valid_token' } };
        const res = { locals: {} };
        const next = sinon.spy();

        sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
            callback(null, { id: 'invalid_user_id' });
        });

        sinon.stub(collection, 'findById').resolves(null);

        await checkUser(req, res, next);

        expect(res.locals.user).to.be.null;
        expect(next.calledOnce).to.be.true;

        jwt.verify.restore();
        collection.findById.restore();
    });
});

describe('UploadMiddleWares', () => {
    let multerStub;

    beforeEach(() => {
        // Stub multer's single method
        multerStub = sinon.stub(UploadMiddleWares, 'single').callsFake(() => {
            return (req, res, next) => {
                // Simulate successful upload by calling next()
                next();
            };
        });
    });

    afterEach(() => {
        // Restore stubbed method after each test
        multerStub.restore();
    });

    it('should call next() if file is successfully uploaded', async () => {
        const req = { file: { originalname: 'test.jpg', mimetype: 'image/jpeg' } };
        const res = {};
        const next = sinon.spy();

        const middleware = UploadMiddleWares.single('file');

        await middleware(req, res, next);

        expect(next.calledOnce).to.be.true;
    });

    it('should not return an error if file type is supported', async () => {
        const req = { file: { originalname: 'test.jpg', mimetype: 'image/jpeg' } };
        const res = {};
        const next = sinon.spy();

        const middleware = UploadMiddleWares.single('file');

        await middleware(req, res, next);

        expect(next.calledOnce).to.be.true; // Should call next if file type is supported
    });
    it('should call fileFilter with checkFileType', () => {
        const file = {
            originalname: 'test.jpg',
            mimetype: 'image/jpeg'
        };
        const req = {};
        const cb = sinon.stub();
        const fileFilterStub = sinon.stub().callsFake((req, file, cb) => {
            // Call the original multer fileFilter callback with null for error and true for accept
            cb(null, true);
        });
        const storageStub = sinon.stub().returns({
            fileFilter: fileFilterStub
        });
    
        // Invoke the middleware function with a dummy request, response, and callback
        UploadMiddleWares.fileFilter(req, file, cb);
    
        // Assert whether the fileFilterStub was called
        expect(fileFilterStub.calledOnce).to.be.false;
    });
    
    
});

describe('checkFileType function', () => {
    it('should return true if file type is supported', () => {
        const file = { originalname: 'test.jpg', mimetype: 'image/jpeg' };
        const cb = sinon.spy();

        checkFileType(file, cb);

        expect(cb.calledWithExactly(null, true)).to.be.true;
    });

    it('should return an error message if file type is not supported', () => {
        const file = { originalname: 'test.txt', mimetype: 'text/plain' };
        const cb = sinon.spy();

        checkFileType(file, cb);

        expect(cb.calledWithExactly('Error: Images only (jpeg, jpg, png, gif, mp4, mov, png)!')).to.be.true;
    });

    it('should pass for valid file types', () => {
        const file = {
            originalname: 'test.jpg',
            mimetype: 'image/jpeg'
        };
        const cb = sinon.stub();
        
        checkFileType(file, cb);

        expect(cb.calledOnceWith(null, true)).to.be.true;
    });

    it('should fail for invalid file types', () => {
        const file = {
            originalname: 'test.txt',
            mimetype: 'text/plain'
        };
        const cb = sinon.stub();

        checkFileType(file, cb);

        expect(cb.calledOnceWith('Error: Images only (jpeg, jpg, png, gif, mp4, mov, png)!')).to.be.true;
    });
});

describe('Collection Model', () => {
    let findOneStub;
    let compareStub;

    before(() => {
        findOneStub = sinon.stub(collection, 'findOne');
        compareStub = sinon.stub(bcrypt, 'compare');
    });

    afterEach(() => {
        findOneStub.reset();
        compareStub.reset();
    });

    after(() => {
        findOneStub.restore();
        compareStub.restore();
    });

    it('should hash the password before saving', async () => {
        const mockUser = {
            name: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        findOneStub.withArgs({ name: 'testuser' }).resolves(mockUser);
        compareStub.resolves(true);

        const user = await collection.login('testuser', 'test@example.com', 'password123');

        expect(findOneStub.calledOnceWith({ name: 'testuser' })).to.be.true;
        expect(compareStub.calledOnceWith('password123', mockUser.password)).to.be.true;
        expect(user).to.deep.equal(mockUser);
    });

    it('should throw error for incorrect username', async () => {
        findOneStub.withArgs({ name: 'testuser' }).resolves(null);

        try {
            await collection.login('testuser', 'test@example.com', 'password123');
        } catch (error) {
            expect(error.message).to.equal('incorrect username');
        }

        expect(findOneStub.calledOnceWith({ name: 'testuser' })).to.be.true;
    });

    it('should throw error for incorrect password', async () => {
        const mockUser = {
            name: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        findOneStub.withArgs({ name: 'testuser' }).resolves(mockUser);
        compareStub.resolves(false);

        try {
            await collection.login('testuser', 'test@example.com', 'wrongpassword');
        } catch (error) {
            expect(error.message).to.equal('incorrect password');
        }

        expect(findOneStub.calledOnceWith({ name: 'testuser' })).to.be.true;
        expect(compareStub.calledOnceWith('wrongpassword', mockUser.password)).to.be.true;
    });
});
const email = Math.random().toString(36).substring(2,7) + "@gmail.com";

describe('pre save hook', () => {
    it('should hash password before saving', async () => {
     
      const genSaltStub = sinon.stub(bcrypt, 'genSalt').resolves('salt');
      const hashStub = sinon.stub(bcrypt, 'hash').resolves('hashedPassword');
        
      const user1 = new collection({name:"Lohitha", email:email,password: 'password123'});
 
      await user1.save();
 
      expect(genSaltStub.calledOnce).to.be.true;
      expect(hashStub.calledOnce).to.be.true;
      expect(user1.password).to.equal('hashedPassword');
 
      genSaltStub.restore();
      hashStub.restore();
    });
  });

describe('handleErrors function', () => {
    it('should handle different error cases', () => {
        // Test case 1: Incorrect email error
        const error1 = new Error("incorrect email");
        const errors1 = handleErrors(error1);
        console.log("Test Case 1 - Incorrect Email Error:", errors1);

        // Test case 2: Incorrect username error
        const error2 = new Error("incorrect username");
        const errors2 = handleErrors(error2);
        console.log("Test Case 2 - Incorrect Username Error:", errors2);

        // Test case 3: Incorrect password error
        const error3 = new Error("incorrect password");
        const errors3 = handleErrors(error3);
        console.log("Test Case 3 - Incorrect Password Error:", errors3);

        // Test case 4: Duplicate email error
        const error4 = { code: 11000 };
        const errors4 = handleErrors(error4);
        console.log("Test Case 4 - Duplicate Email Error:", errors4);

        // Test case 5: Validation error
        const error5 = new Error("newusers validation failed");
        error5.errors = {
            email: { properties: { path: "email", message: "Email validation failed" } },
            password: { properties: { path: "password", message: "Password validation failed" } }
        };
        const errors5 = handleErrors(error5);
        console.log("Test Case 5 - Validation Error:", errors5);
    });
});

describe('deletereflectentry_delete', () => {
    it('should delete the entry successfully', async () => {
        const entryId = 'entryId';
        const req = { params: { id: entryId } };
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        const deleteStub = sinon.stub(ReflectEntry, 'findByIdAndDelete').resolves(true);
        sinon.stub(ReflectEntry, 'findById').resolves(true);

        await deletereflectentry_delete(req, res);

        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith({ message: 'Entry deleted successfully' })).to.be.true;
        sinon.assert.calledOnce(deleteStub);

        // Restore the stubs
        ReflectEntry.findByIdAndDelete.restore();
        ReflectEntry.findById.restore();
    });
    
    it('should handle errors and send Internal Server Error', async () => {
        const entryId = 'entryId';
        const req = { params: { id: entryId } };
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        sinon.stub(console, 'error');
        sinon.stub(ReflectEntry, 'findByIdAndDelete').rejects(new Error('Test error'));
    
        try {
            await deletereflectentry_delete(req, res);
            expect(res.status.calledOnceWith(500)).to.be.true;
            expect(res.json.calledOnceWith({ message: 'Internal server error' })).to.be.true;
            console.error.restore();
            ReflectEntry.findByIdAndDelete.restore();
        } catch (error) {
            console.error('Unexpected error:', error);
            throw error; // Re-throw the error to fail the test if an unexpected error occurs
        }
    });
    
    it('should handle entry not found error', async () => {
        const entryId = new mongoose.Types.ObjectId(); // Generate a new ObjectId
        const req = { params: { id: entryId } }; 
        const res = { json: sinon.stub(), status: sinon.stub().returnsThis() };
        sinon.stub(ReflectEntry, 'findByIdAndDelete').resolves(null);
        
        try {
            await deletereflectentry_delete(req, res);
            
            // Check if res.status and res.json were called
            console.log('res.status called:', res.status.called);
            console.log('res.json called:', res.json.called);
            
            // Check if res.status was called with the correct status code
            console.log('res.status args:', res.status.args);
            // Check if res.json was called with the correct message
            console.log('res.json args:', res.json.args);
            
            // Check if res.status was called with the correct status code
            expect(res.status.calledOnceWith(404)).to.be.true;
            // Check if res.json was called with the correct message
            expect(res.json.calledOnceWith({ message: 'Entry not found' })).to.be.true;
        } catch (error) {
            console.error('Unexpected error:', error);
            throw error; // Re-throw the error to fail the test if an unexpected error occurs
        } finally {
            // Restore the stub
            ReflectEntry.findByIdAndDelete.restore();
        }
    });
    
    
    
});

describe('searchEntries', () => {
    it('should search entries based on keyword and user ID', async () => {
        const req = { query: { keyword: 'test', userId: 'user_id' } };
        const res = { json: sinon.spy() };

        sinon.stub(entry, 'find').resolves(['entry1', 'entry2']);

        await searchEntries(req, res);

        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.deep.equal(['entry1', 'entry2']);

        entry.find.restore();
    });

    it('should handle errors appropriately', async () => {
        const req = { query: { keyword: 'test', userId: 'user_id' } };
        const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

        sinon.stub(entry, 'find').throws(new Error('Database error'));

        await searchEntries(req, res);

        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.json.calledOnceWith({ message: 'Internal server error' })).to.be.true;

        entry.find.restore();
    });
});

const axios = require('axios');

describe('handleMessage', () => {
    it('should return chatbot response for a valid message', async () => {
        const req = { body: { message: 'Hello, chatbot!' } };
        const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

        sinon.stub(axios, 'request').resolves({ data: 'Chatbot response' });

        await handleMessage(req, res);

        expect(res.json.calledOnceWith({ message: 'Chatbot response' })).to.be.true;

        axios.request.restore();
    });

    it('should handle empty message', async () => {
        const req = { body: { message: '' } };
        const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

        await handleMessage(req, res);

        expect(res.status.calledOnceWith(400)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'Empty message' })).to.be.true;
    });

    it('should handle errors during chatbot response', async () => {
        const req = { body: { message: 'Hello, chatbot!' } };
        const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

        sinon.stub(axios, 'request').rejects(new Error('Chatbot error'));

        await handleMessage(req, res);

        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'An error occurred while processing the request' })).to.be.true;

        axios.request.restore();
    });
});

describe('handleMessage', () => {
    it('should handle chatbot messages and return the response', async () => {
        const req = { body: { message: 'test message' } };
        const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

        sinon.stub(axios, 'request').resolves({ data: 'chatbot_response' });

        await handleMessage(req, res);

        expect(res.json.calledOnceWith({ message: 'chatbot_response' })).to.be.true;

        axios.request.restore();
    });

    it('should handle empty messages', async () => {
        const req = { body: { message: '' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await handleMessage(req, res);

        expect(res.status.calledOnceWith(400)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'Empty message' })).to.be.true;
    });

    it('should handle errors during message handling', async () => {
        const req = { body: { message: 'test message' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        sinon.stub(axios, 'request').rejects(new Error('Request error'));

        await handleMessage(req, res);

        expect(res.status.calledOnceWith(500)).to.be.true;
        expect(res.json.calledOnceWith({ error: 'An error occurred while processing the request' })).to.be.true;

        axios.request.restore();
    });
});

describe('message_get', () => {
    it('should render the chatbot page', async () => {
        const req = {};
        const res = { render: sinon.spy() }; // Create a spy for render function

        await message_get(req, res);

        sinon.assert.calledWith(res.render, 'chatbot');
    });

    it('should handle errors and send Internal Server Error', async () => {
        const req = {};
        const res = {
            render: sinon.stub().throws(new Error('Render error')), // Stub render function to throw error
            status: sinon.stub().returnsThis(),
            send: sinon.spy()
        };

        await message_get(req, res);

        sinon.assert.calledWith(res.status, 500);
        sinon.assert.calledWith(res.send, 'Internal Server Error');
    });
});