import React, { useState } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import axios from 'axios'; 
import api from '../../services/api'; 
import styles from './Cadastro.module.css';

function Cadastro() {
    
    // Estados para armazenar os dados digitados pelo usuário
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // Estados de Endereço
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    
    // Controle de UI (Termos, Erros e Loading)
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [cepLoading, setCepLoading] = useState(false);
    
    const navigate = useNavigate();

    // 1. BUSCA AUTOMÁTICA DE CEP
    // Acionada quando o usuário tira o foco do campo (onBlur)
    const handleCepBlur = async (e) => {
        const currentCep = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
        
        if (currentCep.length !== 8) return; // Validação básica de tamanho
        
        setCepLoading(true);
        setError('');
        try {
            // Chama a API pública do ViaCEP
            const response = await axios.get(`https://viacep.com.br/ws/${currentCep}/json/`);
            
            if (response.data.erro) {
                setError('CEP não encontrado.');
                // Limpa campos se o CEP for inválido
                setStreet(''); setNeighborhood(''); setCity(''); setState('');
            } else {
                // Preenche automaticamente os campos de endereço
                setStreet(response.data.logradouro);
                setNeighborhood(response.data.bairro);
                setCity(response.data.localidade);
                setState(response.data.uf);
            }
        } catch (err) {
            setError('Erro ao buscar o CEP. Tente novamente.');
        } finally {
            setCepLoading(false);
        }
    };

    // 2. ENVIO DO REGISTRO
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validação de confirmação de senha
        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        try {
            // Envia todos os dados para a SUA API (Backend)
            await api.post('/api/auth/register-customer', {
                fullName,
                email,
                password,
                phoneNumber,
                cep,
                street,
                number,
                complement,
                neighborhood,
                city,
                state
            });
            
            alert('Cadastro realizado com sucesso! Você será redirecionado para a página de login.');
            navigate('/login'); // Redireciona para a tela de login

        } catch (err) {
            // Tratamento de erro: Tenta mostrar a mensagem específica que veio do Backend
            if (err.response && err.response.data) {
                const errorMessage = typeof err.response.data === 'string' 
                    ? err.response.data 
                    : 'Erro ao realizar o cadastro. Verifique seus dados.';
                setError(errorMessage);
            } else {
                setError('Não foi possível conectar ao servidor. Tente mais tarde.');
            }
        }
    };

    
    return (
        <div className={styles.tela}> 
            <div className={styles.container}>
                <form onSubmit={handleSubmit}>
                    <h1>Criar Conta</h1>

                    {/* --- Campos Pessoais --- */}
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                    {/* ... (email, senha, celular) ... */}

                    <hr style={{margin: '20px 0', borderColor: 'rgba(255,255,255,0.2)'}} />

                    {/* --- Campos de Endereço --- */}
                    <div className={styles.inputGroup}>
                        {/* onBlur dispara a busca do CEP */}
                        <input type="text" placeholder="CEP" value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} required />
                        {cepLoading && <p style={{color: 'white', fontSize: '12px'}}>Buscando...</p>}
                    </div>

                    <div className={styles.inputGroup}>
                        {/* disabled={cepLoading} evita edição enquanto a API busca */}
                        <input type="text" placeholder="Rua / Logradouro" value={street} onChange={e => setStreet(e.target.value)} required disabled={cepLoading} />
                    </div>

                    {/* ... (número, bairro, cidade, uf) ... */}

                    {/* Exibição de Erros */}
                    {error && <p className={styles.error}>{error}</p>}
                    
                    {/* --- Termos de Uso --- */}
                    <div className={styles.termsGroup}>
                        <input
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                        <label htmlFor="terms">
                            Eu li e aceito os <Link to="/termos-de-uso" className={styles.termsLink}>Termos de Uso</Link>.
                        </label>
                    </div>

                    {/* Botão desabilitado até aceitar os termos */}
                    <button type="submit" className={styles.button} disabled={!termsAccepted}>Cadastrar</button>

                    <div className={styles.loginRedirect}>
                        Já tem uma conta? 
                        <Link to="/login" className={styles.loginLink}>
                            Faça Login
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default Cadastro;