/**
 * Created by Sofia on 2017-02-23.
 */
var sec = 0;
var min;
var myVar;
//Function timer start function countDown every second.
function timer(test, time) {
    min = time;
    countDown(); //Call function countDown too show starttime before count down.
    myVar = setInterval(countDown, 1000);
}
//Function countDown display time in HTML
function countDown() {
    var element = document.getElementById('test');
    if(sec <10){
    element.innerHTML =   min + ':' + "0" + sec;}
    else{
        element.innerHTML = min + ':' + sec;
    }

    if (sec < 1 && min < 1) {
        clearInterval(myVar);
    }
    if (sec < 1) {
        min--;
        sec = 60;
    }
        sec--;


}






