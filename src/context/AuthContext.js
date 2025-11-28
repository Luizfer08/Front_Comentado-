import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; 

// Cria o contexto vazio que vai compartilhar os dados
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Estado de carregamento: Impede que o site abra antes de verificar se existe um token salvo
    const [loading, setLoading] = useState(true); 

    // 1. PERSISTÊNCIA DE SESSÃO (Auto-Login)
    // Roda apenas uma vez quando a aplicação inicia.
    useEffect(() => {
        const loadUserFromStorage = async () => {
            const token = localStorage.getItem('authToken');
            
            if (token) {
                try {
                    // Se achou token, já configura o Axios para usar em todas as requisições
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Valida o token chamando a API para pegar os dados do usuário
                    const response = await api.get('/api/users/me'); 
                    setUser(response.data); 
                } catch (error) {
                    // Se o token for inválido ou expirado, limpa tudo
                    localStorage.removeItem('authToken');
                    api.defaults.headers.common['Authorization'] = null;
                    console.error("Erro ao carregar usuário pelo token:", error);
                }
            }
            setLoading(false); // Libera a renderização da tela
        };
        loadUserFromStorage();
    }, []); 

    // 2. FUNÇÃO DE LOGIN
    const login = async (email, password) => {
        try {
            // Envia email/senha
            const response = await api.post('/login', { email, password });
            const { accessToken } = response.data;
            
            // Salva token no navegador e no cabeçalho do Axios
            localStorage.setItem('authToken', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Busca imediatamente os dados do usuário (Nome, Role, ID) para atualizar o estado
            const userResponse = await api.get('/api/users/me');
            setUser(userResponse.data); 
            return userResponse.data; 
        } catch (error) {
            // Garante limpeza em caso de erro
            localStorage.removeItem('authToken');
            api.defaults.headers.common['Authorization'] = null;
            setUser(null);
            throw error; 
        }
    };

    // 3. FUNÇÃO DE LOGOUT
    const logout = () => {
        localStorage.removeItem('authToken');
        api.defaults.headers.common['Authorization'] = null;
        setUser(null); 
    };

    
    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
            {/* TÉCNICA IMPORTANTE: 
                O '{!loading && children}' garante que o app só seja desenhado na tela 
                DEPOIS que a verificação do token no useEffect terminar.
                Isso evita que o usuário seja chutado para o login erradamente por 1 segundo.
            */}
            {!loading && children} 
        </AuthContext.Provider>
    );
};

// Hook personalizado para facilitar o uso (ex: const { user } = useAuth())
export const useAuth = () => {
    return useContext(AuthContext);
};