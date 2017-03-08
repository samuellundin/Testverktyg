$("#time").prop('disabled', true);
$("#timed").change(function() {
    if(this.checked) {
        $("#time").prop('disabled', false);
    } else if(!this.checked) {
        $("#time").prop('disabled', true);
    }
});

$("#saveTest").click(function (event) {
    if ($('#testName').val() == '') {

        document.getElementById('controlTestName').className = 'alert alert-danger';
        document.getElementById('controlTestName').textContent = 'Ange titel för test';
        document.getElementById('errorTestName').className = 'form-group  has-error';
    }
    else if ($('#timed').prop('checked') == true && $('#time').val() == '') {

        document.getElementById('controlTime').className = 'alert alert-danger';
        document.getElementById('controlTime').textContent = 'Ange tidsbegränsning i minuter';
        document.getElementById('errorTime').className = 'form-group  has-error';

    }
    else if ($('#dateStart').val() == '') {

        document.getElementById('controlStartdate').className = 'alert alert-danger';
        document.getElementById('controlStartdate').textContent = 'Ange startdatum';
        document.getElementById('errorStartdate').className = 'form-group  has-error';
    }
    else if ($('#date').val() == '') {

        document.getElementById('controldate').className = 'alert alert-danger';
        document.getElementById('controldate').textContent = 'Ange slutdatum';
        document.getElementById('errordate').className = 'form-group  has-error';
    }
    else{
        document.getElementById('controlTestName').className = '';
        document.getElementById('controlTestName').textContent = '';
        document.getElementById('errorTestName').className = '';
        document.getElementById('controlTime').className = '';
        document.getElementById('controlTime').textContent = '';
        document.getElementById('errorTime').className = '';
        document.getElementById('controlStartdate').className = '';
        document.getElementById('controlStartdate').textContent = '';
        document.getElementById('errorStartdate').className = '';
        document.getElementById('controldate').className = '';
        document.getElementById('controldate').textContent = '';
        document.getElementById('errordate').className = '';
        document.getElementById('testSaved').textContent = 'Ditt test har sparats';
        document.getElementById('saved').className = 'alert alert-success';
    }
});


YUI().use(
    'aui-timepicker',
    function(Y) {
        new Y.TimePicker(
            {
                timeFormat: '%H:%M',
                trigger: 'input.timepicker',
                mask: '%H:%M',
                popover: {
                    zIndex: 999
                },
                on: {
                    selectionChange: function(event) {
                    }
                }
            }
        );
    }
);

$('#createQuestion').on('click', function(){
    resetQuestionBox();
});

$('#questionModal').on('click', '#addButton', function () {
    var answerCount = $('.answer').length + 1;
    $('#answersBox').append(`<div class="input-group answer">
            <span class="input-group-btn">
                <button class="btn btn-default removeButton" type="button">
                    <span class="glyphicon glyphicon-remove"></span>
                </button>
            </span>
            <input type="text" class="form-control" placeholder="Svar ` + answerCount + `">
            <span class="input-group-addon">
                <input type="checkbox">
            </span>
            </div>`)
});

$(document).on('click', 'button.removeButton', function (events) {
    $(this).parents('div').eq(0).remove();
});

$('#date').datepicker({
    format: 'yyyy-mm-dd',
    todayHighlight: true,
    autoclose: true
}).on('change', function() {
    if(!$('#timeEnd').val()) {
        $('#timeEnd').val('00:00');
    }
});
$('#dateStart').datepicker({
    format: 'yyyy-mm-dd',
    todayHighlight: true,
    autoclose: true
}).on('change', function() {
    if(!$('#timeStart').val()) {
        $('#timeStart').val('00:00');
    }
});

$(document).on('click', '#saveQuestion', function() {
    var i = "";
    $('#questionModal .answer input:text').each(function() {
        i += '<li class="list-group-item">'+ $(this).val() +'<span class="pull-right">Rätt svar: ';
        if($(this).parent().find('input:checkbox').is(':checked')){
            i += '<input type="checkbox" checked="checked"></span></li>';
        } else {
            i += '<input type="checkbox"></span></li>';
        }
    });
    $('#questionBox').append(`
        <div class="panel panel-default">
            <div class="panel-heading clearfix">
                <meta class="` + $('#typeSelect :selected').text() + `">
                <input type="hidden" class="image" value="`+ $('#questionModal #imgURL').val() +`">
                <div class="pull-right">
                    <button type="button" class="btn btn-default btn-sm btn-edit" data-toggle="modal" data-target="#editModal">Redigera</button>
                    <button type="button" class="btn btn-default btn-sm btn-remove">
                        &nbsp;<span class="glyphicon glyphicon-remove"></span>&nbsp;
                    </button>
                </div>
                <h3 class="panel-title" style="margin-top: 5px">`+ $("#question").find('input[type=text]').val() +' ('+ $('#typeSelect').val() +')'+`<span style="margin-right: 15px" class="pull-right">Poäng: `+ $('#points').val() +`</span></h3>
            </div>
            <div class="panel-body">
                <ul class="list-group sortable">`+ i +`</ul>
            </div>
        </div>`);
    if($('#questionBox:contains("Öppen fråga")').length)
    {
        $('#selfCorrecting').prop('disabled', true);
    } else {
        $('#selfCorrecting').prop('disabled', false);
    }
    $('.sortable').sortable();
});

$('#test').on('click', '.panel-heading', function(e) {
    if(!$(event.target).hasClass('btn')){
        $(this).next('.panel-body').slideToggle();
    }
});

$(document).on('click', '.btn-remove', function() {
    $(this).closest('.panel').remove();
});


var thisPanel = '';
$(document).on('click', '.btn-edit', function() {
    var title = $(this).parent().parent().find('.panel-title').html();
    var imgUrl = $(this).parent().parent().parent().find('input[type=hidden]').val();
    console.log(imgUrl);
    var n = title.indexOf("(");
    var titleQuestion = title.substring(0, n).trim(); // variabel för fråga
    var titleType = title.substring(n); // variabel för typ av fråga
    var points = title.substring(title.indexOf('Poäng: ') + 7, title.indexOf('</span>'));

    var checks = $(this).parent().parent().parent().find('.panel-body').find('ul li');
    var checkslist = new Array();
    checks.each(function(i) {
        checkslist.push($(this).find('input:checkbox').is(':checked'));
    });

    var answers = $(this).parent().parent().parent().find('.panel-body').find('ul li');
    var answerlist = new Array(); // Array för svaren
    answers.each(function (i) {
        answerlist.push($(this).text());
    });

    thisPanel = $(this).parent().parent().parent();

    $('#editModal').html(`
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                            <h4 class="modal-title">Fråga</h4>
                        </div>
                        <div class="modal-body">
                        <form>
                            <div class="form-group" id="questionEdit">
                                <input type="text" class="form-control questionTitle" placeholder="Fråga?" value="`+ titleQuestion +`">
                            </div>
                            <div class="row form-group">
                                <div class="col-lg-6 form-group">
                                    <select class="form-control" id="typeSelectEdit">
                                        <option hidden>Välj Typ</option>
                                        <option value="fler" id="qTypeMulti">Flervalsfråga</option>
                                        <option value="alternativ" id="qTypeAlt">Alternativfråga</option>
                                        <option value="rang" id="qTypeOrder">Rangordningsfråga</option>
                                        <option value="oppen" id="qTypeOpen">Öppen fråga</option>
                                    </select>
                                </div>
                                <div class="col-lg-6">
                                    <input type="text" class="form-control" placeholder="Poäng" id="questionpoint" value="`+ points +`">
                                </div>
                            </div>
                            <div id="answersBox">
                            </div>
                            <p id="infoText"></p>
                            <div class="input-group">
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-picture"></span>
                                </span>
                                <input class="form-control" id="imgURL" placeholder="Länk till bild" value="`+ imgUrl +`" type="text"/>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default pull-left" id="addButton">Lägg till Svar</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal" id="saveEditButton">Spara</button>
                    </div>
                </div>
            </div>
        `);



    // loopa ut svaren i answerBox
    for(var i = 0; i < answerlist.length; i++){
        var checkscode = '';
        if(checkslist[i]){
            checkscode = '<input type="checkbox" checked="checked">';
        } else {
            checkscode = '<input type="checkbox">';
        }
        $('#editModal').find('#answersBox').append(`
                <div class="input-group answer">
                    <span class="input-group-btn">
                        <button class="btn btn-default removeButton" type="button">
                            <span class="glyphicon glyphicon-remove"></span>
                        </button>
                    </span>
                    <input type="text" class="form-control" placeholder="Svar 1" value="`+ answerlist[i].substring(0, answerlist[i].indexOf('Rätt svar:')) +`">
                    <span class="input-group-addon">
                        `+ checkscode +`
                    </span>
                </div>
            `);
    }

    if(title.substring(n).search("Flervalsfråga") > -1){
        $('#typeSelectEdit option[value=fler]').attr('selected','selected');
    } else if (title.substring(n).search("Alternativfråga") > -1){
        $('#typeSelectEdit option[value=alternativ]').attr('selected','selected');
    } else if (title.substring(n).search("Rangordningsfråga") > -1){
        $('#typeSelectEdit option[value=rang]').attr('selected','selected');
    } else if (title.substring(n).search("Öppen fråga") > -1){
        $('#typeSelectEdit option[value=oppen]').attr('selected','selected');
    }
});
$('#editModal').on('click', '#saveEditButton', function () {
    var i = "";
    $('#editModal .answer input:text').each(function() {
        i += '<li class="list-group-item">'+ $(this).val() +'<span class="pull-right">Rätt svar: ';
        if($(this).parent().find('input:checkbox').is(':checked')){
            i += '<input type="checkbox" checked="checked"></span></li>';
        } else {
            i += '<input type="checkbox"></span></li>';
        }
    });
    thisPanel.html(`
            <div class="panel-heading clearfix">
                <meta class="` + $('#typeSelectEdit :selected').text() + `">
                <input type="hidden" class="image" value="`+ $('#editModal #imgURL').val() +`">
                <div class="pull-right">
                    <button type="button" class="btn btn-default btn-sm btn-edit" data-toggle="modal" data-target="#editModal">Redigera</button>
                    <button type="button" class="btn btn-default btn-sm btn-remove">
                        &nbsp;<span class="glyphicon glyphicon-remove"></span>&nbsp;
                    </button>
                </div>
                <h3 class="panel-title" style="margin-top: 5px">`+ $("#questionEdit").find('input').val() +' ('+ $('#typeSelectEdit :selected').text() +')'+`<span style="margin-right: 15px" class="pull-right">Poäng: `+ $('#questionpoint').val() +`</span></h3>
            </div>
            <div class="panel-body">
                <ul class="list-group sortable">`+ i +`</ul>
            </div>
        `);
    if($('#questionBox:contains("Öppen fråga")').length)
    {
        $('#selfCorrecting').prop('disabled', true);
    } else {
        $('#selfCorrecting').prop('disabled', false);
    }
    $('.sortable').sortable();
});
$('#editModal').on('click', '#addButton', function () {
    var answerCount = $('.answer').length + 1;
    $('#editModal').find('#answersBox').append(`<div class="input-group answer">
            <span class="input-group-btn">
                <button class="btn btn-default removeButton" type="button">
                    <span class="glyphicon glyphicon-remove"></span>
                </button>
            </span>
            <input type="text" class="form-control" placeholder="Svar ` + answerCount + `">
            <span class="input-group-addon">
                <input type="checkbox">
            </span>
            </div>`);
});

function resetQuestionBox(){
    $('#questionModal').html(`

                <div class="modal-dialog">


                <div class="modal-content">
                <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Fråga 1</h4>
                </div>
                <div class="modal-body">
                <form>

                <div class="form-group" id="question">
                <input type="text" class="form-control questionTitle" placeholder="Fråga?">
                </div>

                <div class="row form-group">
                    <div class="col-lg-6 form-group">
                        <select class="form-control" id="typeSelect" data-toggle="popover" data-placement="left" data-content="Content" data-html="true">
                            <option hidden>Välj Typ</option>
                            <option id="qTypeMulti">Flervalsfråga</option>
                            <option id="qTypeAlt">Alternativfråga</option>
                            <option id="qTypeOrder">Rangordningsfråga</option>
                            <option id="qTypeOpen">Öppen fråga</option>
                        </select>
                    </div>
                    <div class="col-lg-6">
                        <input type="text" class="form-control" placeholder="Poäng" id="points">
                    </div>
                </div>

                <div id="answersBox">
                <div class="input-group answer">
                <span class="input-group-btn">
                <button class="btn btn-default removeButton" type="button">
                <span class="glyphicon glyphicon-remove"></span>
                </button>
                </span>
                <input type="text" class="form-control" placeholder="Svar 1">
                <span class="input-group-addon">
                    <input type="checkbox">
                </span>
                </div>
                <div class="input-group answer">
                <span class="input-group-btn">
                <button class="btn btn-default removeButton" type="button">
                <span class="glyphicon glyphicon-remove"></span>
                </button>
                </span>
                <input type="text" class="form-control" placeholder="Svar 2">
                <span class="input-group-addon">
                    <input type="checkbox">
                </span>
                </div>
                </div>
                <p id="infoText"></p>
                <div class="input-group">
                    <span class="input-group-addon">
                        <span class="glyphicon glyphicon-picture"></span>
                    </span>
                    <input class="form-control" id="imgURL" placeholder="Länk till bild" type="text"/>
                </div>
                </form>
                </div>
                <div class="modal-footer">
                <button type="button" class="btn btn-default pull-left" id="addButton">Lägg till Svar</button>
                <button type="button" class="btn btn-default" data-dismiss="modal" id="saveQuestion">Spara</button>
                </div>
                </div>
                </div>`);
    $("#typeSelect").popover({ trigger: "hover" });
    $("#typeSelect").attr("data-content", `<b>Alternativfråga:</b> Studenten kan endast kryssa i ett svar.<br>
        <b>Flervalsfråga:</b> Studenten kan kryssa i flera svar.<br>
        <b>Rangordningsfråga:</b> Studenten sorterar svaren uppifrån och ned.<br>
        <b>Öppen fråga:</b> Studenten skriver ett eget svar.`);
}


$(function() {
    $(document).on("change", "#typeSelect", function() {
        if($("#qTypeOpen").is(":selected")){
            $("#answersBox").html(`<div class="input-group answer">
                        <input type="text" class="form-control" placeholder="Detta är en öppen textfråga">
                        </div>`);
        } else {
            $("#answersBox").html(`                <div class="input-group answer">
                <span class="input-group-btn">
                <button class="btn btn-default removeButton" type="button">
                <span class="glyphicon glyphicon-remove"></span>
                </button>
                </span>
                <input type="text" class="form-control" placeholder="Svar 1">
                <span class="input-group-addon">
                    <input type="checkbox">
                </span>
                </div>
                <div class="input-group answer">
                <span class="input-group-btn">
                <button class="btn btn-default removeButton" type="button">
                <span class="glyphicon glyphicon-remove"></span>
                </button>
                </span>
                <input type="text" class="form-control" placeholder="Svar 2">
                <span class="input-group-addon">
                    <input type="checkbox">
                </span>
                </div>`);
        }
    });
});

$('#selfCorrecting').on('change', function(){
    $('#directResult').toggleClass('hidden');
});

$('#saveTest').on('click', function(){
    if($("#dateStart").val()=='' || $("#date").val()=='') {
        $("#missingInput").show();
        console.log("Inte tillåtet!")
    } else {
        $("#missingInput").hide();
        console.log("Tillåtet!")
        var testData = {};
        getTestData(testData);
        getQuestionData(testData);
        getAnswerData(testData);
        $.ajax({
            url: '/create',
            method: 'post',
            data: testData,
            success: function(){
                console.log('Created test successfully');
                location.replace('/');
            }
        });
    }
});



function getTestData(storeVariable){
    var data = {};
    data.userId = $('input[type=hidden]').attr('class');
    data.testTitle = $('#testName').val();
    data.minutes = $('#timed').is(':checked')? Number($('#time').val()) : 0;
    data.startDT = $('#dateStart').val() + " " + $('#timeStart').val() + ":00";
    data.endDT = $('#date').val() + " " + $('#timeEnd').val() + ":00";
    data.checked = $('#selfCorrecting').is(':checked') ? 1 : 0;
    data.showResult = $('.directResult').is(':checked') ? 1 : 0;
    var testId = $('input[type=hidden]').attr('id');
    if(testId) data.testId = testId;
    storeVariable.data = data;
}

function getQuestionData(storeVariable){
    var questionData = new Object();
    var questionsArray = [];
    var maxPointsTest = 0;
    $('.panel-default').each(function(index){
        if($(this).hasClass('notthis')){
            return true;
        }
        questionData.title = $(this).find('h3').text().split('\(')[0];
        questionData.testTitle = $('#testName').val();
        questionData.qType = $(this).find('meta').attr('class');
        questionData.qOrder = index;
        questionData.score = $(this).find('span').text().match(/\d+/) || 0;
        questionData.imgUrl = $(this).find('input[type=hidden].image').val() ? $(this).find('input[type=hidden].image').val() : false;
        maxPointsTest += Number(questionData.score);
        questionsArray.push(questionData);
        questionData = new Object();
    });
    storeVariable.data.maxPoints = maxPointsTest;
    storeVariable.questions = questionsArray;
}

function getAnswerData(storeVariable){
    var answerData = new Object();
    var answersArray = [];
    $('.panel-default').each(function(){
        if($(this).hasClass('notthis')){
            return true;
        }
        var title = $(this).find('h3').text();
        var questionTitle = title.split('\(')[0];
        var type = title.split('\(')[1].split('\)')[0];
        $(this).find('li').each(function(index){
            var correctAnswer;
            if($(this).find('input:checkbox').is(':checked')){
                correctAnswer = 1;
            } else {
                correctAnswer = 0;
            }
            answerData.qTitle = questionTitle;
            answerData.qType = type;
            answerData.title = $(this).text().substring(0, $(this).text().indexOf('Rätt svar:'));
            answerData.order = index;
            answerData.score = correctAnswer;
            answerData.corrected = 0;
            if(type == 'Rangordningsfråga' || type == 'Öppen fråga'){
                answerData.score = 1;
            }
            answersArray.push(answerData);
            answerData = new Object();
        });
    });
    storeVariable.answers = answersArray;
};