const sinon = require('sinon');
const chai = require('chai');
const { expect } = chai;
const { mockReq, mockRes } = require('sinon-express-mock');
const mongoose = require('mongoose');
const {requireAuth} = require('../middlewares/authMiddlewares'); // Assuming the requireAuth middleware is implemented in a separate file

const jwt = require('jsonwebtoken');
const {app, connection}  = require('../index'); // Adjust the path as per your file structure
const request = require('supertest');

describe('GET /', () => {
    it('should render userhome if token exists and valid', (done) => {
        const validToken = 'valid_token';
        request(app)
            .get('/')
            .set('Cookie', `jwt=${validToken}`)
            .expect('Content-Type', /html/)
            .expect(200)
            .expect((res) => {
                // Assert the response here
                expect(res.text).to.include('userhome'); // Check if the response contains 'userhome'
            })
            .end(done);
    });
    
    it('should render login page if token is invalid', (done) => {
        const invalidToken = 'invalid_token';
        request(app)
            .get('/')
            .set('Cookie', `jwt=${invalidToken}`)
            .expect('Content-Type', /html/)
            .expect(200)
            .expect((res) => {
                // Assert the response here
                expect(res.text).to.include('login'); // Check if the response contains 'login'
            })
            .end(done);
    });
    
    it('should render main page if no token is provided', (done) => {
        request(app)
            .get('/')
            .expect('Content-Type', /html/)
            .expect(200)
            .end(done);
    });
});


describe('Database connection', () => {
    let mongooseStub;
    let consoleLogStub;
    let listenstub;

    before(() => {
        mongooseStub = sinon.stub(mongoose, 'connect');
        consoleLogStub = sinon.stub(console, 'log');
        listenstub = sinon.stub(app, 'listen').resolves(); // Stub the listen method to resolve immediately
    });

    afterEach(() => {
        mongooseStub.reset();
    });

    after(() => {
        mongooseStub.restore();
        consoleLogStub.restore();
        listenstub.restore(); // Restore the stub for app.listen
    });

    it('should successfully connect to the database', async () => {
        mongooseStub.resolves(); // Resolve without an error to simulate successful connection

        await connection();
        // console.log('Mongoose connected'); // Add a logging statement for debugging
        // await app.listen();

        sinon.assert.calledOnce(mongooseStub);
        sinon.assert.calledOnce(listenstub);
        sinon.assert.calledOnce(consoleLogStub);
    });

    it('should handle database connection error', async () => {
        const error = new Error('Connection error');
        mongooseStub.rejects(error); // Reject with an error to simulate connection error
        const consoleErrorStub = sinon.stub(console, 'error');
    
        try {
            await connection();
        } catch (err) {
            console.error('Error caught:', err); // Add this log statement
            sinon.assert.calledOnce(mongooseStub);
            sinon.assert.calledOnce(consoleErrorStub);
            // sinon.assert.calledWithExactly(consoleErrorStub, 'Error connecting to the database:', error);
            consoleErrorStub.restore();
        }
    });
});

// describe('GET /userhome', () => {
//     it('should respond with status 200 and render userhome template when authenticated', async () => {
//         const validToken = jwt.sign({ id: 1, username: 'testuser', email: 'test@example.com' }, 'secret');

//         const response = await request(app)
//             .get('/userhome')
//             .set('Cookie', `jwt=${validToken}`);

//         await requireAuth(req,res,next);
//         expect(response.status).to.equal(200);

//         // Assert that the userhome template is rendered
//         expect(response.text).to.include('userhome'); // Assuming 'userhome' is present in the rendered HTML
//     });
// });
