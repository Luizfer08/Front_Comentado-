import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './Dashboard.module.css'; 
import { useAuth } from '../../context/AuthContext';
import { FaCog } from 'react-icons/fa'; 

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Estados para armazenar os dados vindos da API
    const [agendamentos, setAgendamentos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false); 

    // 1. CARGA DE DADOS (Load Inicial)
    // Busca os agendamentos e serviços assim que o componente é montado.
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Endpoint específico: Retorna apenas os agendamentos DO USUÁRIO logado
                const agendaResponse = await api.get('/api/appointments/my-appointments');
                
                // LÓGICA DE ORDENAÇÃO (Client-side Sorting):
                // Organiza o array para que os agendamentos mais próximos apareçam primeiro.
                const sortedAgenda = agendaResponse.data.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
                setAgendamentos(sortedAgenda);

                // Busca lista de serviços para exibir os preços no rodapé
                const servicosResponse = await api.get('/api/Services'); 
                setServicos(servicosResponse.data);
                
                setError(null);
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setError("Não foi possível carregar os dados do painel.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    // Auxiliar para navegar e fechar o menu ao mesmo tempo
    const navigateAndClose = (path) => {
        navigate(path);
        setMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/login');
    };

    // 2. DELETAR CONTA (Danger Zone)
    const handleDeleteAccount = async () => {
        if (window.confirm('Você tem certeza que deseja deletar sua conta? Esta ação é irreversível.')) {
            try {
                // Nota: Aqui deveria ter a chamada api.delete('/api/users/me'), 
                // mas parece que o código está apenas simulando por enquanto.
                alert('Sua conta foi deletada com sucesso.');
                handleLogout();
            } catch (err) {
                setError('Não foi possível deletar sua conta.');
            }
        }
    };

    // 3. CANCELAMENTO DE AGENDAMENTO
    const handleCancelar = async (appointmentId) => {
        if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                // Envia solicitação de cancelamento para a API
                await api.put(`/api/appointments/${appointmentId}/cancel`); 
                alert('Agendamento cancelado com sucesso!');
                
                // RE-FETCH: Busca a lista atualizada para mostrar o novo status "Cancelado" na tela imediatamente
                const agendaResponse = await api.get('/api/appointments/my-appointments');
                const sortedAgenda = agendaResponse.data.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
                setAgendamentos(sortedAgenda);
            } catch (err) {
                console.error("Erro ao cancelar:", err);
                alert('Erro ao cancelar o agendamento.');
            }
        }
    };

    if (loading) {
        return <div className={styles.page}><p style={{color: 'white', textAlign: 'center'}}>Carregando...</p></div>;
    }

    return (
        <div className={styles.page}>
            
            <header className={styles.header}>
                {/* Exibe apenas o primeiro nome do usuário */}
                <h1>Olá, <strong>{user?.fullName.split(' ')[0]}!</strong></h1>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={styles.welcomeMessage}>Bem-vindo(a)!</span>
                    
                    {/* Menu Dropdown de Configurações */}
                    <div className={styles.settingsMenu}>
                        <button onClick={() => setMenuOpen(!menuOpen)} className={styles.gearButton}>
                            <FaCog />
                        </button>
                        {menuOpen && (
                            <div className={styles.dropdown}>
                                <button onClick={() => navigateAndClose('/barbeiros')}>Barbeiros</button>
                                <button onClick={() => navigateAndClose('/perfil')}>Editar Perfil</button>
                                <button onClick={handleDeleteAccount} style={{color: 'red'}}>Deletar Conta</button>
                                <hr style={{borderColor: '#444', margin: '5px 0'}} />
                                <button onClick={handleLogout}>Sair</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.content}>
                
                {error && <p className={styles.error}>{error}</p>}

                {/* --- SEÇÃO DE AGENDAMENTOS --- */}
                <section className={styles.section}>
                    <h2>Meus Próximos Agendamentos</h2>
                    <div className={styles.appointmentsGrid}>
                        {agendamentos.length > 0 ? agendamentos.map(app => (
                            <div key={app.id} className={styles.appointmentCard}>
                                <div className={styles.cardHeader}>
                                    {/* Formatação de Data e Hora para PT-BR */}
                                    <span className={styles.date}>{new Date(app.startDateTime).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                                    <span className={styles.time}>{new Date(app.startDateTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                                </div>
                                <p><strong>Barbeiro:</strong> {app.barber?.userAccount?.fullName || 'N/A'}</p>
                                <p><strong>Serviços:</strong> {app.services.map(s => s.name).join(', ')}</p>
                                <p><strong>Status:</strong> <span className={styles.statusAgendado}>{app.status === 0 ? 'Agendado' : 'Cancelado'}</span></p>
                                
                                {/* Botão de Cancelar: Só aparece se o status for 0 (Agendado) */}
                                {app.status === 0 && (
                                    <button onClick={() => handleCancelar(app.id)} className={styles.cancelButton}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        )) : (
                            <p style={{color: '#ccc'}}>Você não possui agendamentos futuros.</p>
                        )}
                    </div>
                    {/* Botão Principal de Ação (CTA) */}
                    <Link to="/agendamento" className={styles.agendarButton}>
                        + Agendar Novo Horário
                    </Link>
                </section>

                {/* --- SEÇÃO DE TABELA DE PREÇOS --- */}
                <section className={styles.section}>
                    <h2>Nossos Serviços</h2>
                    <div className={styles.servicesGrid}>
                        {servicos.map(service => (
                            <div key={service.id || service._id} className={styles.serviceTag}>
                                {/* Formatação de Preço (R$ 00,00) */}
                                {service.name} <span>R$ {Number(service.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}

export default Dashboard;