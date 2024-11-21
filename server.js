const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PRIMARY_API = 'https://covid19-brazil-api.now.sh/api/report/v1';
const BACKUP_API = 'https://api.covid19api.com/summary';

app.use(express.json());

// Função para fazer retries
const fetchWithRetry = async (url, retries = 3) => {
  while (retries > 0) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar dados. Tentativas restantes: ${retries - 1}`);
      retries -= 1;
      if (retries === 0) throw error;
    }
  }
};

// Rota para buscar dados por estado
app.get('/dados/:estado', async (req, res) => {
  const estado = req.params.estado.toLowerCase();

  try {
    const data = await fetchWithRetry(`${PRIMARY_API}/brazil/uf/${estado}`);
    return res.json(data);
  } catch (primaryError) {
    console.warn('API primária falhou. Tentando API de backup.');

    try {
      const backupData = await fetchWithRetry(BACKUP_API);
      const brasilData = backupData.Countries.find((country) => country.Country === 'Brazil');
      return res.json({
        uf: estado.toUpperCase(),
        cases: brasilData.TotalConfirmed,
        deaths: brasilData.TotalDeaths,
        refuses: brasilData.TotalRecovered,
      });
    } catch (backupError) {
      console.error('API de backup também falhou.');
      return res.status(500).json({ error: 'Erro ao buscar dados de ambas as APIs.' });
    }
  }
});

// Rota para buscar dados gerais
app.get('/dados-gerais', async (req, res) => {
  try {
    const data = await fetchWithRetry(PRIMARY_API);
    return res.json(data);
  } catch (primaryError) {
    console.warn('API primária falhou. Tentando API de backup.');

    try {
      const backupData = await fetchWithRetry(BACKUP_API);
      return res.json(backupData);
    } catch (backupError) {
      console.error('API de backup também falhou.');
      return res.status(500).json({ error: 'Erro ao buscar dados de ambas as APIs.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
