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
        res.render('index');
    }

});

app.post('/', function(req, res, next){
    console.log(req.body);
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
    var result = sql.getAllUsers();
    console.log(result);
    res.send('you found me');
});

app.post('/create', function(req, res){
    req.session.username = req.body.username;
    res.redirect('/');
});