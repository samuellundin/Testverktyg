/**
 * Created by Sofia on 2017-02-23.
 */
//The function controlDate controls that it's not to late for the student to do the test
function controlEndDate(date, elem){
    console.log("test");
    var element = document.getElementById(elem);
    var ld = date.toString();
    var d = new Date().toISOString().slice(0,10);// Change date to the correct format

    var latestDate = ld.split("-",3);// Split string to an array
    var todayDate = d.split("-",3);
   console.log(latestDate[0] + todayDate[0]);

   //Compare deadline year to current year
    if(Number(latestDate[0])> Number(todayDate[0])){
    return true;
    }
    //Compare deadline year + month  to current year + month
    else if(Number(latestDate[0])== Number(todayDate[0]) && Number(latestDate[1])> Number(todayDate[1])){
     return true;
    }
    //Compare deadline year + month + day  to current year + month + day
     else if(Number(latestDate[0]) == Number(todayDate[0]) && Number(latestDate[1])== Number(todayDate[1]) && Number(latestDate[2])> Number(todayDate[2]) ) {
     return true;
    }
    else{
      return false;
    }
}

function controlStartDate(date, elem){
    console.log("test");
    var element = document.getElementById(elem);
    var ld = date.toString();
    var d = new Date().toISOString().slice(0,10);// Change date to the correct format

    var latestDate = ld.split("-",3);// Split string to an array
    var todayDate = d.split("-",3);
    console.log(latestDate[0] + todayDate[0]);

    //Compare deadline year to current year
    if(Number(latestDate[0])< Number(todayDate[0])){
        return true;
    }
    //Compare deadline year + month  to current year + month
    else if(Number(latestDate[0])== Number(todayDate[0]) && Number(latestDate[1])< Number(todayDate[1])){
        return true;
    }
    //Compare deadline year + month + day  to current year + month + day
    else if(Number(latestDate[0]) == Number(todayDate[0]) && Number(latestDate[1])== Number(todayDate[1]) && Number(latestDate[2])< Number(todayDate[2]) ) {
        return true;
    }
    else{
        return false;
    }
}

