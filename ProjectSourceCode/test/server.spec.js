// ********************** Initialize server **********************************

const server = require("../index"); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require("chai"); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe("Server!", () => {
  // Sample test case given to test / endpoint.
  it("Returns the default welcome message", (done) => {
    chai
      .request(server)
      .get("/welcome")
      .end((err, res) => {
        console.log("Test: " + res.body.status);
        console.log(res.body);
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals("success");
        assert.strictEqual(res.body.message, "Welcome!");
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

describe('Testing Add manager API', () => {
  it('Positive :Registers a new manager successfully', done => {
    chai
      .request(server)
      .post('/registerManager')
      .send({username: 'test0', password: 'test0', confirmpassword: 'test0', firstname: 'test0', lastname: 'test0', branch: 'test0', manager:'manager0'})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.redirectTo(new RegExp('/login$'));
        done();
      });
  });
});

describe('Testing Adding Invalid manager API', () => {
  it('Negitive : Checks Password matching Functionality', done => {
    chai
      .request(server)
      .post('/registerManager')
      .send({username: 'test1', password: 'test1', confirmpassword: 'test', firstname: 'test1', lastname: 'test1', branch: 'test1', manager:'manager0'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include("Passwords do not match");
        done();
      });
  });
});

describe('Testing Adding already added manager API', () => {
  it('Negitive : Checks User existance Functionality', done => {
    chai
      .request(server)
      .post('/registerManager')
      .send({username: 'test0', password: 'test0', confirmpassword: 'test0', firstname: 'test0', lastname: 'test0', branch: 'test0', manager:'manager0'})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.text).to.include("Username taken");
        done();
      });
  });
});

describe('Testing Valid Login Functionality', () => {
  it('Positive : User is loged in', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'test0', password: 'test0', manager: true})
      .end((err, res) => {
        console.log(res.body);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals("Logged in succesfully");
        done();
      });
  });
});

describe('Testing Invalid Login Functionality', () => {
  it('Negitive : User is not logged in', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'test0', password: 'test', manager: true})
      .end((err, res) => {
        console.log(res.body);
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.text).to.include("Incorrect Password");
        done();
      });
  });
});