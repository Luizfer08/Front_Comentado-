import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import styles from './EditarBarbeiro.module.css'; 
import { useAuth } from '../../context/AuthContext'; 

function EditarBarbeiro() {
    // Pega os dados do usuário logado (incluindo o barberId)
    const { user } = useAuth(); 
    const navigate = useNavigate();

    // Estado dos campos (inclui 'bio', que é específico de barbeiros)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        bio: '' 
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. CARGA DE DADOS (READ)
    useEffect(() => {
        // Só tenta buscar se o usuário tiver um ID de barbeiro vinculado
        if (user && user.barberId) {
            const fetchBarberData = async () => {
                setLoading(true);
                setError(''); 
                try {
                    // Busca dados específicos da tabela de Barbeiros
                    const response = await api.get(`/api/Barber/${user.barberId}`); 
                    const data = response.data;
                    
                    setFormData({
                        fullName: data.fullName || '',
                        email: data.email || user.email, 
                        phoneNumber: data.phoneNumber || '',
                        bio: data.bio || '' // Preenche a biografia existente
                    });

                } catch (err) {
                    setError('Erro ao carregar seus dados. Tente novamente mais tarde.'); 
                    console.error("Erro ao buscar dados:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchBarberData();
        } else if (user) {
            // Tratamento de erro caso a conta não seja de barbeiro
            setLoading(false);
            setError("Não foi possível encontrar o ID de barbeiro associado a esta conta.");
        }
        
    }, [user]); 
    
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVoltar = (e) => {
        e.preventDefault();
        navigate(-1); 
    };
    
    // 2. ATUALIZAÇÃO (UPDATE)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const barberId = user?.barberId;
        if (!barberId) {
            setError("Erro: ID do barbeiro não encontrado. Faça login novamente.");
            return;
        }

        try {
            // Envia PUT para a rota de Barbeiros (diferente da rota de usuários)
            await api.put(`/api/Barber/${barberId}`, formData); 
            alert('Perfil atualizado com sucesso!');
            navigate('/gestao'); // Volta para o painel de gestão
        } catch (err) {
            console.error("Erro ao salvar perfil:", err.response);
            setError('Erro ao atualizar o perfil. Verifique os dados e tente novamente.');
        }
    };

    if (loading && !error) return <p style={{color: 'white', textAlign: 'center'}}>Carregando perfil...</p>;

    
    return (
        <div className={styles.page}>
            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit}>
                    <h1>Editar Perfil</h1>
                    
                    <div className={styles.inputGroup}>
                        <label>Nome Completo</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label>E-mail (não pode ser alterado)</label>
                        <input type="email" name="email" value={formData.email} disabled />
                    </div>

                    {/* Campo Exclusivo para Barbeiros */}
                    <div className={styles.inputGroup}>
                        <label>Bio / Descrição (Opcional)</label>
                        <textarea
                            name="bio"
                            className={styles.textarea} 
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Fale um pouco sobre você..."
                        />
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label>Celular / WhatsApp</label>
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
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

export default EditarBarbeiro;