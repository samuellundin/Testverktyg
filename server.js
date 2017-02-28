//Importera alla moduler
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

//Säg till appen (express) var den hittar statiska filer, så som javascript-filer och css-filer
app.use(express.static(path.join(__dirname, '/public')));

//Säg till appen vilken view engine vi använder, handlebars, och berätta i vilken mapp våra .hbs-filer
//kommer ligga (dvs handlebars-filer)
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layout'),
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

//Säg till appen hur vi vill parsa inkommande data som skickas från en sida till en annan (via t ex formulär)
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

app.use(session({
    cookieName: 'session',
    secret: 'secret',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

//Säg till vilken port appen ska lyssna på.
app.listen(3000);


//APP REQUESTS
app.get('/', function(req, res, next){
        res.render('index', req.session);
        delete req.session.err;
});

app.get('/login', function(req, res, next){
    res.render('login');
});

app.get('/create', function(req, res){
    if(checkAccess(req, 'teacher') || checkAccess(req, 'admin')){
        res.render('create', req.session);
    } else {
        req.session.err = 'Permission denied';
        res.redirect('/');
    }
});

app.get('/logout', function(req, res){
    req.session.reset();
    res.send('index');
});

app.get('/api/users', function(req, res){
    sql.connection.query('SELECT * FROM User', function(err, result){
        res.send(result);
    });
});



app.post('/login', function(req, res){
    sql.connection.query("SELECT * FROM User WHERE Mail = '" + req.body.email +"'", function(err, result){
        if(err || result[0] == null){
            req.session.err = 'No such mail registered';
            delayRedirect(res, 200);
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

app.get("/results", function(req, res) {
    sql.connection.query("SELECT TTitle,TestId FROM Test", function(error, result) {
        console.log(result);
        req.session.tests = dcopy(result);
        res.render("results", req.session);
    });
});

app.get("/share", function(req, res) {
    res.render("share", req.session);
});

app.get("/statistics", function(req, res) {
    res.render("statistics", req.session);
});

app.get("/testMenu", function(req, res) {
    sql.connection.query("SELECT TTitle,TestId FROM Test", function(error, result) {
        console.log(result);
        req.session.tests = dcopy(result);
        res.render("testMenu", req.session);
    });
});

app.get("/test=:testIdLink", function(req, res) {

    async.waterfall([
        function(callback){
            sql.connection.query("SELECT * FROM Test WHERE TestId = " + mysql.escape(req.params.testIdLink), function(error, result) {
                if(error) throw error;
                req.session.test = dcopy(result[0]);
            callback(null)});
        },
        function(callback){
            console.log(req.session);
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

app.get("/register", function(req, res) {
    res.render("register");
});
//Krypterar användarens lösenord innan reg
app.post("/register", function(req, res) {

    var encrypted = encryptor.encrypt(req.body.password);
    console.log(encrypted);
    console.log(encrypted.length);

    sql.addUser(req.body.fName, req.body.lName, req.body.mail, encrypted, req.body.role);
    res.redirect("/");
});

app.get('/questions', function(req, res, next){
    res.render('questions');
});

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

function checkAccess(req, targRole) {
    return req.session.role === targRole;
}

function delayRedirect(res, delay){
    setTimeout(function(){
        res.sendStatus(200);
    }, delay);
}

function renderTest(req, res, answersArray){
    console.log('rendering test');
    req.session.answers = answersArray[0];
    console.log(req.session.answers);
    console.log('setting answers and rendering');
    res.render('test', req.session);
}

app.get('/group', function(req, res) {
    var userList = "";
    sql.connection.query('SELECT * FROM User WHERE Role = "student"', function(err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(result);
            req.session.elever = dcopy(result);
            res.render('group', req.session);
            delete req.session.elever;
        }
    })

});
