const upperLowerNumeric = /^[a-z\d]{3,16}$/i;
const usernameInput = document.getElementById("username");
const firstInput = document.getElementById("firstname");
const lastInput = document.getElementById("lastname");

usernameInput.addEventListener("keyup", validate);
firstInput.addEventListener("keyup", validate);
lastInput.addEventListener("keyup", validate);

function validate(e) {
  const target = e.target;
  if (upperLowerNumeric.test(target.value)) {
    target.style.backgroundColor = "palegreen";
  } else {
    target.style.backgroundColor = "lightpink";
  }
}
