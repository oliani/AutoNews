const APIUrl = "https://rss-back.vercel.app/api/feed";
let newsData;

function fetchURL(theURL) {
  return fetch(theURL)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro na requisição");
      }
      return response.text();
    })
    .then((data) => {
      console.log("Conteúdo da resposta:", data);
      return JSON.parse(data);
    })
    .then((parsedData) => {
      console.log("Fetch bem sucedido!", parsedData);
      return parsedData;
    })
    .catch((error) => {
      console.error("Erro: ", error);
      return null;
    });
}

function listPrint(data) {
  const now = new Date();

  data.forEach((element, index) => {
    const linkElement = document.createElement("a");
    linkElement.href = "#";
    linkElement.className =
      "list-group-item list-group-item-action flex-column align-items-start custom-list-item";
    linkElement.addEventListener("click", () => showContent(index));

    const publicationDate = new Date(element.pub_date);
    const formattedDate = formatDate(publicationDate);

    linkElement.innerHTML = `
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">${element.title}</h5>
        <small class="text-muted custom-text-white">${formattedDate}</small>
      </div>
      <div class="d-flex w-100 justify-content-between">
        <p class="text-muted custom-text-white">
          <img src="${element.img_url}" style="width: 100%; height: auto; border-radius: 10px; object-fit: cover;" alt="${element.title}">
          ${element.description}
        </p>
      </div>
      <small class="text-muted custom-text-white">
        <p><a href="${element.link}" style="text-decoration:none; color: rgb(16, 161, 168);" class="custom-text-white">Ler notícia completa</a></p>
      </small>
    `;
    document.querySelector("#newsList").appendChild(linkElement);
  });
}



function showContent(index) {
  console.log("Clicou no link com índice:", index);
  const publicationDate = newsData[index].pub_date;
  console.log("Data de publicação:", formatDate(publicationDate));
  draw(newsData[index].img_url, newsData[index].title);
}

function formatDate(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "UTC", // Ajuste conforme necessário
  };

  return new Intl.DateTimeFormat("pt-BR", options).format(new Date(date));
}

function draw(imgURL, title) {
  const canvasContainer = document.getElementById("canvas-container");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const downloadBtn = document.getElementById("download-btn");
  let img = new Image();

  img.crossOrigin = "anonymous"; // Para resolver problemas de CORS
  img.addEventListener("load", () => {
    canvas.width = 1080;
    canvas.height = 1080;

    drawImageOnCanvas(img, title, canvas, ctx);

    // Adiciona o preview da imagem
    canvasContainer.style.display = "block";
    downloadBtn.style.display = "block";
  });

  img.src = imgURL;

  function drawImageOnCanvas(img, title, canvas, ctx) {
    // Calcula as dimensões para preencher o canvas mantendo a proporção
    const aspectRatio = img.width / img.height;
    let newWidth, newHeight;

    // Calcula o fator de escala para preencher completamente o canvas
    const scaleToFit = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );

    // Calcula as novas dimensões
    newWidth = img.width * scaleToFit;
    newHeight = img.height * scaleToFit;

    // Calcula as posições para centralizar a imagem no canvas
    const drawX = (canvas.width - newWidth) / 2;
    const drawY = (canvas.height - newHeight) / 2;

    // Desenha a imagem de fundo
    ctx.drawImage(img, drawX, drawY, newWidth, newHeight);

    // Adiciona o degradê
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, "black");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adiciona o título próximo ao limite inferior da imagem
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    let fontSize = 60;
    const maxTextWidth = canvas.width - 20;

    // Quebra o título em linhas para garantir a visibilidade total
    const lines = breakTextIntoLines(
      title.toUpperCase(),
      `${fontSize}px 'Anton', sans-serif`,
      maxTextWidth
    );

    // Calcula a altura total ocupada pelo texto
    const totalTextHeight = lines.length * fontSize;

    // Ajusta a posição inicial para ficar próximo ao limite inferior da imagem
    let titleY = canvas.height - 20 - totalTextHeight; // Ajuste conforme necessário

    // Desenha cada linha do texto com uma borda preta
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    lines.forEach((line) => {
      titleY += fontSize; // Desce uma linha
      // Desenha a borda preta
      ctx.strokeText(line, canvas.width / 2, titleY);
      // Desenha o texto branco
      ctx.fillText(line, canvas.width / 2, titleY);
    });
  }

  // Função auxiliar para quebrar o texto em linhas
  function breakTextIntoLines(text, font, maxWidth) {
    ctx.font = font;
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }

    lines.push(currentLine);
    return lines;
  }
}

function downloadImage() {
  const canvas = document.getElementById("canvas");
  const dataURL = canvas.toDataURL("image/jpeg");

  // Cria um link para fazer o download da imagem
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "AutoNews_Image.jpg";
  link.click();
}

function getContent() {
  fetchURL(APIUrl)
    .then((data) => {
      if (!data) {
        document.querySelector(
          "#newsList"
        ).innerHTML = `<h2 class="center">Manutenção <h2> <br><h3 class="center"> Tente novamente mais tarde</h3>`;
      } else {
        newsData = data;
        listPrint(newsData);
      }
    })
    .catch((error) => {
      console.error("Erro ao chamar fetchURL:", error);
    });
}

getContent();
