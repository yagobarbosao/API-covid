const exibirMensagem = (mensagem) => {
  let messageDiv = document.getElementById('message');

  if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.id = 'message';
    messageDiv.classList.add('text-danger');
    const formGroup = document.querySelector('.form-group');
    formGroup.insertAdjacentElement('afterend', messageDiv);
  }

  messageDiv.textContent = mensagem;
};

const limparMensagem = () => {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.remove();
  }
};

const preencherTabela = (casos) => {
  limparMensagem();
  const tableBody = document.querySelector('#api-table tbody');

  const siglasNaTabela = Array.from(tableBody.querySelectorAll('tr')).map(
    (row) => row.cells[1].textContent
  );

  if (!siglasNaTabela.includes(casos.uf)) {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = casos.uid;
    row.insertCell(1).textContent = casos.uf;
    row.insertCell(2).textContent = casos.cases;
  }
};

const buscarDados = async () => {
  const estado = document.querySelector('#estado').value.trim().toLowerCase();

  if (!estado) {
    exibirMensagem('Por favor, insira uma sigla válida.');
    return;
  }

  const url = `https://covid19-brazil-api.now.sh/api/report/v1/brazil/uf/${estado}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('ESTADO NÃO ENCONTRADO');
    }

    const casos = await response.json();

    if (!casos || !casos.uf || !casos.cases) {
      throw new Error('ESTADO NÃO ENCONTRADO');
    }

    preencherTabela(casos);
  } catch (error) {
    console.error('Erro ao buscar:', error);
    exibirMensagem(error.message);
  }
};

document.getElementById('buscar').addEventListener('click', function (event) {
  event.preventDefault();
  buscarDados();
});

const buscarDadosGerais = async () => {
  const url = 'https://covid19-brazil-api.now.sh/api/report/v1';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erro ao buscar dados gerais.');
    }

    const dados = await response.json();
    exibirGrafico(dados.data);
  } catch (error) {
    console.error('Erro ao buscar dados gerais:', error);
    exibirMensagem('Erro ao carregar dados gerais.');
  }
};

const exibirGrafico = (dados) => {
  const canvasContainer = document.getElementById('grafico-container');
  const canvas = document.getElementById('grafico-geral');
  const ctx = canvas.getContext('2d');

  // Toggle visibility of the chart container
  canvasContainer.style.display = canvasContainer.style.display === 'none' ? 'block' : 'none';

  if (canvasContainer.style.display === 'none') {
    // Destroy existing chart if container is hidden
    if (window.chartInstance) {
      window.chartInstance.destroy();
    }
    return;
  }

  const estados = dados.map((dado) => dado.uf);
  const casos = dados.map((dado) => dado.cases);
  const obitos = dados.map((dado) => dado.deaths);
  const recuperados = dados.map((dado) => dado.refuses);

  if (window.chartInstance) {
    window.chartInstance.destroy();
  }

  window.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: estados,
      datasets: [
        {
          label: 'Casos Confirmados',
          data: casos,
          backgroundColor: 'rgba(218, 165, 32, 0.5)',
        },
        {
          label: 'Óbitos',
          data: obitos,
          backgroundColor: 'rgba(255, 69, 0, 0.5)',
        },
        {
          label: 'Recuperados',
          data: recuperados,
          backgroundColor: 'rgba(0, 100, 0, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
    },
  });
};

document.getElementById('buscar-geral').addEventListener('click', function (event) {
  event.preventDefault();
  buscarDadosGerais();
});
