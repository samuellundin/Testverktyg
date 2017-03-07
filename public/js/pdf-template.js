var exports = module.exports = {};


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
                <div class="row"><h2 class="title pull-right">Poäng: 10/10</h2></div>
                <div class="row"><h3 class="title pull-right">Betyg: VG</h3></div>
            </div>
        </div>
        <hr>
        {{#test.questions}}
            <div class="panel panel-default">
                <div class="panel-heading"">
                    <h3 class="panel-title">{{Question}}</h3>
                </div>
                <div class="panel-body">
                    <div class="col-xs-6">
                        <h4 class="title">Svar:</h4>
                        <ul class="list-group useranswers">
                            {{#this.userAnswers}}
                                <li class="list-group-item">{{AText}}</li>
                            {{/this.userAnswers}}
                        </ul>
                    </div>
                    <div class="col-xs-6">
                        <h4 class="title">Rätt svar:</h4>
                        <ul class="list-group answers">
                            {{#this.answers}}
                                <li class="list-group-item">{{AText}}</li>
                            {{/this.answers}}
                        </ul>
                    </div>
                    {{#if this.questioncomment}}
                    {{/if}}
                </div>
            </div>
        {{/test.questions}}
     </div>
     `;