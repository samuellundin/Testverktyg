$(document).ready(function(){

    $(function() {
        $( "#dialog" ).dialog({
            modal: true,
            //dialogClass: "no-close",
            autoOpen: true,
            draggable: false,
            resizable: false,
            autoResize: true,
            show: 1000,
            hide: false
        });
    });

    $(window).resize(function() {
        $("#dialog").dialog("option", "position", {my: "center", at: "center", of: window});
    });



});