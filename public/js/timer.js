/**
 * Created by Sofia on 2017-02-23.
 */
var sec = 0;
var min = 60;
function timer(test) {

    countDown();
    var myVar = setInterval(countDown, 1000);
    console.log("test timer");
}
function countDown() {
    console.log("test countdown");
    var element = document.getElementById('test');

    element.innerHTML = min + ':' + sec;

    if (sec < 1 && min < 1) {
        clearInterval(timer);
    }
    if (sec < 1) {
        min--;
        sec = 60;
    }
        sec--;


}






