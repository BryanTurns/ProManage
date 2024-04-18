// document.addEventListener(
//   "DOMContentLoaded",
//   loadProgress()
// );
const progressBar = document.getElementById("progress-bar");
progress = Math.floor(100 * document.currentScript.getAttribute("progress"));
progressBar.style = `width: ${progress}%`;
progressBar.innerHTML = `${progress}%`;
