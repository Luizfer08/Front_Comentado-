// Importações das páginas (Componentes) que serão exibidas em cada rota
import Inicio from "pages/inicio";
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Agendamento from './pages/Agendamento';
import PrivateRoute from './PrivateRoute'; // Componente de segurança (explico abaixo)
import { BrowserRouter, Route, Routes } from "react-router-dom"; // Biblioteca de rotas do React
import EditarPerfil from './pages/EditarPerfil';
import ManagementDashboard from './pages/ManagementDashboard';
import AdicionarBarbeiro from './pages/AdicionarBarbeiro';
import EditarBarbeiro from './pages/EditarBarbeiro';
import GerenciarServicos from './pages/GerenciarServicos';
import ListarBarbeiros from './pages/ListarBarbeiros';
import TermosDeUso from './pages/TermosDeUso';
import TermosBarbeiro from './pages/TermosBarbeiro';

function AppRoutes(){
     return (
         // BrowserRouter: Envolve toda a aplicação para habilitar a navegação sem recarregar a página (SPA)
         <BrowserRouter>
             {/* Routes: Garante que apenas UMA rota seja renderizada por vez, a que der "match" com a URL */}
             <Routes>
                 
                 {/* --- ROTAS PÚBLICAS --- */}
                 {/* Estas rotas podem ser acessadas por qualquer pessoa, sem estar logado */}
                 
                 {/* Rota raiz (Home page) */}
                 <Route path="/" element={<Inicio />}></Route>
                 
                 {/* Página de Login */}
                 <Route path="/login" element={<Login/>}></Route>
                 
                 {/* Página de Cadastro de usuários */}
                 <Route path="/registrar" element={<Cadastro/>}></Route>
                 
                 {/* Página de Termos de Uso */}
                 <Route path="/termos-de-uso" element={<TermosDeUso />}></Route>

                 {/* --- ROTAS PRIVADAS (PROTEGIDAS) --- */}
                 {/* Observe que o componente da página está envolvido por <PrivateRoute> */}
                 {/* A lógica é: O <PrivateRoute> verifica se o usuário está logado. 
                     Se sim -> Renderiza o filho (ex: <Dashboard />).
                     Se não -> Redireciona para o login. */}

                 {/* Dashboard principal do usuário/cliente */}
                 <Route 
                    path="/dashboard" 
                    element={<PrivateRoute><Dashboard /></PrivateRoute>}
                 />
                 
                 {/* Página de agendamento de serviço */}
                 <Route 
                    path="/agendamento" 
                    element={<PrivateRoute><Agendamento /></PrivateRoute>}
                 />

                 {/* Edição de perfil do usuário */}
                 <Route 
                  path="/perfil" 
                  element={<PrivateRoute><EditarPerfil /></PrivateRoute>}
                 />
                
                {/* --- ROTAS DE GESTÃO (Provavelmente para Admins/Gerentes) --- */}
                {/* Painel de Gestão */}
                 <Route 
                    path="/gestao"
                    element={<PrivateRoute><ManagementDashboard /></PrivateRoute>} 
                 />

                 {/* Adicionar novos barbeiros à equipe */}
                 <Route 
                    path="/adicionar-barbeiro" 
                    element={<PrivateRoute><AdicionarBarbeiro /></PrivateRoute>}
                 />

                 {/* Editar dados de um barbeiro existente */}
                 <Route
                     path="/editar-barbeiro"
                     element={<PrivateRoute><EditarBarbeiro /></PrivateRoute>}
                 />

                 {/* Gerenciar (criar/editar/excluir) os serviços oferecidos */}
                 <Route
                    path="/servicos"
                    element={<PrivateRoute><GerenciarServicos /></PrivateRoute>}
                 />
                 
                 {/* Termos específicos para barbeiros */}
                 <Route 
                     path="/termos-barbeiro" 
                     element={<PrivateRoute><TermosBarbeiro /></PrivateRoute>}
                 />

                 {/* Listagem de todos os barbeiros cadastrados */}
                 <Route
                    path="/barbeiros"
                    element={<PrivateRoute><ListarBarbeiros /></PrivateRoute>}
                 />
             </Routes>
         </BrowserRouter>
     )
}

export default AppRoutes;