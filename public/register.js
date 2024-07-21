function registerCheck(event) {
  event.preventDefault();

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const re_password = document.getElementById("re-password");

  let valid = true;

  document.getElementById("nameLengthError").style.display = "none";
  document.getElementById("emailError").style.display = "none";
  document.getElementById("passwordLengthError").style.display = "none";
  document.getElementById("passwordMatchError").style.display = "none";

  if (name.value.length < 5 || name.value.length > 25) {
    document.getElementById("nameLengthError").style.display = "block";
    valid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value)) {
    document.getElementById("emailError").style.display = "block";
    valid = false;
  }

  if (password.value.length < 7 || password.value.length > 20) {
    document.getElementById("passwordLengthError").style.display = "block";
    valid = false;
  }

  if (re_password.value !== password.value) {
    document.getElementById("passwordMatchError").style.display = "block";
    valid = false;
  }

  if (valid) {
    // Form is valid, submit it
    alert("Successful registration!");
    document.getElementById("registerForm").submit();
  }
}

document.getElementById("registerForm").addEventListener("submit", registerCheck);
