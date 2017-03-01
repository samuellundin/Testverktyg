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
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

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
    sql.addTest(req.body.data);
    for(var i = 0; i < req.body.questions.length; i++){
        sql.addQuestion(req.body.questions[i]);
    }
    setTimeout(function(){
        for(var i = 0; i < req.body.answers.length; i++){
            sql.addAnswer(req.body.answers[i]);
        }
    }, 500);
    console.log('Created test successfully');
    res.send('Yay');
});

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
    sql.connection.query("SELECT TTitle,TestId FROM Test", function(error, result) {
        req.session.tests = dcopy(result);
        res.render("results", req.session);
    });
});

//Get edit
app.get("/edit", function(req, res) {
    updateSessionTests(req);
    setTimeout(function(){
        res.render("edit", req.session);
    }, 200);
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
    updateSessionTests(req);
    setTimeout(function(){
        res.render("statistics", req.session);
    }, 200);
});

//Get testMenu
app.get("/testMenu", function(req, res) {
    sql.connection.query("SELECT TTitle,TestId FROM Test", function(error, result) {
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
                        switch(req.session.questions[k].QType){
                            case 'Flervalsfråga':
                                req.session.questions[k].flerval = true;
                                break;
                            case 'Alternativfråga':
                                req.session.questions[k].alternativ = true;
                                break;
                            case 'Rangordningsfråga':
                                req.session.questions[k].rangordning = true;
                                break;
                            case 'Öppen fråga':
                                req.session.questions[k].oppna = true;
                                break;
                        }
                        k++;
                    })
                }
            })
        callback(null)},
        function(callback){
            setTimeout(function(){
                res.render('test', req.session);
            }, 300)
        }

    ], function(error){
        if(error) throw error;
    })
});

app.post('/turnin', function(req, res){
    res.send('200');
})

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

//HELPER FUNCTIONS

//Updates session with tests from datebase
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
