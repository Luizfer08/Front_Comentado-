import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Usado para chamar a API externa do ViaCEP
import api from '../../services/api'; // Sua API interna (Backend C#)
import styles from './EditarPerfil.module.css'; 

function EditarPerfil() {
    // Estado único para armazenar todos os campos do formulário
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    });
    
    // Estados de controle de interface (Loading e Erros)
    const [loading, setLoading] = useState(true);
    const [cepLoading, setCepLoading] = useState(false); // Loading específico para o campo de CEP
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 1. CARGA INICIAL DOS DADOS
    // Ao abrir a tela, busca os dados atuais do usuário para preencher os inputs.
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/users/me');
                const userData = response.data;
                
                // Mapeia os dados vindos do Backend (que podem ter objetos aninhados como 'address')
                // para o formato plano do estado do formulário.
                setFormData({
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    cep: userData.address?.cep || '',
                    street: userData.address?.street || '',
                    number: userData.address?.number || '',
                    complement: userData.address?.complement || '',
                    neighborhood: userData.address?.neighborhood || '',
                    city: userData.address?.city || '',
                    state: userData.address?.state || ''
                });

            } catch (err) {
                setError('Erro ao carregar seus dados. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []); 
    
    // Atualiza o estado conforme o usuário digita (Two-way data binding)
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. BUSCA AUTOMÁTICA DE CEP (Integração ViaCEP)
    // Disparado no evento onBlur (quando o usuário clica fora do campo CEP)
    const handleCepBlur = async (e) => {
        // Remove caracteres não numéricos (traços, pontos)
        const currentCep = e.target.value.replace(/\D/g, '');
        
        // Só pesquisa se tiver 8 dígitos
        if (currentCep.length !== 8) return;
        
        setCepLoading(true);
        setError('');
        try {
            // Nota: Usa 'axios' puro aqui em vez de 'api' porque é uma URL externa
            // e não queremos usar a BaseURL do seu backend.
            const response = await axios.get(`https://viacep.com.br/ws/${currentCep}/json/`);
            
            if (response.data.erro) {
                setError('CEP não encontrado.');
            } else {
                // Preenche os campos de endereço automaticamente
                setFormData(prevData => ({
                    ...prevData,
                    street: response.data.logradouro,
                    neighborhood: response.data.bairro,
                    city: response.data.localidade,
                    state: response.data.uf,
                    complement: '', 
                }));
                
                // UX: Move o cursor automaticamente para o campo "Número"
                document.getElementsByName('number')[0].focus();
            }
        } catch (err) {
            setError('Erro ao buscar o CEP.');
        } finally {
            setCepLoading(false);
        }
    };

    
    const handleVoltar = (e) => {
        e.preventDefault();
        navigate(-1); // Volta 1 página no histórico do navegador
    };
    
    // 3. ENVIO DOS DADOS (Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Envia PUT para atualizar os dados
            await api.put('/api/users/me', formData);
            alert('Perfil atualizado com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            setError('Erro ao atualizar o perfil. Verifique os dados e tente novamente.');
        }
    };

    if (loading) return <div className={styles.page}><p style={{color: 'white', textAlign: 'center'}}>Carregando perfil...</p></div>;

    
    return (
        <div className={styles.page}>
            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit}>
                    <h1>Editar Perfil</h1>
                    
                    {/* Campos Pessoais */}
                    <div className={styles.inputGroup}>
                        <label>Nome Completo</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    {/* E-mail desabilitado (disabled) pois geralmente é o ID de login e não deve mudar fácil */}
                    <div className={styles.inputGroup}>
                        <label>E-mail (não pode ser alterado)</label>
                        <input type="email" name="email" value={formData.email} disabled />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Celular / WhatsApp</label>
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    </div>

                    <hr className={styles.divider} />
                    
                    {/* Campos de Endereço */}
                    <div className={styles.inputGroup}>
                        {/* Mostra feedback visual se estiver buscando o CEP */}
                        <label>CEP {cepLoading && <span>(Buscando...)</span>}</label>
                        <input type="text" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} required />
                    </div>
                     <div className={styles.inputGroup}>
                        <label>Rua / Logradouro</label>
                        <input type="text" name="street" value={formData.street} onChange={handleChange} required disabled={cepLoading} />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label>Nº</label>
                            <input type="text" name="number" value={formData.number} onChange={handleChange} required disabled={cepLoading} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Complemento</label>
                            <input type="text" name="complement" value={formData.complement} onChange={handleChange} disabled={cepLoading} />
                        </div>
                    </div>

                    {/* ... Restante dos campos (Bairro, Cidade, UF) seguem o mesmo padrão ... */}
                    <div className={styles.inputGroup}>
                        <label>Bairro</label>
                        <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} required disabled={cepLoading} />
                    </div>
                    
                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label>Cidade</label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} required disabled={cepLoading} />
                        </div>
                        <div className={styles.inputGroup} style={{ flex: '0.5' }}>
                            <label>UF</label>
                            <input type="text" name="state" value={formData.state} onChange={handleChange} maxLength="2" required disabled={cepLoading} />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    
                    <div className={styles.buttonContainer}>
                        <button type="button" onClick={handleVoltar} className={styles.backButton}>
                            Voltar
                        </button>
                        <button type="submit" className={styles.saveButton}>
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditarPerfil;