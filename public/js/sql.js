/**
 * Created by Sofia on 2017-02-22.
 */

var exports = module.exports = {};

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'dev',
    password: '1234',
    database: 'TestTool'
})
connection.connect();

exports.connection = connection;

exports.addUser = function (ufirstName, ulastName, umail, upassword, urole) {
    if(!validateEmail(umail)){
        return {err: 'Not a valid email adress'};
    }

    var newUser ={
        firstname: ufirstName,
        lastname: ulastName,
        mail: umail,
        password:upassword,
        role: urole
    };
   var query = connection.query('INSERT INTO User set ?', newUser, function(err,resilt){
       if(err){
        console.log("error");
        return false;
       }
       console.log("Bra jobbat hayoti");
       return true;
       })
};

exports.getAllUsers = function(){
    var resultat = "";
    connection.query('SELECT * FROM User', function(err, result){
        resultat = result;
        console.log(result);
    });
    console.log(resultat + " yeah.");
    return 'Whaat?';
} 


function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}