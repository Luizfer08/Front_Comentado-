import React from 'react';
import ReactDOM from 'react-dom/client'; // Importa o renderizador do React 18+
import './index.css'; // Importa os estilos globais (CSS que vale para o site todo)
import AppRoutes from 'routes.js'; // Importa o seu arquivo de rotas (que vimos no primeiro passo)
import { AuthProvider } from './context/AuthContext'; // Importa o provedor de Autenticação

// Seleciona a div com id="root" no seu arquivo index.html.
// É dentro dessa div que todo o site React será desenhado.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza a aplicação na tela
root.render(
  // StrictMode: Uma ferramenta de desenvolvimento que ajuda a achar erros. 
  // Nota: Ele faz os efeitos (useEffect) rodarem duas vezes em desenvolvimento para testar a aplicação.
  <React.StrictMode>
    
    {/* AuthProvider (Provedor de Contexto):
      Aqui está o "segredo" do login global. Ao envolver o <AppRoutes /> com o <AuthProvider>,
      você garante que TODOS os componentes e páginas dentro das rotas tenham acesso
      aos dados de usuário e funções de login/logout, sem precisar ficar passando props manualmente.
    */}
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
    
  </React.StrictMode>
);