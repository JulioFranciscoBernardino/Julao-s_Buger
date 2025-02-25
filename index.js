const prevButton = document.querySelector(".prev");
const nextButton = document.querySelector(".next");
const fotosContainer = document.querySelector(".fotos");

console.log("JavaScript carregado");

prevButton.addEventListener("click", () => {
    console.log("Botão anterior clicado");
    fotosContainer.scrollBy({ left: -300, behavior: 'smooth' });
});

nextButton.addEventListener("click", () => {
    console.log("Botão próximo clicado");
    fotosContainer.scrollBy({ left: 300, behavior: 'smooth' });
});

