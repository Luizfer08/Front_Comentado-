import { Navigate } from 'react-router-dom';

// O componente recebe uma prop chamada 'children'.
// 'children' representa o componente filho que está dentro do PrivateRoute lá no AppRoutes.
// Exemplo: Em <PrivateRoute><Dashboard /></PrivateRoute>, o 'children' é o <Dashboard />.
const PrivateRoute = ({ children }) => {
  
  // 1. Acesso ao LocalStorage: Busca o item 'authToken' no armazenamento do navegador.
  // 2. Operador !! (Dupla Negação): 
  //    - Se 'authToken' for null ou undefined (não existe), vira false.
  //    - Se 'authToken' tiver qualquer texto (o token), vira true.
  // Resultado: A variável 'isAuthenticated' será apenas true ou false.
  const isAuthenticated = !!localStorage.getItem('authToken'); 

  
  // Lógica de Renderização Condicional (Operador Ternário):
  // SE estiver autenticado (true) -> Renderiza o 'children' (a página que o usuário queria ver).
  // SENÃO (false) -> Renderiza o componente <Navigate /> que força o redirecionamento para "/login".
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;