document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".fa-pen");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const parentDiv = button.parentElement;
      const hElement = parentDiv.querySelector("h1, h2");
      const inputElement = parentDiv.querySelector('input[type="text"], input[type="password"]');

      if (inputElement.style.display == "none") {
        inputElement.style.display = "inline";
        hElement.style.display = "none";
        inputElement.focus();
      } else {
        inputElement.style.display = "none";
        hElement.style.display = "inline";
      }
    });
  });

  const profilePicture = document.getElementById("file"); 

  profilePicture.onchange = (evt) => {
    const [file] = profilePicture.files;
    if (file) {
      document.getElementById("profilePicture").src = URL.createObjectURL(file);
    }
  };

  document.getElementById("logout").onclick = () => {
    fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      if (response.ok) {
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
      }
    })
    .catch((error) => {
      console.error("Error during logout:", error);
    });
  };
  
});
