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
    connection.query("INSERT INTO Test (TUserId, TTitle, TStartTestDate, TEndTestDate, TTimeMin, TMaxPoints, TSelfCorrecting, TResult) VALUES ("
    + mysql.escape(testData.userId) + ", "
    + mysql.escape(testData.testTitle) + ", "
    + mysql.escape(testData.startDT) + ", "
    + mysql.escape(testData.endDT) + ", "
    + mysql.escape(testData.minutes) + ", "
    + mysql.escape(testData.maxPoints) + ", "
    + mysql.escape(testData.checked) + ", "
    + mysql.escape(testData.showResult) + ")", function(err, result){
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

exports.addUserAnsweredTest = function(data){
    connection.query("INSERT INTO AnsweredTest (ATestId, ATDate, ATCorrected, ATPoints, ATGrade, ATUserId) VALUES ("
        + mysql.escape(data.ATestId) + ", "
        + data.ATDate + ", "
        + mysql.escape(data.ATCorrected) + ", "
        + mysql.escape(data.ATPoints) + ", "
        + mysql.escape(data.ATGrade) + ", "
        + mysql.escape(data.ATUserId) + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
};

exports.addUserQuestions = function(data){
    connection.query("SELECT AnsweredTestId FROM AnsweredTest WHERE ATestId =" + mysql.escape(data.TestId) + ' AND ATUserId = ' + mysql.escape(data.UserId), function(error, result){
        var TestId = dcopy(result[0].AnsweredTestId);
        for(var i = 0; i < data.length; i++){
            connection.query('INSERT INTO AnsweredQuestion (AQAnsweredTestId, AQQuestionId, AQPoints) VALUES ('
            + mysql.escape(TestId) + ", "
            + mysql.escape(data[i].AQQuestionId) + ", "
            + mysql.escape(data[i].AQPoints) + ")");
        }
    });
    return true;
};

exports.addUserAnswers = function(data){
    var k = 0;
        for(var i = 0; i < data.length; i++){
            connection.query('SELECT AnsweredQuestionId FROM AnsweredQuestion WHERE AQQuestionId = (SELECT AQuestionId FROM Answers WHERE AnswersId = ' + mysql.escape(data[i].UAAnswersId) + ')', function(error, result){
                if(error) throw error;
                var AQId = dcopy(result[0].AnsweredQuestionId);
                userAnswer(data, AQId, k++);
            });
    }
};

function userAnswer(data, AQId, k){
                connection.query('INSERT INTO UserAnswer (UAQuestionId, UAAnswersId, UAOrder, UAText) VALUES ('
                    + mysql.escape(AQId) + ", "
                    + mysql.escape(data[k].UAAnswersId) + ", "
                    + mysql.escape(data[k].UAOrder) + ", "
                    + mysql.escape(data[k].UAText) + ")", function(error, result){
                        if(error) throw error;
                        console.log('Added user answers successfully');
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

exports.getAnsweredTest = function(ATId, Uid) {
    var resultat = "";
    connection.query('SELECT ATPoints, ATTimeMin, ATGrade FROM AnsweredTest WHERE ATUserId =' + Uid, function (err, result) {
        resultat = result
        console.log(result);
    });
    console.log(resultat + " yeah.");
    return 'Whaat?';
}

