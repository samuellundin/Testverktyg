var exports = module.exports = {};

// Template for pdf
exports.pdfTemplate = `
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
          integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
     <div class="container">
        <div class="row">
            <div class="col-xs-6">
                <div class="row"><h1 class="title">Testresultat:</h1></div>
                <div class="row"><h2 class="title">{{test.FirstName}} {{test.LastName}}</h2></div>
                <div class="row"><h3 class="title">{{test.ATDate}}</h3></div>
            </div>
            <div class="col-xs-6">
                <div class="row"><h1 class="title pull-right">{{test.TTitle}}</h1></div>
                <div class="row"><h2 class="title pull-right">Poäng: {{test.ATPoints}}/{{test.TMaxPoints}}</h2></div>
                <div class="row"><h3 class="title pull-right">Betyg: {{test.ATGrade}}</h3></div>
            </div>
        </div>
        <hr>
        {{#test.questions}}
            <div class="panel panel-default">
                <div class="panel-heading"">
                    <h3 class="panel-title">{{Question}}<p class="pull-right">{{this.answeredQuestion.AQPoints}}/{{this.QPoints}}</p></h3>
                </div>
                <div class="panel-body">
                    <div class="col-xs-6">
                        <h4 class="title">Svar:</h4>
                        <ul class="list-group useranswers">
                            {{#this.userAnswers}}
                                <li class="list-group-item">{{AText}}{{UAText}}</li>
                            {{/this.userAnswers}}
                        </ul>
                    </div>
                    <div class="col-xs-6">
                        <h4 class="title" name="{{this.QType}}">Rätt svar:</h4>
                        <ul class="list-group answers">
                            {{#this.answers}}
                                <li class="list-group-item">{{AText}}</li>
                            {{/this.answers}}
                        </ul>
                    </div>
                </div>
                    {{#if this.comment}}
                        <div class="panel-footer">
                            <div class="panel-title">Kommentar: </div>
                            {{this.comment.QuestionComment}}
                        </div>
                    {{/if}}
            </div>
        {{/test.questions}}
        {{#if test.testComment}}
        <div class="panel panel-default">
                <div class="panel-heading"">
                    <h3 class="panel-title">Lärarens kommentar</h3>
                </div>
                <div class="panel-body">
                    {{test.testComment.TestComment}}
                </div>
            </div>
        {{/if}}
     </div>
     <style>body{font-size: 175%}.panel-title{font-size:150%}.container{margin: 20px 40px}</style>
     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
     <script>$('h4[name="Öppen fråga"]').parent().remove()</script>`;