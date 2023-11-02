/*--------------------*/
/*        MENU        */
/*--------------------*/

// Script to open and close sidebar
function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("myOverlay").style.display = "block";
  document.getElementById("myOverlay").style.position = "fixed";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
  document.getElementById("myOverlay").style.position = "relative";
}

/*--------------------*/
/*      QUESTION      */
/*--------------------*/

// according to questions
function according(id) {
  var x = document.getElementById(id);
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show";
  } else {
    x.className = x.className.replace(" w3-show", "");
  }
}