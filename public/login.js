function loginCheck(event) {
    event.preventDefault();  
  
    const email = document.getElementById("email");
    const password = document.getElementById("password");
  
    let valid = true;
  
    document.getElementById("emailError").style.display = "none";
    document.getElementById("passwordLengthError").style.display = "none";
 
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value)) {
      document.getElementById("emailError").style.display = "block";
      valid = false;
    }
  
    if (password.value.length < 7 || password.value.length > 20) {
      document.getElementById("passwordLengthError").style.display = "block";
      valid = false;
    }
  

    if (valid) {
      alert("Successful log in!");
      document.getElementById("loginForm").submit();
    }
  }
  
  document.getElementById("loginForm").addEventListener("submit", loginCheck);
  
  