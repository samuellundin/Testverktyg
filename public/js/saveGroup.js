/**
 * Created by Sofia on 2017-02-28.
 */

//Save groups in Ajax
$(function(){
    $("#createGroup").click(function (event) {
        event.preventDefault();

        var name = $('#testName').val();
        console.log(name);
        if(name == '') {

            document.getElementById('missingTitle').className = 'alert alert-danger';
            document.getElementById('missingTitle').textContent = 'Ange namn på gruppen';
            document.getElementById('inputError').className = 'form-group  has-error' ;
        }
        else if($('ul#groupList li').length==0){
            document.getElementById('missingMembers').className = 'alert alert-danger';
            document.getElementById('missingMembers').textContent = 'Gruppen saknar medlemmar';

        }
        else
            {
            var ids = [];
            $('ul#groupList li').each(function () {//Loops through the amount of users in the group

                ids.push($(this).attr('id')); //Adds each user in an array
            });
            //Create object groupData and save groupData in Ajax
            var groupData = {};
            console.log($('#testName').val());
            groupData.title = $('#testName').val();
            groupData.ids = ids;

            $.ajax({
                url: '/group',
                method: 'post',
                data: groupData,
                success: function () {
                    console.log('Hurra?');
                    location.replace('/');
                }
            });

        }
    });
});

