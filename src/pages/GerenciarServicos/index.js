import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import styles from './GerenciarServicos.module.css';
import { FaPen, FaTrash, FaArrowLeft } from 'react-icons/fa'; 

function GerenciarServicos() {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [services, setServices] = useState([]); // Lista carregada da API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado Dual: Se for null, estamos CRIANDO. Se tiver um ID, estamos EDITANDO.
    const [isEditing, setIsEditing] = useState(null); 
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationInMinutes: '',
        description: '' 
    });

    // 1. LEITURA (READ)
    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/Services'); 
            setServices(response.data);
            setError(null);
        } catch (err) {
            console.error("Erro ao buscar serviços:", err);
            setError("Não foi possível carregar os serviços.");
        } finally {
            setLoading(false);
        }
    };

    // Carrega a lista assim que a tela abre
    useEffect(() => {
        fetchServices();
    }, []);

    // Atualiza o state conforme o usuário digita nos inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Limpa o formulário e sai do modo de edição
    const handleCancel = () => {
        setIsEditing(null);
        setFormData({ name: '', price: '', durationInMinutes: '', description: '' }); 
    };

    // 2. PREPARAÇÃO PARA EDIÇÃO
    const handleEditClick = (service) => {
        window.scrollTo(0, 0); // Sobe a tela para o usuário ver o formulário
        const serviceId = service.id || service._id; 
        setIsEditing(serviceId); // Marca flag de edição
        
        // Formata preço para exibição no input (Troca ponto por vírgula para padrão BR)
        const displayPrice = String(service.price).replace('.', ',');

        setFormData({
            name: service.name,
            price: displayPrice, 
            durationInMinutes: service.durationInMinutes,
            description: service.description || '' 
        });
    };

    // 3. EXCLUSÃO (DELETE)
    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
            try {
                await api.delete(`/api/Services/${id}`);
                alert("Serviço excluído com sucesso!");
                fetchServices(); // Recarrega a lista para sumir com o item excluído
            } catch (err) {
                console.error("Erro ao excluir:", err);
                alert("Erro ao excluir o serviço.");
            }
        }
    };

    // 4. CRIAÇÃO E ATUALIZAÇÃO (CREATE / UPDATE)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Prepara o objeto para envio
        const dataPayload = {
            id: isEditing ? parseInt(isEditing, 10) : 0, 
            name: formData.name,
            description: formData.description, 
            // Converte preço de volta para formato de banco (10,50 -> 10.50)
            price: parseFloat(String(formData.price).replace(',', '.')),
            durationInMinutes: parseInt(formData.durationInMinutes, 10)
        };

        // Validação simples
        if (isNaN(dataPayload.price) || dataPayload.price <= 0) {
             setError("O preço deve ser um número maior que zero.");
             return;
        }
         if (isNaN(dataPayload.durationInMinutes) || dataPayload.durationInMinutes <= 0) {
             setError("A duração deve ser um número maior que zero.");
             return;
        }

        try {
            // Lógica de Decisão: PUT se estiver editando, POST se for novo
            if (isEditing) {
                await api.put(`/api/Services/${isEditing}`, dataPayload);
                alert("Serviço atualizado com sucesso!");
            } else {
                await api.post('/api/Services', dataPayload);
                alert("Serviço cadastrado com sucesso!");
            }
            handleCancel();  // Limpa form
            fetchServices(); // Atualiza lista
        } catch (err) {
            console.error("Erro ao salvar:", err);
            const apiError = err.response?.data?.title || err.response?.data || "Erro ao salvar o serviço.";
            setError(apiError);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button onClick={() => navigate('/gestao')} className={styles.backButton}>
                    <FaArrowLeft /> Voltar
                </button>
                <h1>Gerenciar Serviços</h1>
                <div style={{width: '100px'}}></div> 
            </header>

            <main className={styles.mainGrid}>
                
                {/* --- SEÇÃO DO FORMULÁRIO (ESQUERDA/TOPO) --- */}
                <section className={styles.formSection}>
                    <div className={styles.formContainer}>
                        {/* Título muda dinamicamente */}
                        <h2>{isEditing ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
                        
                        <form onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="name">Nome do Serviço</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="description">Descrição (Opcional)</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    className={styles.textarea} 
                                    placeholder="Descreva o serviço..."
                                />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="price">Preço (R$)</label>
                                    {/* InputMode decimal ajuda no celular */}
                                    <input type="text" inputMode="decimal" name="price" placeholder="Ex: 50,00" value={formData.price} onChange={handleChange} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="durationInMinutes">Duração (minutos)</label>
                                    <input type="number" name="durationInMinutes" min="0" value={formData.durationInMinutes} onChange={handleChange} required />
                                </div>
                            </div>
                            
                            {error && <p className={styles.error}>{error}</p>}

                            <div className={styles.buttonContainer}>
                                {/* Botão Cancelar só aparece se estiver editando */}
                                {isEditing && (
                                    <button type="button" onClick={handleCancel} className={styles.cancelButton}>
                                         Cancelar
                                    </button>
                                )}
                                <button type="submit" className={styles.saveButton}>
                                    {isEditing ? 'Salvar Alterações' : 'Adicionar Serviço'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* --- SEÇÃO DA LISTA (DIREITA/BAIXO) --- */}
                <section className={styles.listSection}>
                    <h2>Serviços Cadastrados</h2>
                    {loading && <p style={{color: '#ccc'}}>Carregando...</p>}
                    
                    <div className={styles.serviceList}>
                        {services.map(service => {
                            const serviceId = service.id || service._id; 
                            return (
                                <div key={serviceId} className={styles.serviceCard}>
                                    <div className={styles.serviceInfo}>
                                        <h3>{service.name}</h3>
                                        {/* Formatação de Moeda Brasileira */}
                                        <p>Preço: R$ {Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <p>Duração: {service.durationInMinutes} min</p>
                                        {service.description && <p style={{color: '#aaa', fontSize: '0.9rem'}}><em>{service.description}</em></p>}
                                    </div>
                                    
                                    {/* Botões de Ação do Card */}
                                    <div className={styles.serviceActions}>
                                        <button onClick={() => handleEditClick(service)} className={styles.iconButton}>
                                            <FaPen />
                                        </button>
                                        <button onClick={() => handleDelete(serviceId)} className={`${styles.iconButton} ${styles.deleteButton}`}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default GerenciarServicos;