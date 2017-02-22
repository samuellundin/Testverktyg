/**
 * Created by Sofia on 2017-02-22.
 */


var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'TestTool'
})
connection.connect();


function addUser(ufirstName,ulastName, umail, upassword,urole) {
    var newUser ={
        firstname: ufirstName,
        lastname: ulastName,
        mail: umail,
        Userpassword:upassword,
        role: urole
    };

};
