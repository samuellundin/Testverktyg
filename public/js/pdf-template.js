var exports = module.exports = {};


exports.pdfTemplate = `
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
          integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
     <div class="container">
        <h1 class="title">{{test.TTitle}}</h1>
     </div>
     
     <h2>{{test.FirstName}} {{test.LastName}}</h2>
     <p>{{test.ATDate}}</p>
     {{#test.questions}}
        <h3>{{Question}}</h3>
        <div class="answerbox useranswer pull-right">
            {{#this.userAnswers}}
                {{AText}}
            {{/this.userAnswers}}
        </div>
        <div class="answerbox answers">
            {{#this.answers}}
                
            {{/this.answers}}
        </div>
        {{#if this.questioncomment}}
            <div>KOmmentar här</div>
        {{/if}}
     {{/test.questions}}
     
     
     
     <style>
        h1{font-size:50px; margin-bottom: 0px;}
        h3{font-size:30px; text-decoration: underline;}
        p{font-size:24px;}
     </style>
     `;