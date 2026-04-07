document.addEventListener("DOMContentLoaded", () => {
  const homeButton = document.querySelector(".home-button");
  if (homeButton) {
    homeButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});
