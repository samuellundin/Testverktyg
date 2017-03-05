//Import all modules
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');
const app = express();
const mysql = require('mysql');
const uuid = require('uuid/v1');
const session = require('client-sessions');
const sql = require('./public/js/sql.js');
var key = 'dsfdsfdsfds3432432sdfdsf';
var encryptor = require('simple-encryptor')(key);
const dcopy = require('deepcopy');
const async = require('async');

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


//APP REQUESTS/END POINTS
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
app.post('/login', function(req, res){
    sql.connection.query("SELECT * FROM User WHERE Mail = '" + req.body.email +"'", function(err, result){
        if(err || result[0] == null){
            req.session.err = 'No such mail registered';
            return;

        }
        if(encryptor.decrypt(result[0].Password) == req.body.password){
            req.session.fName = result[0].FirstName;
            req.session.email = result[0].Mail;
            req.session.role = result[0].Role;
            req.session.id = result[0].UserId;
            setupRole(req);
            delayRedirect(res, 200);
        } else {
            req.session.err = 'Wrong password';
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
app.post('/create', function(req, res){
    sql.addTest(req.body.data, req.body.questions, req.body.answers);
    res.send('Yay');
});

app.get('/copyMenu', function(req, res){
    sql.connection.query('SELECT * FROM Test WHERE TUserId = ' + mysql.escape(req.session.id), function(error, result){
        req.session.tests = result;
        res.render('copyMenu', req.session);
    })
});

app.get('/copy=:id', function(req, res){
    req.session.copy = true;
    res.redirect('/edit=' + req.params.id);
})

//Get logout
app.get('/logout', function(req, res){
    req.session.reset();
    res.send('index');
});

//Get API users
app.get('/api/users', function(req, res){
    sql.connection.query('SELECT * FROM User', function(err, result){
        res.send(result);
    });
});

//Get results
app.get("/results", function(req, res) {
    sql.connection.query("SELECT * FROM Results WHERE ATCorrected = 1 AND ATUserId = " + req.session.id, function(error, result) {
        req.session.tests = dcopy(result);
        res.render("results", req.session);
    });
});

//Get editMenu
app.get("/editMenu", function(req, res) {
    updateSessionTests(req);

    setTimeout(function(){
        res.render("editMenu", req.session);
    }, 200);
});

//Saves questions for posted TestId in session
app.get("/edit=:testId", function(req, res) {
    var test = {};
    sql.connection.query('SELECT * FROM Test WHERE TestId = ' + req.params.testId, function(err1, res1){
        if(err1) throw err1;
        test = dcopy(res1[0]);
        var questions;
        sql.connection.query('SELECT * FROM Questions WHERE QTestId = ' + req.params.testId, function(error, result){
            if(error) throw error;
            questions = dcopy(result);
            var j = 0;
            for(var i = 0; i < questions.length; i++){
                sql.connection.query('SELECT * FROM Answers WHERE AQuestionId = ' + questions[i].QuestionId, function(err2, res2){
                    if(err2) throw err2;
                    questions[j++].answers = res2;
                    if(j == questions.length){
                        test.questions = questions;
                        req.session.test = test;
                        res.render('edit', req.session);
                        req.session.copy = false;
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
    setTimeout(function(){
        res.render("share", req.session);
    }, 200);
});

//Get statistics
app.get("/statistics", function(req, res) {

    setTimeout(function(){
        res.render("statistics", req.session);
    }, 200);
});

//Get testMenu
app.get("/testMenu", function(req, res) {
    sql.connection.query("SELECT * FROM Test WHERE Test.TestId NOT IN (SELECT AnsweredTest.ATestId FROM AnsweredTest WHERE AnsweredTest.ATUserId = " + req.session.id + ")", function(error, result) {
        req.session.tests = dcopy(result);
        res.render("testMenu", req.session);
    });
});

//Get test=:id
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
                    sql.connection.query("SELECT * FROM Answers WHERE AQuestionId = " + mysql.escape(req.session.questions[j].QuestionId), function(error3, result3) {
                        if(error3) throw error3;
                        req.session.questions[k].answers = dcopy(result3);
                        k++;
                    })
                }
            })
        callback(null)},
        function(callback){
            setTimeout(function(){
                res.render('test', req.session);
            }, 600)
        }

    ], function(error){
        if(error) throw error;
    })
});

//Turn in an answered test
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

//Post register
app.post("/register", function(req, res) {
    var encrypted = encryptor.encrypt(req.body.password);
    sql.addUser(req.body.fName, req.body.lName, req.body.mail, encrypted, req.body.role);
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

//Get correcting
app.get('/correcting', function(req, res) {

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
    sql.connection.query('SELECT User.FirstName, AnsweredTest.ATestId FROM User INNER JOIN AnsweredTest ON AnsweredTest.ATUserID=User.UserID', function(err, result) {
        var user;
        var users = [];

        for(var i = 0; i < result.length; i++){
            user = {userid: result[i].ATestId, username: result[i].FirstName}
            users.push(user);
        }
        req.session.users = dcopy(users);
    });

    sql.connection.query(`
        SELECT T.TestId, Q.QOrder, Q.Question, Q.QType, Q.QPoints, A.AText, A.APoints FROM Test AS T
        INNER JOIN Questions AS Q ON T.TestId = Q.QTestId
        INNER JOIN Answers AS A ON Q.QuestionId = A.AQuestionId`, function(err, result) {

        var testdata = [];

        for(var i = 0; i < result.length; i++) {
            testdata.push({
                testId: result[i].TestId,
                questionOrder: result[i].QOrder,
                questionText: result[i].Question,
                questionType: result[i].QType,
                questionPoints: result[i].QPoints,
                answerText: result[i].AText,
                answerCorrect: result[i].APoints
            });
        }

        req.session.testdata = testdata;
    });
    setTimeout(function () {
        res.render('correcting', req.session);
    }, 500);
});

//HELPER FUNCTIONS

//Check if it is self correcting, if it is, send it for autocorrect
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
    console.log('autocorrecting');
    sql.connection.query('SELECT * FROM Questions WHERE QTestId = ' + testId, function(error, result){
        if (error) throw error;
        var k = 0;
        for(var i = 0; i < result.length; i++){
            var resultArray = [];
            sql.connection.query('SELECT * FROM QuestionAnswers WHERE AnsweredTestId = ' + takenTestId + ' AND AQuestionId = ' + result[i].QuestionId, function(err, res){
                resultArray.push(dcopy(res));
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
                        sql.connection.query('SELECT UAOrder, AOrder FROM QuestionAnswers WHERE AQuestionId = ' + result[ri].QuestionId, function(err2, res2){
                            if(err2) throw err2;
                            var correct = true;
                            for(var ind = 0; ind < res2.length; ind++){
                                if(res2[ind].AOrder != res2[ind].UAOrder){
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
                    case 'Öppen fråga':
                        console.log("Something's wrong. This shouldn't be able to happen. Can't auto correct an open question.");
                        break;
                }
                k++;
                if(k==result.length){
                    setTimeout(function(){
                        updateTestScore(testId, takenTestId, points);
                    }, 1000);
                }
            })

        }
    })
}

//Updates score in AnsweredTest and decides what grade a person got
function updateTestScore(testId, takenTestId, points){
    sql.connection.query('SELECT TMaxPoints, TResult FROM Test WHERE TestId = ' + testId, function(error, result){
        var mPoints = result[0].TMaxPoints;
        var percentage = (points/mPoints) * 100;
        var grade = 'U';
        if(percentage > 80){
            grade = 'VG';
        } else if (percentage > 60){
            grade = 'G';
        }
        sql.connection.query('UPDATE AnsweredTest SET ATPoints = ' + points + ", ATGrade = " + mysql.escape(grade) + ", ATCorrected = TRUE, ATShowResult = "+ result[0].TResult +" WHERE AnsweredTestId = " + takenTestId, function(err, res){if (err) throw err;});
    });
}

//Updates session with tests from database
function updateSessionTests(req) {
    sql.connection.query("SELECT TTitle,TestId FROM Test", function(error, result) {
        req.session.tests = dcopy(result);
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

//Delays a redirect. This is to give time to other functions to finish before loading in the page
function delayRedirect(res, delay){
    setTimeout(function(){
        res.sendStatus(200);
    }, delay);
}
