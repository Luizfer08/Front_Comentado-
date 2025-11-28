import axios from 'axios';

// Cria uma instância do Axios com o endereço base da API
const api = axios.create({
  baseURL: 'https://localhost:7275' 
});

// Interceptor: Roda antes de toda requisição sair do front-end
api.interceptors.request.use(async config => {
  // Pega o token salvo no navegador
  const token = localStorage.getItem('authToken');
  
  // Se houver token, adiciona ele no cabeçalho para autenticar a chamada
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;