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
    activeDuration: 5 * 60 * 1000,
}));

//Säg till vilken port appen ska lyssna på.
app.listen(3000);




//APP REQUESTS
app.get('/', function(req, res, next){
    if(req.session.username){
        res.render('index', {username: req.session.username});
    } else {
        res.render('index', {err : req.session.err});
        delete req.session.err;
    }

});

app.get('/create', function(req, res){
    if(req.session.username){
        res.render('create', {username: req.session.username});
    } else {
        res.render('create');
    }
});

app.get('/logout', function(req, res){
    req.session.reset();
    res.send('index');
});

app.get('/api/users', function(req, res){
    res.send(sql.getAllUsers());
/*    sql.connection.query('SELECT * FROM User', function(err, result){
        res.send(result);
    });*/
});

app.post('/create', function(req, res){
    sql.connection.query("SELECT * FROM User WHERE Mail = '" + req.body.email +"'", function(err, result){
        if(err || result[0] == null){
            req.session.err = 'No such mail registered';
            delayRedirect(res, 200);
            return;
        }
        var password = result[0].Password;
        if(password == req.body.password){
            req.session.username = result[0].FirstName;
            req.session.email = result[0].Mail;
            req.session.role = result[0].Role;
            delayRedirect(res, 200);
        } else {
            req.session.err = 'Wrong password';
            delayRedirect(res, 200);
        }
    });

});

app.get("/register", function(req, res) {
    res.render("register");


})

app.post("/register", function(req, res) {
    console.log(req.body);
    sql.addUser(req.body.fName, req.body.lName, req.body.mail, req.body.password, req.body.role);
    res.redirect("/");
})

function delayRedirect(res, delay){
    setTimeout(function(){
        res.sendStatus(200);
    }, delay);
}