/**
 * Created by Sofia on 2017-02-28.
 */

//Save groups in Ajax
$(function(){
    $("#createGroup").click(function (event) {
        event.preventDefault();
        var groupTitle = document.getElementById(testName);
        var ids = [];
        $('ul#groupList li').each(function(){//Loops through the amount of users in the group

            ids.push($(this).attr('id')); //Adds each user in an array
        });
        //Create object groupData and save groupData in Ajax
        var groupData = {};
        groupData.title = groupTitle;
        groupData.ids = ids;

        $.ajax({
            url: '/group',
            method: 'post',
            data: testData,
            success: function(){}});


    });
});

