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

exports.addUser = function (ufirstName, ulastName, umail, upassword, urole) {
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
    connection.query('SELECT * FROM User', function(err, result){
        return result;
    });
}
