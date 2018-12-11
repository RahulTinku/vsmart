// server/server.js
const httpClient = require('request');
const express = require('express');
const jsforce = require('jsforce');
const path = require('path');
const session = require('express-session');
//const config = require('./config');
const bodyParser = require('body-parser');
const util = require('util');

// Setup HTTP server
//const app = express();
var router = express.Router();

//initialize session
//app.use(session({secret: 'S3CRE7', resave: true, saveUninitialized: true}));

//bodyParser
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }))

var accessToken;
var instanceUrl;
var refreshToken;

//jsForce connection
const oauth2 = new jsforce.OAuth2({
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl : 'https://cs20.salesforce.com',
    //clientId and Secret will be provided when you create a new connected app in your SF developer account
    clientId : '3MVG9RHx1QGZ7OsjVY6Zj_Kd54l0WY6p8fHnONkRzpdqJbjmWPmHRvAg4e.IsFbEQ0TdaUpPVA8lHJ6ZkpAyl',
    clientSecret : '8404019159664868886',
    //redirectUri : 'http://localhost:' + port +'/token'
    redirectUri : 'http://localhost:8080/token'
});

// Serve static assets
/*app.use(express.static(path.join(__dirname, '../build')));*/

/**
* Login endpoint
*/
router.get("/auth/login", function(req, res) {
  // Redirect to Salesforce login/authorization page
  res.redirect(oauth2.getAuthorizationUrl({scope: 'api id web refresh_token'}));
});


router.get('/', function(req, res, next) {
  res.send('in routes index');
  next();
});


/**
* Login callback endpoint (only called by Force.com)
*/
router.get('/token', function(req, res) {

    const conn = new jsforce.Connection({oauth2: oauth2});
    console.log('code: ', req.query.code);
    const code = req.query.code;
    const time = new Date();
    conn.authorize(code, function(err, userInfo) {
        if (err) { return console.error("This error is in the auth callback: " + err); }

        console.log('Access Token: ' + conn.accessToken);
        console.log('Instance URL: ' + conn.instanceUrl);
        console.log('refreshToken: ' + conn.refreshToken);
        console.log('User ID: ' + userInfo.id);
        console.log('Org ID: ' + userInfo.organizationId);
        console.log('Issued at: ' +  time);

        accessToken = conn.accessToken;
        instanceUrl = conn.instanceUrl;
        refreshToken = conn.refreshToken;    

        req.session.accessToken = conn.accessToken;
        req.session.instanceUrl = conn.instanceUrl;
        req.session.refreshToken = conn.refreshToken;

        var string = encodeURIComponent('true');
        res.redirect('http://localhost:8080/?valid=' + string);
    });
});


router.get('/api/toExtension', function(req, res){

});



//get a list of accounts.
router.get('/api/accounts', function(req, res) {

    const time = new Date();
    console.log('accesstoken',accessToken);
    console.log('instanceUrl',instanceUrl);
    // if auth has not been set, redirect to index
    //if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }

    //SOQL query
    let q = 'SELECT Id, Name FROM Account';

    //instantiate connection
    let conn = new jsforce.Connection({
        oauth2 : {oauth2},
        accessToken: accessToken,
        instanceUrl: instanceUrl
      });
  // var conn = new jsforce.Connection({ oauth2 : oauth2 });

//     var records = [];
// conn.query("SELECT Id, Name FROM Account", function(err, result) {
//   if (err) { return console.error(err); }
//   cobsole.log('result: ', result);
//   console.log("total : " + result.totalSize);
//   console.log("fetched : " + result.records.length);
// });

   //set records array
    let records = [];
    let query = conn.query(q)
       .on("record", function(record) {
         records.push(record);
       })
       .on("end", function() {
           console.log("Accounts")
         console.log("total in database : " + query.totalSize);
         console.log("total fetched : " + query.totalFetched);
         console.log("Completed at: " + time);
         res.json(records);
       })
       .on("error", function(err) {
         console.error(err);
       })
       .run({ autoFetch : true, maxFetch : 4000 });
});

router.get('/api/casesByAccount', function(req, res) {

    const time = new Date();

    // if auth has not been set, redirect to index
   // if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }

    //SOQL query
    let q = "SELECT Name, Id, (SELECT Id, AccountId, CaseNumber, Subject, Status, OwnerId, ContactId, ParentId, ContactEmail FROM Cases) FROM Account WHERE Id IN (SELECT AccountId FROM Case)";

    //instantiate connection
    let conn = new jsforce.Connection({
        oauth2 : {oauth2},
        accessToken: accessToken || req.session.accessToken,
        instanceUrl: instanceUrl || req.session.instanceUrl
   });

   //set records array
    let records = [];
    let query = conn.query(q)
       .on("record", function(record) {
         records.push(record);
       })
       .on("end", function() {
           console.log("Cases by Account");
         console.log("total in database : " + query.totalSize);
         console.log("total fetched : " + query.totalFetched);
         console.log("Completed at: " + time);
         res.json(records);
       })
       .on("error", function(err) {
         console.error(err);
       })
       .run({ autoFetch : true, maxFetch : 4000 });
});

//get account info for selected case
router.get('/api/getAccountInfo', function(req, res){

});

//get case info for selected case
router.get('/api/getCaseInfo', function(req, res){
     //if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }

    //instantiate connection
    let conn = new jsforce.Connection({
        oauth2 : {oauth2},
        accessToken: accessToken || req.session.accessToken,
        instanceUrl: instanceUrl || req.session.instanceUrl
   });

   var c = conn.sobject("Case").retrieve("500m0000007QGU5AAO", function(err, account) {
       if (err) { return console.error('Error: ', err); }
       console.log("Name : " + account.Name);
       // ...
     });
     console.log(c)
});


//create a case
router.post('/api/createCase', function(req, res) {

        // if auth has not been set, redirect to index
        //if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }


        let conn = new jsforce.Connection({
            oauth2 : {oauth2},
            accessToken: accessToken || req.session.accessToken,
            instanceUrl: instanceUrl || req.session.instanceUrl
          });

       //assign request body
       let p = req.body;
       //assign site URL to variable
       let website = p.WebSite;
       console.log('website', website);
       //parse request body to create case object for SF
       console.log('p', p);
      
       let payload = {
            AccountId: p.AccountId,
            Origin: 'Web',
            Subject: p.Subject,
            Description: p.Description,
            SuppliedName: p.SuppliedName,
            SuppliedEmail: p.SuppliedEmail
       }
       //set records array
       let recs = [];
       //set placeholder variable
       let x = '';
       //create query to return account Id
       let q = "SELECT Id FROM Account WHERE WebSite = '" + website + "'";
       conn.query(q)
       .then(res => {x = res.records[0].Id; console.log('This is the account Id: ' + x); return x})
       .then(res => {let y = res;
                     //assign accountId to case object
                     payload.AccountId = y;
                     //use jsForce to create a new case
                     let a = conn.sobject("Case").create(payload,
                           function(err, res) {
                                if (err) { return console.error(err); }

                                for (let i=0; i < res.length; i++) {
                                     if (res[i].success) {console.log("Created record id : " + res[i].id); return res[0].id}
                                }
                      });
                    return a; })
            //get case # and return to client (work in progress)
            .then(result => {recs.push(result); recs.map(rec => {console.log(rec.id); return res.json(rec.id)});});
});

router.post('/api/accountInfo', function(req, res){


     // if auth has not been set, redirect to index
    if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }

    //instantiate connection
    let conn = new jsforce.Connection({
        oauth2 : {oauth2},
        accessToken: req.session.accessToken,
        instanceUrl: req.session.instanceUrl
   });

   let p = req.body;
   console.log(JSON.stringify(p));
   //assign site URL to variable
   let selectedAccount = p.selectedAccount;
   console.log(selectedAccount);
   //parse request body to create case object for SF
   //set records array
   let recs = [];
   //set placeholder variable
   let x = '';
   //create query to return account Id
   let q = "SELECT Name, Account.owner.name, Phone, Website, BillingCity, BillingCountry, BillingPostalCode, BillingState, BillingStreet FROM Account WHERE Id = '" + selectedAccount + "'";
   console.log(q);

   //set records array
    let records = [];
    let query = conn.query(q)
       .on("record", function(record) {
         records.push(record);
       })
       .on("end", function() {
         console.log("total in database : " + query.totalSize);
         console.log("total fetched : " + query.totalFetched);
         res.json(records);
       })
       .on("error", function(err) {
         console.error(err);
       })
       .run({ autoFetch : true, maxFetch : 4000 });
});



//get case to update
router.post('/api/caseToUpdate', function(req, res) {
     //jsforce function update(records, optionsopt, callbackopt)
     // if auth has not been set, redirect to index
     if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }

     let conn = new jsforce.Connection({
         oauth2 : {oauth2},
         accessToken: req.session.accessToken,
         instanceUrl: req.session.instanceUrl
       });

     //assign request body
     let p = req.body;
     console.log(JSON.stringify(p));
     let selectedCase = p.selectedCase;
     console.log("Selected Case on the server side: " + selectedCase);

     //set records array
     let recs = [];
     //set placeholder variable
     conn.sobject("Case").retrieve(selectedCase, function(err, cs) {
        if (err) { return console.error(err); }
        recs.push(cs);
        console.log("Case to update: " + JSON.stringify(recs));
        res.json(recs);
     });
});


//update case
router.post('/api/updateCase', function(req, res) {

        // if auth has not been set, redirect to index
        if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }


        let conn = new jsforce.Connection({
            oauth2 : {oauth2},
            accessToken: req.session.accessToken,
            instanceUrl: req.session.instanceUrl
          });

       //assign request body
       let p = req.body;

       //parse request body to create case object for SF
       let payload = {
            Id: p.CaseId,
            Subject: p.Subject,
            Description: p.Description
       }

       console.log("This is the payload on the server: " + JSON.stringify(payload));
       //set records array
       let recs = [];

       //set placeholder variable
       conn.sobject("Case").update(payload, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            console.log('Updated Successfully : ' + ret.id);
            recs.push(ret.id);
            res.json(recs);
            // ...
       });
});


module.exports = router;

// app.listen(8080, function() {
//   console.log('Server started on Port: 8080' );
// });
