/**
 * Created by Sofia on 2017-02-22.
 */

var exports = module.exports = {};
//Connection to database
var mysql = require('mysql');
var dcopy = require('deepcopy');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'dev',
    password: '1234',
    database: 'TestTool'
})
connection.connect();

exports.connection = connection;
//Function add user to database
exports.addUser = function (ufirstName, ulastName, umail, upassword, urole) {
    if(!validateEmail(umail)){
        return {err: 'Not a valid email adress'};
    }
    //Create object user
    var newUser ={
        firstname: ufirstName,
        lastname: ulastName,
        mail: umail,
        password:upassword,
        role: urole
    };
    //Save user in database
   var query = connection.query('INSERT INTO User set ?', newUser, function(err,resilt){
       if(err){
        console.log(err);
        return false;
       }
       return true;
       })
};

exports.addTest = function(testData){
    connection.query("INSERT INTO Test (TUserId, TTitle, TStartTestDate, TEndTestDate, TTimeMin, TMaxPoints, TSelfCorrecting) VALUES ("
    + mysql.escape(testData.userId) + ", "
    + mysql.escape(testData.testTitle) + ", "
    + mysql.escape(testData.startDT) + ", "
    + mysql.escape(testData.endDT) + ", "
    + testData.minutes + ", "
    + 0 + ", "
    + 0 + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
};

exports.addQuestion = function(questionData){
    var testId = 0;
    connection.query("SELECT TestID FROM Test WHERE TTitle = " + mysql.escape(questionData.testTitle), function(err, result){
        testId = dcopy(result[0].TestID);
        addQ(questionData, testId);
    });
};

function addQ(questionData, testId){
    connection.query("INSERT INTO Questions (QTestId, Question, QType, QPoints, QOrder) VALUES ("
        + mysql.escape(testId) + ", "
        + mysql.escape(questionData.title) + ", "
        + mysql.escape(questionData.type) + ", "
        + mysql.escape(questionData.score) + ", "
        + mysql.escape(questionData.qOrder) + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
}

exports.addAnswer = function(answerData){
    var questionId = 0;
    connection.query("SELECT QuestionId FROM Questions WHERE Question = " + mysql.escape(answerData.qTitle), function(err, result){
        questionId = dcopy(result[0].QuestionId);
        addA(answerData, questionId);
    });
};

function addA(answerData, questionId){
    connection.query("INSERT INTO Answers (AQuestionId, AText, ACorrected, APoints, AOrder) VALUES ("
        + mysql.escape(questionId) + ", "
        + mysql.escape(answerData.title) + ", "
        + mysql.escape(answerData.corrected) + ", "
        + mysql.escape(answerData.score) + ", "
        + mysql.escape(answerData.order) + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
}

function addQ(questionData, testId){
    connection.query("INSERT INTO Questions (QTestId, Question, QType, QPoints, QOrder) VALUES ("
        + mysql.escape(testId) + ", "
        + mysql.escape(questionData.title) + ", "
        + mysql.escape(questionData.qType) + ", "
        + mysql.escape(questionData.score) + ", "
        + mysql.escape(questionData.qOrder) + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
}

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