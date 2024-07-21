document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".fa-pen");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const parentDiv = button.parentElement;
      const hElement = parentDiv.querySelector("h1, h2");
      const inputElement = parentDiv.querySelector('input[type="text"]');

      if (
        inputElement.style.display == "none") {
        inputElement.style.display = "inline";
        hElement.style.display = "none";
        inputElement.focus();
      } else {
        inputElement.style.display = "none";
        hElement.style.display = "inline";
      }
    });
  });
});
