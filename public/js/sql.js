/**
 * Created by Sofia on 2017-02-22.
 */

//The object exposed to other files that import this file
var exports = module.exports = {};

//Require mysql module and deep copy
var mysql = require('mysql');
var dcopy = require('deepcopy');

//Connection to database
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'dev',
    password: '1234',
    database: 'TestTool',
    dateStrings: 'date'
})
connection.connect();

//Expose the connection to be used from outside this file
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

//Adds all testdata into the database
exports.addTest = function(testData, questions, answers){
    connection.query("INSERT INTO Test (TUserId, TTitle, TStartTestDate, TEndTestDate, TTimeMin, TMaxPoints, TSelfCorrecting, TDisplayResult) VALUES ("
    + mysql.escape(testData.userId) + ", "
    + mysql.escape(testData.testTitle) + ", "
    + mysql.escape(testData.startDT) + ", "
    + mysql.escape(testData.endDT) + ", "
    + mysql.escape(testData.minutes) + ", "
    + mysql.escape(testData.maxPoints) + ", "
    + mysql.escape(testData.checked) + ", "
    + mysql.escape(testData.showResult) + ")", function(err, result){
        if(err) throw err;
        testId = result.insertId;
        //Call add question for all questions
        for(var i = 0; i < questions.length; i++){
            exports.addQuestion(questions[i], testId);
        }
        //Add all answers
        setTimeout(function(){
            for(var i = 0; i < answers.length; i++){
                exports.addAnswer(answers[i], testId);
            }
        }, 500);
    });
};

//Adds a question into the database
exports.addQuestion = function(questionData, testIdIn){
    var testId = 0;
    if(testIdIn){
        addQ(questionData, testIdIn);
    } else {
        connection.query("SELECT TestID FROM Test WHERE TTitle = " + mysql.escape(questionData.testTitle), function(err, result){
            testId = dcopy(result[0].TestID);
            addQ(questionData, testId);
        });
    }
};

//Add an answer
exports.addAnswer = function(answerData, testId){
    var questionId = 0;
    connection.query("SELECT QuestionId FROM Questions WHERE Question = " + mysql.escape(answerData.qTitle) + " AND QTestId = " + testId, function(err, result){
        questionId = dcopy(result[0].QuestionId);
        addA(answerData, questionId);
    });
};

//Add answer data
function addA(answerData, questionId){
    connection.query("INSERT INTO Answers (AQuestionId, AText, APoints, AOrder) VALUES ("
        + mysql.escape(questionId) + ", "
        + mysql.escape(answerData.title) + ", "
        + mysql.escape(answerData.score) + ", "
        + mysql.escape(answerData.order) + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
}

//Adds question data (this function is split into two because of asynchronization)
function addQ(questionData, testId){
    var c = connection.query("INSERT INTO Questions (QTestId, Question, QType, QPoints, QOrder) VALUES ("
        + mysql.escape(testId) + ", "
        + mysql.escape(questionData.title) + ", "
        + mysql.escape(questionData.qType) + ", "
        + mysql.escape(questionData.score) + ", "
        + mysql.escape(questionData.qOrder) + ")", function(err, result){
        if(err)throw err;
        console.log(questionData.imgUrl);
        if(questionData.imgUrl != 'false'){
            connection.query('INSERT INTO pictureURL (PURL, PQuestionId) VALUES ('
                + mysql.escape(questionData.imgUrl) + ', '
                + mysql.escape(result.insertId) + ')', function(error, res){
                if(error) throw error;
            })
        }
        return true;
    });
}

//Adds a taken test into the database
exports.addUserAnsweredTest = function(data){
    connection.query("INSERT INTO AnsweredTest (ATestId, ATDate, ATCorrected, ATPoints, ATGrade, ATTimeSec, ATUserId) VALUES ("
        + mysql.escape(data.ATestId) + ", "
        + data.ATDate + ", "
        + mysql.escape(data.ATCorrected) + ", "
        + mysql.escape(data.ATPoints) + ", "
        + mysql.escape(data.ATGrade) + ", "
        + mysql.escape(data.ATTimeSec) + ", "
        + mysql.escape(data.ATUserId) + ")", function(err, result){
        if(err){
            console.log(err);
            return false;
        }
        return true;
    });
};

//Adds a user answered question into the database
exports.addUserQuestions = function(data){
    connection.query("SELECT AnsweredTestId FROM AnsweredTest WHERE ATestId =" + mysql.escape(data.TestId) + ' AND ATUserId = ' + mysql.escape(data.UserId), function(error, result){
        var TestId = dcopy(result[0].AnsweredTestId);
        for(var i = 0; i < data.length; i++){
            connection.query('INSERT INTO AnsweredQuestion (AQAnsweredTestId, AQQuestionId, AQPoints) VALUES ('
            + mysql.escape(TestId) + ", "
            + mysql.escape(data[i].AQQuestionId) + ", "
            + mysql.escape(data[i].AQPoints) + ")", function(error, result){
                if(error) throw error;
            });
        }
    });
    return true;
};

//Adds a user answer into the database
exports.addUserAnswers = function(data, next){
    connection.query("SELECT AnsweredTestId FROM AnsweredTest WHERE ATestId =" + mysql.escape(data.TestId) + ' AND ATUserId = ' + mysql.escape(data.UserId), function(error, result){
        var testId = dcopy(result[0].AnsweredTestId);
        var k = 0;
        for(var i = 0; i < data.length; i++){
        var query = connection.query('SELECT AnsweredQuestionId FROM AnsweredQuestion WHERE AQQuestionId = (SELECT AQuestionId FROM Answers WHERE AnswersId = ' + mysql.escape(data[i].UAAnswersId) + ') AND AQAnsweredTestId = ' + testId, function(error, result){
                if(error) throw error;
                var AQId = dcopy(result[0].AnsweredQuestionId);
                userAnswer(data, AQId, k++, (k == data.length), next, data.TestId, testId);
            });
    }
    });
};

//Adds a user answer into the database
function userAnswer(data, AQId, k, lastCall, next, testId, takenTestId){
                connection.query('INSERT INTO UserAnswer (UAQuestionId, UAAnswersId, UAOrder, UAText) VALUES ('
                    + mysql.escape(AQId) + ", "
                    + mysql.escape(data[k].UAAnswersId) + ", "
                    + mysql.escape(data[k].UAOrder) + ", "
                    + mysql.escape(data[k].UAText) + ")", function(error, result){
                        if(error) throw error;
                        if(lastCall){
                            next(testId, takenTestId);
                        }
                        return true;
        });

}

//Retrieves all user information from the database
exports.getAllUsers = function(){
    var resultat = "";
    connection.query('SELECT * FROM User', function(err, result){
        resultat = result;
    });
    console.log(resultat + " yeah.");
    return 'Whaat?';
}

//Updates a test. Updates all test information, then deletes all associated questions and answers and re-adds the modified ones.
//This way we don't need to keep track of which are still there, which are not, it just copies the Q's and A's that are
//to remain.
exports.updateTest = function(data, questions, answers){
    connection.query('UPDATE Test SET '
    + 'TTitle = ' + mysql.escape(data.testTitle) + ", "
    + 'TStartTestDate = ' + mysql.escape(data.startDT) + ", "
    + 'TEndTestDate = ' + mysql.escape(data.endDT) + ", "
    + 'TTimeMin = ' + mysql.escape(data.minutes) + ", "
    + 'TMaxPoints = ' + mysql.escape(data.maxPoints) + ", "
    + 'TSelfCorrecting = ' + mysql.escape(data.checked) + ", "
    + 'TDisplayResult = ' + mysql.escape(data.showResult) + ", "
    + 'TUserId = ' + mysql.escape(data.userId)
    + ' WHERE TestId = ' + mysql.escape(data.testId), function(error, result){
        if(error) throw error;
        connection.query('SELECT QuestionId FROM Questions WHERE QTestId = ' + mysql.escape(data.testId), function(err, res){
            if(err) throw err;
            var j = 0;
            var k = 0;
            for(var i = 0; i < res.length; i++){
                connection.query('DELETE FROM Answers WHERE AQuestionId = ' + mysql.escape(res[i].QuestionId), function(err2, res2){
                    if(err2) throw err2;
                    connection.query('DELETE FROM Questions WHERE QuestionId = ' + mysql.escape(res[j++].QuestionId), function(err3, res3){
                        if(err3) throw err3;
                        if(++k == res.length){
                                for(var ind = 0; ind < questions.length; ind++){
                                    exports.addQuestion(questions[ind], data.testId);
                                }
                            setTimeout(function(){
                                for(var ind = 0; ind < answers.length; ind++){
                                    exports.addAnswer(answers[ind], data.testId);
                                }
                            }, 500);
                        }
                    })
                })
            }
        })
    })
}

//Add a question comment
exports.addComments = function(QComments){
    for(var i = 0; i < QComments.length; i++){
        connection.query('INSERT INTO QuestionComment (QuestionComment, QCUserId, QCQuestionId) VALUES ('
        + mysql.escape(QComments[i].text) + ", "
        + mysql.escape(QComments[i].teacher) + ", "
        + mysql.escape(QComments[i].questionId) + ")", function(err, res){
            if(err) throw err;
        })
    }
}

//Add a test comment
exports.addTestComment = function(TComment){
    console.log(TComment);
    connection.query('INSERT INTO TestComment (TestComment, TCUserId, TCATestId) VALUES ('
    + mysql.escape(TComment.text) + ", "
    + mysql.escape(TComment.teacher) + ", "
    + mysql.escape(TComment.test) + ")", function(err, res){
        if(err) throw err;
        console.log(res);
    });
}
