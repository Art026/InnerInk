var i = 0;
var txt = 'Your Journey in Words'; // Corrected spelling of "Journey"
var speed = 50;

function typeWriter() {
  if (i < txt.length) {
    document.getElementById("word").innerHTML += txt.charAt(i);
    i++;
    setTimeout(typeWriter, speed);
  }
}

window.onload = function() {
  typeWriter(); // Call the typeWriter function when the window loads
};

$(document).ready(function() {
    $(window).scroll(function() {
        var scrollTop = $(window).scrollTop();
        if (scrollTop > 50) {
            $('.transparent-bar').addClass('solid-bar');
        } else {
            $('.transparent-bar').removeClass('solid-bar');
        }
    });
});





