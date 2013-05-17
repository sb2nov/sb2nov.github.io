function createSidebar(){
    document.getElementById('sidebar').innerHTML = '<h1><a href=\"index.html\">Sourabh Bajaj</a></h1><p>Software Developer</p><hr width=\"50%\">\
        <p class=\"view\"><a href=\"about.html\">About Me<small>Who I am</small></a></p>\
        <p class=\"view\"><a href=\"experience.html\">Experience<small>Where I have worked</small></a></p>\
        <p class=\"view\"><a href=\"projects.html\">Projects<small>What I have done</small></a></p><p></p>\
        <hr width=\"50%\">\
        <h3>Contact</h3>\
        <p class=\"view\"><a href=\"mailto:sourabhbajaj@gatech.edu\">Email<small>Email me</small></a></p>\
        <p class=\"view\"><a href=\"https://github.com/sb2nov\">Github<small>Code lives here</small></a></p>\
        <p class=\"view\"><a href=\"http://www.linkedin.com/in/sbajaj9\">LinkedIn<small>Connect with me</small></a></p>';
}
var metas = document.getElementsByTagName('meta');
var i;
if (navigator.userAgent.match(/iPhone/i)) {
  for (i=0; i<metas.length; i++) {
    if (metas[i].name == "viewport") {
      metas[i].content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";
    }
  }
  document.addEventListener("gesturestart", gestureStart, false);
}
function gestureStart() {
  for (i=0; i<metas.length; i++) {
    if (metas[i].name == "viewport") {
      metas[i].content = "width=device-width, minimum-scale=0.25, maximum-scale=1.6";
    }
  }
}

window.onload = createSidebar;