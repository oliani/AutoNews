const APIUrl = "https://rss-back.vercel.app/api/feed";
let newsData;
let copyTextContent = "";

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

function searchNews() {
  const searchTerm = document.getElementById("search-input").value.toLowerCase();

  const filteredNews = newsData.filter((news) => {
    return (
      news.title.toLowerCase().includes(searchTerm) ||
      news.description.toLowerCase().includes(searchTerm)
    );
  });

  document.querySelector("#newsList").innerHTML = "";
  listPrint(filteredNews);
}

function clearSearch() {
  document.getElementById("search-input").value = "";
  document.querySelector("#newsList").innerHTML = "";
  listPrint(newsData);
}

function showContent(index) {
  // Verifica se o índice é válido
  if (index < 0 || index >= newsData.length) {
    console.error("Índice inválido:", index);
    return;
  }

  console.log("Clicou no link com índice:", index);
  const publicationDate = newsData[index].pub_date;
  console.log("Data de publicação:", formatDate(publicationDate));
  draw(newsData[index].img_url, newsData[index].title);

  // Exibe o botão "Copiar texto" ao lado do botão "Fazer Download"
  showCopyTextButton();

  // Atualiza a variável global com o texto a ser copiado
  copyTextContent = `${newsData[index].title}\n\n${newsData[index].description}`;

  // Remove a exibição do botão "Copiar texto" para notícias anteriores
  const copyTextBtns = document.querySelectorAll('.copy-text-btn');
  copyTextBtns.forEach(btn => btn.style.display = 'none');

  // Encontrar o elemento .custom-list-item correspondente ao índice
  const linkElements = document.querySelectorAll('.custom-list-item');
  if (index < 0 || index >= linkElements.length) {
    console.error("Índice inválido para elementos .custom-list-item:", index);
    return;
  }

  const linkElement = linkElements[index];

  // Verifica se o elemento tem a classe .button-container
  const buttonContainer = linkElement.querySelector('.button-container');
  if (!buttonContainer) {
    return;
  }

  // Cria um novo botão "Copiar texto" para a notícia atual
  const copyTextBtn = document.createElement('button');
  copyTextBtn.textContent = 'Copiar texto';
  copyTextBtn.className = 'copy-text-btn btn btn-secondary'; // Adicione as classes do Bootstrap necessárias
  copyTextBtn.onclick = () => copyText();

  // Insere o botão "Copiar texto" ao lado do botão "Fazer Download"
  buttonContainer.appendChild(copyTextBtn);
}

function formatDate(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "UTC",
  };

  return new Intl.DateTimeFormat("pt-BR", options).format(new Date(date));
}

function draw(imgURL, title) {
  const canvasContainer = document.getElementById("canvas-container");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const downloadBtn = document.getElementById("download-btn");
  let img = new Image();

  img.crossOrigin = "anonymous";
  img.addEventListener("load", () => {
    canvas.width = 1080;
    canvas.height = 1080;

    drawImageOnCanvas(img, title, canvas, ctx);

    canvasContainer.style.display = "block";
    downloadBtn.style.display = "block";
  });

  img.src = imgURL;

  function drawImageOnCanvas(img, title, canvas, ctx) {
    const aspectRatio = img.width / img.height;
    let newWidth, newHeight;

    const scaleToFit = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );

    newWidth = img.width * scaleToFit;
    newHeight = img.height * scaleToFit;

    const drawX = (canvas.width - newWidth) / 2;
    const drawY = (canvas.height - newHeight) / 2;

    ctx.drawImage(img, drawX, drawY, newWidth, newHeight);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, "black");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    let fontSize = 60;
    const maxTextWidth = canvas.width - 20;

    const lines = breakTextIntoLines(
      title.toUpperCase(),
      `${fontSize}px 'Anton', sans-serif`,
      maxTextWidth
    );

    const totalTextHeight = lines.length * fontSize;

    let titleY = canvas.height - 20 - totalTextHeight;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    lines.forEach((line) => {
      titleY += fontSize;
      ctx.strokeText(line, canvas.width / 2, titleY);
      ctx.fillText(line, canvas.width / 2, titleY);
    });
  }

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

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "AutoNews_Image.jpg";
  link.click();
}

function copyText() {
  if (copyTextContent) {
    const textarea = document.createElement('textarea');
    textarea.value = copyTextContent;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Texto copiado para a área de transferência!');
  } else {
    alert('Nenhuma notícia selecionada para copiar o texto.');
  }
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

function showCopyTextButton() {
  const copyTextBtn = document.getElementById('copy-text-btn');
  copyTextBtn.style.display = 'inline-block';
}

getContent();
