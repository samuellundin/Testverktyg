/**
 * Created by Sofia on 2017-02-22.
 */


var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'dev',
    password: '1234',
    database: 'TestTool'
})
connection.connect();

addUser('Markus', 'Gustafsson', 'markus3832@gmail.com', 'jupp', 'teacher');
addUser('Sofia', 'Hayoti', 'sofhay@live.se','puss','student' );

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
        console.log("error");
        return false;
       }
       console.log("Bra jobbat hayoti");
       return true;
       })
    if(!validateEmail(umail)){
        return false;
    }
    else {

        var newUser = {
            firstname: ufirstName,
            lastname: ulastName,
            mail: umail,
            password: upassword,
            role: urole
        };
        var query = connection.query('INSERT INTO User set ?', newUser, function (err, resilt) {
            if (err) {
                return false;
            }
            return true;
        });
    }
};

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
