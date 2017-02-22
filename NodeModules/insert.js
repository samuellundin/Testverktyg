/**
 * Created by Sofia on 2017-02-22.
 */


var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: '',
    password: '',
    database: 'TestTool'
})
connection.connect();


function addUser(ufirstName,ulastName, umail, upassword,urole) {
    var newUser ={
        firstname: ufirstName,
        lastname: ulastName,
        mail: umail,
        password:upassword,
        role: urole
    };
   var query = connection.query('INSERT INTO User set ?', newUser, function(err,resilt){
       if(err){
        document.write("error");
       }
       document.write("Bra jobbat hayoti");
   });
};
