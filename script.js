const APIUrl = "newsData.json"; // Alterado para o arquivo local
let newsData;
let copyTextContent = "";
let currentSelected = -1;

function fetchURL(theURL) {
  return fetch(theURL)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro na requisição");
      }
      return response.json(); // Alterado para retornar JSON diretamente
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
    linkElement.addEventListener("click", () => showContent(index, data));

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

function showContent(index, data) {
  console.log("Clicou no link com índice:", index);
  currentSelected = index;
  const publicationDate = data[index].pub_date;
  console.log("Data de publicação:", formatDate(publicationDate));
  draw(data[index].img_url, data[index].title);

  // Exibe o botão "Copiar texto" ao lado do botão "Fazer Download"
  showCopyTextButton();

  // Atualiza a variável global com o texto a ser copiado
  copyTextContent = `${data[index].title}\n\n${data[index].description}`;

  // Remova a exibição do botão "Copiar texto" para notícias anteriores
  const copyTextBtns = document.querySelectorAll('.copy-text-btn');
  copyTextBtns.forEach(btn => btn.style.display = 'none');

  // Cria um novo botão "Copiar texto" para a notícia atual
  const linkElement = document.querySelectorAll('.custom-list-item')[index];
  const copyTextBtn = document.createElement('button');
  copyTextBtn.textContent = 'Copiar texto';
  copyTextBtn.className = 'copy-text-btn btn btn-secondary'; // Adicione as classes do Bootstrap necessárias
  copyTextBtn.onclick = () => copyText();

  // Insere o botão "Copiar texto" ao lado do botão "Fazer Download"
  const buttonContainer = linkElement.querySelector('.button-container');
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
  imgURL += "?not-from-cache-please";
  const canvasContainer = document.getElementById("canvas-container");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const downloadBtn = document.getElementById("download-btn");

  convertImageToBase64(imgURL, function(base64Img) {
    let img = new Image();
    img.src = base64Img;

    img.addEventListener("load", () => {
      canvas.width = 1080;
      canvas.height = 1080;

      drawImageOnCanvas(img, title, canvas, ctx);

      canvasContainer.style.display = "block";
      downloadBtn.style.display = "block";
    });
  });

  function convertImageToBase64(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      let reader = new FileReader();
      reader.onloadend = function() {
        callback(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
  }

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

  // Verifica se é iOS
  if (navigator.userAgent.match(/(iPad|iPhone|iPod)/i)) {
    // Cria um novo link com o valor data URL
    const newWindow = window.open();
    newWindow.document.write('<img src="' + dataURL + '" alt="AutoNews Image"/>');
    newWindow.document.close();
  } else {
    // Para outros navegadores, simplesmente clica no link para iniciar o download
    link.click();
  }
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

async function processText() {
  if (currentSelected === -1) {
    alert('Nenhuma notícia selecionada para processar o texto.');
    return;
  }

  const title = newsData[currentSelected].title;
  const description = newsData[currentSelected].description;

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: `${title}\n\n${description}` }),
  };

  try {
    const response = await fetch('http://localhost:3000/api/summarize-text', requestOptions);
    const data = await response.json();

    if (data && data.options && data.options.length > 0) {
      // Exibir opções para o usuário escolher
      const options = data.options.join('\n');
      const userChoice = prompt(`Escolha uma opção para o resumo:\n${options}`);
      
      if (userChoice && data.options.includes(userChoice)) {
        // Aqui você pode usar o resumo escolhido, por exemplo:
        alert(`Texto processado:\n${userChoice}`);
      } else {
        alert('Escolha inválida ou cancelada.');
      }
    } else {
      alert('Não foi possível obter opções de resumo.');
    }
  } catch (error) {
    console.error('Erro ao processar o texto:', error);
    alert('Erro ao processar o texto. Tente novamente mais tarde.');
  }
}

getContent();
