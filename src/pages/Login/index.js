import styles from './Login.module.css';
import { FaUser, FaLock } from "react-icons/fa"; // Ícones visuais
import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

function Login(){
    // Estados para armazenar o que o usuário digita
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // Estado para mensagem de erro (ex: "Senha inválida")
    
    const navigate = useNavigate();

    // Importa a função de login e os dados do usuário do Contexto Global
    const { login, isAuthenticated, user } = useAuth(); 

    // 1. REDIRECIONAMENTO AUTOMÁTICO
    // Se o usuário acessar a página "/login" mas já estiver logado (token válido),
    // o sistema o joga automaticamente para a tela correta, sem pedir senha de novo.
    useEffect(() => {
        if (isAuthenticated && user) {
            // Verifica permissão: Admin ou Barbeiro vai para Gestão, Cliente vai para Dashboard
            if (user.roles.includes('Admin') || user.roles.includes('Barbeiro')) {
                navigate('/gestao'); 
            } else {
                navigate('/dashboard'); 
            }
        }
    }, [isAuthenticated, user, navigate]); 


    // 2. ENVIO DO FORMULÁRIO
    const handleSubmit = async (event) => {
        event.preventDefault(); // Evita recarregar a página (comportamento padrão do HTML)
        setError(""); 

        try {
            // Chama a função login do AuthContext (que conecta na API)
            // Se der certo, ela retorna os dados do usuário logado.
            const loggedInUser = await login(email, password); 

            // Se o login funcionou, faz o redirecionamento imediato baseando-se no cargo
            if (loggedInUser) {
                 if (loggedInUser.roles.includes('Admin') || loggedInUser.roles.includes('Barbeiro')) {
                    navigate('/gestao'); 
                } else {
                    navigate('/dashboard'); 
                }
            }

        } catch (err) {
            // Se a API retornar erro (401/403), exibe mensagem na tela
            setError('Falha no login. Verifique seu e-mail e senha.');
            console.error("Erro no login:", err);
        }
    };

    
    return(
        <div className={styles.tela}>
            <div className={styles.container}>
                <form onSubmit={handleSubmit} >
                    <h1>Acesso ao Sistema</h1>
                    
                    {/* Inputs controlados pelos estados (Two-way binding) */}
                    <div className={styles.texto}>
                        <input type="email" placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} required />
                        <FaUser className={styles.icon} />
                    </div>
                    <div className={styles.texto}>
                        <input type="password" placeholder='Senha' onChange={(e) => setPassword(e.target.value)} required/>
                        <FaLock className={styles.icon} />
                    </div>

                    <div className={styles.recallforget}>
                        <a href="/forgot-password">Esqueceu a senha?</a>
                    </div>
                    
                    <button>Login</button>
                    
                    {/* Renderização Condicional: Só mostra o <p> se houver erro */}
                    {error && <p className={styles.error}>{error}</p>}
                    
                    <div className={styles.registrar}>
                        <p>
                            <a href="/registrar">Registrar</a>
                        </p>
                    </div>
                </form>
            </div>
       </div> 
    )
}

export default Login;