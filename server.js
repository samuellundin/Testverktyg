//Import all modules
const fs = require('fs');                                       //File system
const path = require('path');                                   //Path to find local paths on the server
const express = require('express');                             //Express
const exphbs = require('express-handlebars');                   //Handlebars template engine for express
const bodyparser = require('body-parser');                      //Parse URL bodies
const mysql = require('mysql');                                 //Use MySQL
const session = require('client-sessions');                     //Use sessions with cookies
const sql = require('./public/js/sql.js');                      //Our own library with some SQL code
const dcopy = require('deepcopy');                              //Deep copy objects properly
const async = require('async');                                 //Makes async programming easier
const mailer = require('express-mailer');                       //Send emails
const pdf = require('handlebars-pdf');                          //Generate PDFs
const pdfTemplate = require('./public/js/pdf-template.js');     //The template we made for the PDFs
const key = 'dsfdsfdsfds3432432sdfdsf';                         //The key with which we encrypt passwords
const encryptor = require('simple-encryptor')(key);             //The encryptor

//Create the express app
const app = express();

//Configure the app to look for static files (javascript, css) in the /public folder
app.use(express.static(path.join(__dirname, '/public')));

//Configure the app to use express-handlebars as the template engine
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layout'),
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

//Configure the app to parse urlencoded information into objects
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

//configure the app to use session
app.use(session({
    cookieName: 'session',
    secret: 'secret',
    duration: 60 * 60 * 1000,
    activeDuration: 15 * 60 * 1000
}));

//Configure the app to only let you visit these pages if you are not logged in
app.use(function(req, res, next){
    if(!req.session.id
        && (req.url != '/'
        && req.url != '/register'
        && req.url != '/api/users'
        && req.url != '/login')){
        req.session.err = 'You are not logged in';
        res.redirect('/');
    } else {
        next();
    }
})

//Configure the app to listen on port 3000
app.listen(3000);

//Set up the mail module to send data through this connection and with these login details
mailer.extend(app, {
    from: 'info@testverktyg.com',
    host: 'smtp.gmail.com', // hostname
    secureConnection: true, // use SSL
    port: 465, // port for secure SMTP
    transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
    auth: {
        user: 'testverktyg1@gmail.com',
        pass: 'verktyg1234'
    }
});

//APP REQUESTS/END POINTS
//----------------------------------------------------------------------------------------------------------------------------------
//Get Index
app.get('/', function(req, res, next){
        res.render('index', req.session);
        delete req.session.err;
});

//Get Login
app.get('/login', function(req, res, next){
    res.render('login');
});

//Post login
//This function takes the entered details and tries to fetch the matching data from the database
//if it is found then the credentials are compared.
app.post('/login', function(req, res){
    sql.connection.query("SELECT * FROM User WHERE Mail = '" + req.body.email.toLowerCase() +"'", function(err, result){
        if(err || result[0] == null){
            req.session.err = 'Fel epost eller lösenord';
            delayRedirect(res, 200);
            return;
        }
        //If email exists and passwords match, set the session-cookie information
        if(encryptor.decrypt(result[0].Password) == req.body.password){
            req.session.fName = result[0].FirstName;
            req.session.email = result[0].Mail;
            req.session.role = result[0].Role;
            req.session.id = result[0].UserId;
            setupRole(req);
            delayRedirect(res, 200);
        } else {
            req.session.err = 'Fel epost eller lösenord';
            delayRedirect(res, 200);
        }
    });
});

//Get Create
app.get('/create', function(req, res){
    if(checkAccess(req, 'teacher') || checkAccess(req, 'admin')){
        res.render('create', req.session);
    } else {
        req.session.err = 'Permission denied';
        res.redirect('/');
    }
});

//Post create
//Adds a test, sends the information to a function in the sql.js-file
app.post('/create', function(req, res){
    sql.addTest(req.body.data, req.body.questions, req.body.answers);
    res.send('Yay');
});

//Get copyMenu
//A menu where you get to choose what test to copy from
app.get('/copyMenu', function(req, res){
    sql.connection.query('SELECT * FROM Test WHERE TUserId = ' + mysql.escape(req.session.id), function(error, result){
        req.session.tests = result;
        res.render('copyMenu', req.session);
    })
});

//Go to the "create"(edit)-page for a certain test that you copied
app.get('/copy=:id', function(req, res){
    req.session.copy = true;
    res.redirect('/edit=' + req.params.id);
});

//Get logout
app.get('/logout', function(req, res){
    req.session.reset();
    res.send('index');
});

//Get API users
//Shows you all users in your database
app.get('/api/users', function(req, res){
    sql.connection.query('SELECT * FROM User', function(err, result){
        res.send(result);
    });
});

app.post("/_studentIndex", function(req, res) {
    console.log("hej");
    res.render("results", req.session);
});

//Get results
//Gets results for all tests that are corrected and can be viewed for the logged in person
app.get("/results", function(req, res) {
    sql.connection.query("SELECT Results.*, TestComment.TestComment FROM Results LEFT OUTER JOIN TestComment ON Results.AnsweredTestId = TestComment.TCATestId "
        + ' WHERE ATCorrected = 1 AND ATUserId = ' + req.session.id + ' AND ATShowResult = 1', function(error, result) {
        console.log(result);
        req.session.tests = dcopy(result);
        res.render("results", req.session);
    });
});

//Lets a student see his test and all the correct answers
app.get('/testResult=:testId', function(req, res){
    var data = {};
    getAnsweredTest(data, req.params.testId, req.session.id);
    req.session.testResult = data;
    setTimeout(function(){
        res.render('correctedTest', req.session);
    }, 500);

})

//Get editMenu
//Choose the test that you want to edit
app.get("/editMenu", function(req, res) {
    sql.connection.query('SELECT * FROM Test WHERE TUserId = ' + mysql.escape(req.session.id), function(error, result){
        req.session.tests = result;
        res.render('editMenu', req.session);
    })
});

//Gets all information for the test with id :testId and renders the edit-page with that information.
app.get("/edit=:testId", function(req, res) {
    var test = {};
    //Select the test-information
    sql.connection.query('SELECT * FROM Test WHERE TestId = ' + req.params.testId, function(err1, res1){
        if(err1) throw err1;
        test = dcopy(res1[0]);
        var questions;
        //Select all the questions associated with that test
        sql.connection.query('SELECT Questions.*, pictureURL.PURL FROM Questions '
        + 'LEFT OUTER JOIN pictureURL ON pictureURL.PQuestionId = Questions.QuestionId WHERE QTestId = ' + req.params.testId, function(error, result){
            if(error) throw error;
            questions = dcopy(result);
            var j = 0;
            for(var i = 0; i < questions.length; i++){
                //For every question, get the associated answers
                sql.connection.query('SELECT * FROM Answers WHERE AQuestionId = ' + questions[i].QuestionId, function(err2, res2){
                    if(err2) throw err2;
                    questions[j++].answers = res2;
                    if(j == questions.length){
                        //When the loop has finished finish off by putting the Test-object together with all results
                        //and putting it in our session-cookie.
                        sql.connection.query('SELECT p.*, q.QTestId FROM pictureURL AS p '
                        + 'INNER JOIN Questions AS q ON p.PQuestionId = q.QuestionId WHERE QTestId = ' + req.params.testId, function(err3, res3){
                            test.questions = questions;
                            test.picURLS = dcopy(res3);
                            req.session.test = test;
                            res.render('edit', req.session);
                            req.session.copy = false;
                        })
                    }
                })
            }
        })
    })
});

//Update an edited test
app.post('/edit', function(req, res){
    sql.updateTest(req.body.data, req.body.questions, req.body.answers);
    res.send('Yay');
});

//Get share
//Displays the page where you share a test with a student or a group
app.get("/share", function(req, res) {
    updateSessionTests(req);
    sql.connection.query("SELECT * FROM StudentGroup", function(error, result){
        if(error) throw error;
        req.session.studentGroups = dcopy(result);
    })
    sql.connection.query("SELECT * FROM User WHERE Role = 'student'", function(error, result) {
       if(error) throw error;
       req.session.students = dcopy(result);
    });
    sql.connection.query(`
    SELECT GD.GroupDetailsId, GD.GDStudentGroupId, SG.GroupName, U.UserId, U.FirstName, U.Mail
    FROM GroupDetails AS GD
    INNER JOIN User AS U ON GD.GDUserId = U.UserId
    INNER JOIN StudentGroup AS SG ON GD.GDStudentGroupId = SG.StudentGroupId`, function(error, result) {
        if(error) throw error;
        req.session.groupdetails = dcopy(result);
    });
    setTimeout(function(){
        res.render("share", req.session);
    }, 200);
});

//Post share
//Sends a mail to everybody you shared the test with
app.post('/share', function (req, res) {

    for(var i = 0; i < req.body.id.length; i++) {
        sql.connection.query('INSERT INTO TestAccess (TAUserId, TATestId) VALUES (' +
            mysql.escape(req.body.id[i]) + ',' + mysql.escape(req.body.testId) + ')', function(error){
            if(error) throw error;
        });
    }

    app.mailer.send('email', {
        layout: false,
        to: req.body.mail, // REQUIRED. This can be a comma delimited string just like a normal email to field.
        subject: 'Nytt test att göra!', // REQUIRED.
        name: req.body.namn,
        testName: req.body.test,
        testDate: req.body.endDate.slice(0, -3) // All additional properties are also passed to the template as local variables.
    }, function (err) {
        if (err) {
            // handle error
            console.log(err);
            res.send('There was an error sending the email');
            return;
        }
        res.send('Email Sent');
    });
});

//Get statistics
app.get("/statistics", function(req, res) {
    updateSessionTests(req);
    updateSessionGroups(req);

    setTimeout(function(){
        res.render("statistics", req.session);
    }, 200);
});

//Post statistics
app.post("/statistics", function(req, res) {
    req.session.statsObject = {};
    req.session.statsObject.groupName = dcopy(req.body.groupName);
    req.session.statsObject.TTitle = dcopy(req.body.tTitle);

    //Saves nr of group members
    sql.connection.query("SELECT COUNT(GroupDetails.GDUserId) AS GDUserIdCount FROM GroupDetails" +
    " WHERE GDStudentGroupId = " + req.body.groupId, function(error, result) {
        if(error) throw error;
        req.session.statsObject.GDUserIdCount = dcopy(result[0].GDUserIdCount);
    });

    //Saves nr of answered tests
    setTimeout(function(){
        sql.connection.query("SELECT COUNT(AnsweredTest.ATUserId) AS ATUserIdCount FROM AnsweredTest" +
        " INNER JOIN GroupDetails" +
        " ON AnsweredTest.ATUserId = GroupDetails.GDUserId " +
        " WHERE AnsweredTest.ATestId = " + req.body.testId +
        " AND GroupDetails.GDStudentGroupId = " + req.body.groupId, function(error, result) {
            if(error) throw error;
            req.session.statsObject.ATUserIdCount = dcopy(result[0].ATUserIdCount);
        });
    }, 100)

    //Saves nr of passed tests
    setTimeout(function(){
        sql.connection.query("SELECT COUNT(AnsweredTest.ATGrade) AS ATGradeCount FROM AnsweredTest" +
        " INNER JOIN GroupDetails" +
        " ON AnsweredTest.ATUserId = GroupDetails.GDUserId" +
        " WHERE AnsweredTest.ATestId = " + req.body.testId +
        " AND (AnsweredTest.ATGrade = 'G' OR AnsweredTest.ATGrade = 'VG')" +
        " AND GroupDetails.GDStudentGroupId = " + req.body.groupId, function(error, result) {
            if(error) throw error;
            req.session.statsObject.ATGradeCount = dcopy(result[0].ATGradeCount);
        });
    }, 200)

    //Saves max points for test and avg scores
    setTimeout(function(){
        sql.connection.query("SELECT TMaxPoints FROM Test WHERE TestId = " + req.body.testId, function(error, result) {
            if(error) throw error;
            req.session.statsObject.TMaxPoints = dcopy(result[0].TMaxPoints);
        });
        sql.connection.query("SELECT AVG(AnsweredTest.ATPoints) AS ATPointsAvg FROM AnsweredTest" +
        " INNER JOIN GroupDetails" +
        " ON AnsweredTest.ATUserId = GroupDetails.GDUserId" +
        " WHERE AnsweredTest.ATestId = " + req.body.testId +
        " AND GroupDetails.GDStudentGroupId = " + req.body.groupId, function(error, result) {
            if(error) throw error;
            req.session.statsObject.ATPointsAvg = dcopy(result[0].ATPointsAvg);
        });
    }, 300)

    //Saves max time for test and avg time
    setTimeout(function(){
        sql.connection.query("SELECT TTimeMin FROM Test WHERE TestId = " + req.body.testId, function(error, result) {
            if(error) throw error;
            req.session.statsObject.TTimeMin = dcopy(result[0].TTimeMin);
        });
        sql.connection.query("SELECT AVG(AnsweredTest.ATTimeSec) AS ATTimeSecAvg FROM AnsweredTest" +
        " INNER JOIN GroupDetails" +
        " ON AnsweredTest.ATUserId = GroupDetails.GDUserId" +
        " WHERE AnsweredTest.ATestId = " + + req.body.testId +
        " AND GroupDetails.GDStudentGroupId = " + req.body.groupId, function(error, result) {
            if(error) throw error;
            req.session.statsObject.ATTimeSecAvg = dcopy(result[0].ATTimeSecAvg);
        });
    }, 400)

    setTimeout(function(){
        res.render("statistics", req.session);
    }, 450)
});

//Get testMenu
//The menu where you choose what test you want to do
app.get("/testMenu", function(req, res) {
    sql.connection.query("SELECT * FROM Test " +
    "INNER JOIN TestAccess ON Test.TestId = TestAccess.TATestID " +
    "WHERE (TestAccess.TAUserId = " + req.session.id + ")" +
    "AND (Test.TestId NOT IN (SELECT AnsweredTest.ATestId FROM AnsweredTest " +
    "WHERE AnsweredTest.ATUserId = " + req.session.id + "))", function(error, result) {
        var tests = [];
        //Loop through all tests not answered by you, and check if this date is within the start and end dates for the test
        //if it is then push that testinfo on to the array sent to the client
        for(var i = 0; i < result.length; i++){
            var now = new Date();
            var open = new Date(result[i].TStartTestDate);
            var close = new Date(result[i].TEndTestDate);
            if( open < now < close ){
                tests.push(result[i]);
            }
        }
        req.session.tests = dcopy(tests);
        res.render("testMenu", req.session);
    });
});

//Get test=:id
//Select all information from a specific test and send it to the client
app.get("/test=:testIdLink", function(req, res) {
    async.waterfall([
        function(callback){
            sql.connection.query("SELECT * FROM Test WHERE TestId = " + mysql.escape(req.params.testIdLink), function(error, result) {
                if(error) throw error;
                req.session.test = dcopy(result[0]);
            callback(null)});
        },
        function(callback){
            sql.connection.query("SELECT * FROM Questions WHERE QTestId = " + mysql.escape(req.session.test.TestId), function(error2, result2) {
                if(error2) throw error2;
                req.session.questions = dcopy(result2);
                for(var j = 0; j < result2.length; j++){
                    var k = 0;
                    sql.connection.query("SELECT * FROM Answers WHERE AQuestionId = " + mysql.escape(req.session.questions[j].QuestionId) + " ORDER BY Rand()", function(error3, result3) {
                        if(error3) throw error3;
                        req.session.questions[k].answers = dcopy(result3);
                        k++;
                    })
                }
            })
        callback(null)},
        function(callback){
            setTimeout(function(){
                //When the test is fully loaded, get the picture URLs and then render the page
                sql.connection.query('SELECT p.*, q.QTestId FROM pictureURL AS p '
                    + 'INNER JOIN Questions AS q ON p.PQuestionId = q.QuestionId WHERE QTestId = ' + req.params.testIdLink, function(err3, res3){
                    req.session.picURLS = dcopy(res3);
                    res.render('test', req.session);
                });
            }, 600)
        }

    ], function(error){
        if(error) throw error;
    })
});

//Turn in an answered test
//'Turn in' a test that you've answered. Sends the information to the SQL library to be added to the database.
app.post('/turnin', function(req, res){
    req.body.UAQuestions.TestId = req.body.takenTest.ATestId;
    req.body.userAnswers.TestId = req.body.takenTest.ATestId;
    req.body.UAQuestions.UserId = req.body.takenTest.ATUserId;
    req.body.userAnswers.UserId = req.body.takenTest.ATUserId;
    sql.addUserAnsweredTest(req.body.takenTest);
    sql.addUserQuestions(req.body.UAQuestions);
    setTimeout(function(){
        sql.addUserAnswers(req.body.userAnswers, checkIfSelfCorrecting);
    }, 500);
    res.redirect('/');
});

//Get register
app.get("/register", function(req, res) {
    res.render("register", req.session);
});

//Get reg
app.get('/reg', function(req, res) {
    res.render('reg', req.session);
});

//Post reg
app.post('/reg', function(req, res){
    sql.connection.query('INSERT INTO Registration (REmail, RRole) VALUES (' + mysql.escape(req.body.mail) + ", " + mysql.escape(req.body.role) + ")", function(error, result){
        if(error) throw error;
        app.mailer.send('emailInvitation', {
            layout: false,
            to: req.body.mail, // REQUIRED. This can be a comma delimited string just like a normal email to field.
            subject: 'Du har blivit inbjuden till Newtons Testverktyg', // REQUIRED.
            role: req.body.role,
        }, function (err) {
            if (err) {
                // handle error
                console.log(err);
                res.send('There was an error sending the email');
                return;
            }
        });
        res.redirect('/reg');
    });
})

//Post register
//Registers a person to the database
app.post("/register", function(req, res) {
    var encrypted = encryptor.encrypt(req.body.password);
    if(!req.session.admin){
        sql.connection.query('SELECT * FROM Registration WHERE REmail = ' + mysql.escape(req.body.mail), function(error, result){
            if(result.length != 0){
                sql.addUser(req.body.fName[0].toUpperCase() + req.body.fName.slice(1), req.body.lName[0].toUpperCase() + req.body.lName.slice(1), req.body.mail.toLowerCase(), encrypted, result[0].RRole);
            } else {
                req.session.err = 'Sorry, you have not been invited to register for this website';
            }
        })
    } else {
        sql.addUser(req.body.fName[0].toUpperCase() + req.body.fName.slice(1), req.body.lName[0].toUpperCase() + req.body.lName.slice(1), req.body.mail.toLowerCase(), encrypted, req.body.role);
    }
    res.redirect("/");
});

//Get group
app.get('/group', function(req, res) {
    var userList = "";
    sql.connection.query('SELECT * FROM User WHERE Role = "student"', function(err, result) {
        if(err){
            console.log(err);
        }
        else{
            req.session.elever = dcopy(result);
            res.render('group', req.session);
            delete req.session.elever;
        }
    })
});

//Create group
app.post('/group', function(req, res){
    sql.connection.query('INSERT INTO StudentGroup (groupName) VALUES (' + mysql.escape(req.body.title) + ')', function(error, result){
        if(error) throw error;
    });

    sql.connection.query('SELECT StudentGroupId FROM StudentGroup WHERE groupName = ' + mysql.escape(req.body.title), function(error, result){
        if(error) throw error;
        var id = result[0].StudentGroupId;
        for(var i = 0; i < req.body.ids.length; i++){
            sql.connection.query('INSERT INTO GroupDetails (GDStudentGroupId, GDUserId) VALUES (' + id + ', ' + req.body.ids[i] + ')', function(error, res){
                if (error) throw error;
            })
        }
    })
    res.send('Yay');
});

//Takes you to the page where you select what test and what user to generate a PDF for
app.get('/createpdf', function(req, res){
    // Get testdata for Combobox
    sql.connection.query('SELECT * FROM Test', function(err, result) {
        var test;
        var tests = [];

        for(var i = 0; i < result.length; i++){
            test = {testid: result[i].TestId, testname: result[i].TTitle}
            tests.push(test);
        }
        req.session.tests = dcopy(tests);
    });
    // Get userdata for combobox
    sql.connection.query('SELECT User.FirstName, User.UserId, AnsweredTest.ATestId, AnsweredTest.AnsweredTestId FROM User INNER JOIN AnsweredTest ON AnsweredTest.ATUserID=User.UserID WHERE AnsweredTest.ATCorrected = 1', function(err, result) {
        var user;
        var users = [];

        for(var i = 0; i < result.length; i++){
            user = {userid: result[i].ATestId, username: result[i].FirstName, atId: result[i].UserId}
            users.push(user);
        }
        req.session.users = dcopy(users);
        setTimeout(function(){
            res.render('pdf', req.session);
        }, 500);
    });
})

//Generate the actual PDF
app.post('/createpdf', function(req, res){
    var data = {};
    getAnsweredTest(data, req.body.testid, req.body.userid);

    setTimeout(function(){
        let document = {
            template: pdfTemplate.pdfTemplate,
            context: data,
            path: __dirname + '/public/pdf/' + data.test.FirstName + data.test.LastName + data.test.TTitle +'.pdf'
        }

        pdf.create(document)
            .then(result => {})
            .catch(error => {
                console.error(error)
            })
        res.send('Here I am!');
    }, 500);

});

//Download the PDF. Couldn't use the download-function in a post-method end point, therefore we had to create
//this get-end point.
app.get('/downloadPDF', function(req, res){
    setTimeout(function(){
        fs.readdir(__dirname + '/public/pdf/', (err, files) => {
            files.forEach(file => {
                res.download('./public/pdf/' + file);
                setTimeout(function(){
                    fs.unlink('./public/pdf/' + file, function(){});
                }, 3000)
            });
        }, function(){})
    }, 3000);
})



//Get correcting
//Gets all data and renders the page for manually correcting a test
app.get('/correcting', function(req, res) {

    // Get testdata for Combobox
    sql.connection.query('SELECT * FROM Test WHERE TUserId = ' + req.session.id, function(err, result) {
        var test;
        var tests = [];

        for(var i = 0; i < result.length; i++){
            test = {testid: result[i].TestId, testname: result[i].TTitle}
            tests.push(test);
        }
        req.session.tests = dcopy(tests);
    });
    // Get userdata for combobox
    sql.connection.query('SELECT User.FirstName, AnsweredTest.ATestId, AnsweredTest.AnsweredTestId FROM User INNER JOIN AnsweredTest ON AnsweredTest.ATUserID=User.UserID WHERE AnsweredTest.ATCorrected = 0', function(err, result) {
        var user;
        var users = [];

        for(var i = 0; i < result.length; i++){
            user = {userid: result[i].ATestId, username: result[i].FirstName, atId: result[i].AnsweredTestId}
            users.push(user);
        }
        req.session.users = dcopy(users);
    });

    sql.connection.query(`
        SELECT T.TestId, Q.QuestionId, Q.QOrder, Q.Question, Q.QType, Q.QPoints, A.AText, A.APoints FROM Test AS T
        INNER JOIN Questions AS Q ON T.TestId = Q.QTestId
        INNER JOIN Answers AS A ON Q.QuestionId = A.AQuestionId`, function(err, result) {

        var testDataWrapper = {};
        var testdata = [];


            sql.connection.query('SELECT * FROM QuestionAnswers', function(error2, result2){
                for(var i = 0; i < result.length; i++) {
                testdata.push({
                    testId: result[i].TestId,
                    questionId: result[i].QuestionId,
                    questionOrder: result[i].QOrder,
                    questionText: result[i].Question,
                    questionType: result[i].QType,
                    questionPoints: result[i].QPoints,
                    answerText: result[i].AText,
                    answerCorrect: result[i].APoints,
                    userAnswers: dcopy(result2)
                    });
                }
                req.session.testdata = testdata;
            })
    });
    setTimeout(function () {
        res.render('correcting', req.session);
    }, 500);
});

//Updates an AnsweredTest with the given points and adds comments from the teacher
app.post('/correct', function(req, res){
    updateTestScore(req.body.TestId, req.body.TakenTestId, req.body.points, true);
    if(req.body.comments){
        sql.addComments(req.body.comments);
    }

    if(req.body.testComment){
        sql.addTestComment(req.body.testComment);
    }

    for(var i = 0; i < req.body.updatePoints.length; i++){
        sql.connection.query('UPDATE AnsweredQuestion SET AQPoints = ' + mysql.escape(req.body.updatePoints[i].points) + ' WHERE AnsweredQuestionId = ' + mysql.escape(req.body.updatePoints[i].AQId), function(err, res){
            if(err) throw err;
        })
    }
    res.send('party');
});




//HELPER FUNCTIONS
//----------------------------------------------------------------------------------------------------------------------------------
//Check if the test is self correcting, if it is then send it for autocorrect
function checkIfSelfCorrecting(testId, takenTestId){
    sql.connection.query('SELECT Test.TSelfCorrecting FROM Test WHERE TestID = ' + testId, function(error, result){
        if(error) throw error;
        if(result[0].TSelfCorrecting){
            autoCorrect(testId, takenTestId);
        }
    });
}

//Corrects a test automatically
function autoCorrect(testId, takenTestId){
    var points = 0;
    //Get all questions for the specified testId
    sql.connection.query('SELECT * FROM Questions WHERE QTestId = ' + testId, function(error, result){
        if (error) throw error;
        var k = 0;
        for(var i = 0; i < result.length; i++){
            var resultArray = [];
            //For every question, get the answered question associated with it
            sql.connection.query('SELECT * FROM QuestionAnswers WHERE AnsweredTestId = ' + takenTestId + ' AND AQuestionId = ' + result[i].QuestionId, function(err, res){
                resultArray.push(dcopy(res));
                //Correct the questions differently depending on what type of question it is
                switch(result[k].QType){
                    case 'Flervalsfråga':
                        var correct = true;
                        var fi = k;
                        sql.connection.query('SELECT * FROM Answers WHERE AQuestionId = ' + result[fi].QuestionId + ' AND APoints = 1', function(err2, res2){
                            if(err2) throw err2;
                            var indexes = [];
                            for(var j = 0; j < res2.length; j++){
                                indexes.push(res2[j].AnswersId);
                            }
                            for(var j = 0; j < indexes.length; j++){
                                var found = false;
                                for(var h = 0; h < resultArray[fi].length; h++){
                                    if(resultArray[fi][h].UAAnswersId == indexes[j]){
                                        found = true;
                                    }
                                }
                                if(!found){
                                    correct = false;
                                }
                            }
                            if(correct){
                                sql.connection.query('UPDATE AnsweredQuestion SET AQPoints = ' + result[fi].QPoints + ' WHERE AnsweredQuestionId = ' + res[0].UAQuestionId, function(error2, result2){
                                    points += result[fi].QPoints;
                                } );
                            }
                        });
                        break;
                    case 'Alternativfråga':
                        var ai = k;
                        if(resultArray[ai][0].APoints == 1){
                            sql.connection.query('UPDATE AnsweredQuestion SET AQPoints = ' + result[ai].QPoints + ' WHERE AnsweredQuestionId = ' + res[0].UAQuestionId, function(error2, result2){
                                points += result[ai].QPoints;
                            } );
                        }
                        break;
                    case 'Rangordningsfråga':
                        var ri = k;
                        sql.connection.query('SELECT UAOrder, AOrder FROM QuestionAnswers WHERE AQuestionId = ' + result[ri].QuestionId + ' AND AnsweredTestId = ' + takenTestId, function(err2, res2){
                            if(err2) throw err2;
                            var correct = true;
                            console.log(res2);
                            for(var ind = 0; ind < res2.length; ind++){
                                if(res2[ind].AOrder != res2[ind].UAOrder){
                                    console.log(res2[ind].AOrder + " " + res2[ind].UAOrder);
                                    correct = false;
                                    break;
                                }
                            }
                            if(correct){
                                sql.connection.query('UPDATE AnsweredQuestion SET AQPoints = ' + result[ri].QPoints + ' WHERE AnsweredQuestionId = ' + res[0].UAQuestionId, function(error2, result2){
                                    points += result[ri].QPoints;
                                });
                            }
                        });
                        break;
                    //An open question should never be able to happen in auto correct, this means something is wrong.
                    case 'Öppen fråga':
                        console.log("Something's wrong. This shouldn't be able to happen. Can't auto correct an open question.");
                        return;
                }
                k++;
                if(k==result.length){
                    //Wait a bit for everything to finish, then update with the corrected results
                    setTimeout(function(){
                        updateTestScore(testId, takenTestId, points);
                    }, 1000);
                }
            })

        }
    })
}

//Updates score in AnsweredTest and decides what grade a person got
function updateTestScore(testId, takenTestId, points, showResult){
    sql.connection.query('SELECT TMaxPoints, TDisplayResult FROM Test WHERE TestId = ' + testId, function(error, result){
        var mPoints = result[0].TMaxPoints;
        var percentage = (points/mPoints) * 100;
        var grade = 'U';
        if(percentage > 80){
            grade = 'VG';
        } else if (percentage > 60){
            grade = 'G';
        }
        sql.connection.query('UPDATE AnsweredTest SET ATPoints = ' + points + ", ATGrade = " + mysql.escape(grade) + ", ATCorrected = TRUE, ATShowResult = "+ (showResult || result[0].TDisplayResult) +" WHERE AnsweredTestId = " + takenTestId, function(err, res){if (err) throw err;});
    });
}

//Updates session with tests from database
function updateSessionTests(req) {
    sql.connection.query("SELECT TTitle,TestId,TEndTestDate FROM Test", function(error, result) {
        req.session.tests = dcopy(result);
    });
}

//Updates session with groups
function updateSessionGroups(req) {
    sql.connection.query("SELECT * FROM StudentGroup", function(error, result) {
        req.session.group = dcopy(result);
    });
}

//Sets our session variable to know what role our user has
function setupRole(req){
    switch (req.session.role){
        case 'student':
            req.session.student = true;
            break;
        case 'teacher':
            req.session.teacher = true;
            break;
        case 'admin':
            req.session.admin = true;
            break;
    }
    req.session.copy = false;
}

//Checks whether the session role matches the target role
function checkAccess(req, targRole) {
    return req.session.role === targRole;
}

//Delays a redirect. This is to give time for other functions to finish before loading in the page
function delayRedirect(res, delay){
    setTimeout(function(){
        res.sendStatus(200);
    }, delay);
}

//Gets all information needed to put together a PDF. This means almost all data available relating to an answered test.
function getAnsweredTest(data, testId, userId){
    var test = {};
    //Get information from the view PDFtest, which is stuff from the Test, AnsweredTest and User tables.
    sql.connection.query('SELECT * FROM PDFtest WHERE TestId = ' + mysql.escape(testId) + ' AND UserId = ' + mysql.escape(userId), function(err, res){
        if(err) throw err;
        test = dcopy(res[0]);
        test.ATDate = test.ATDate.slice(0, -3);
        var question = {};
        var questions = [];
        //Get all questions for this testId
        sql.connection.query('SELECT * FROM Questions WHERE QTestId = ' + mysql.escape(testId), function(error, result){
            if(error) throw error;
            //For every question, add the associated answered questions and user answers
            for(var i = 0; i < result.length; i++){
                addStuff(result, i, question, questions, test, data);
            }
            //Get the testcomment associated with this test. If there is one then add it to the dataobject sent to the client
            sql.connection.query('SELECT * FROM TestComment WHERE TCATestId = ' + mysql.escape(test.AnsweredTestId), function(error3, result3){
                if(error3) throw error3;
                if(result3.length != 0){
                    test.testComment = dcopy(result3[0]);
                }
            })
        })
    })

    //Adds all things associated with a specific question for a specific test
    function addStuff(result, k, question, questions, test, data){
        question = dcopy(result[k]);
        //Get all answeredquestions for this question
        sql.connection.query('SELECT * FROM AnsweredQuestion WHERE AQQuestionId = ' + mysql.escape(question.QuestionId) + ' AND AQAnsweredTestId = ' + mysql.escape(test.AnsweredTestId), function(err2, res2){
            if(err2) throw err2;
            question.answeredQuestion = dcopy(res2[0]);
            //Get the comment associated with this question, if there is one
            sql.connection.query('SELECT * FROM QuestionComment WHERE QCQuestionId = ' + mysql.escape(question.answeredQuestion.AnsweredQuestionId), function(err3, res3){
                if(err3) throw err3;
                if(res3.length != 0){
                    question.comment = dcopy(res3[0]);
                }
                //Get all answer alternatives that are correct for the specified question
                sql.connection.query('SELECT * FROM Answers WHERE AQuestionId = ' + mysql.escape(question.QuestionId) + ' AND APoints = 1', function(error2, result2){
                    if(error2) throw error2;
                    question.answers = dcopy(result2);
                    //Get all answers that the user has entered associated with this question
                    sql.connection.query('SELECT UserAnswer.*, Answers.AText FROM UserAnswer INNER JOIN Answers ON Answers.AnswersId = UserAnswer.UAAnswersId WHERE UAQuestionId = ' + mysql.escape(question.answeredQuestion.AnsweredQuestionId), function(err4, res4){
                        if(err4) throw err4;
                        question.userAnswers = dcopy(res4);
                        questions.push(question);
                        //If we just did he last question, then put together the object
                        if(++k == result.length){
                            test.questions = questions;
                            data.test = test;
                        }
                    })
                })
            })
        });
    }
}