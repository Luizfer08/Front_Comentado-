import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Link } from 'react-router-dom'; 
import styles from './ManagementDashboard.module.css';
import { useAuth } from '../../context/AuthContext'; 
import { FaCog } from 'react-icons/fa'; 

// Configurações padrão para dias da semana
const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const initialDayState = { isActive: false, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' };

function ManagementDashboard() {
    const { user, logout } = useAuth(); 
    const navigate = useNavigate();

    // --- ESTADOS DA AGENDA (Visualização de Cortes) ---
    const [agenda, setAgenda] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data atual
    const [allBarbers, setAllBarbers] = useState([]); // Lista de barbeiros (apenas p/ Admin)
    const [filterBarberId, setFilterBarberId] = useState(''); // Filtro selecionado pelo Admin

    // --- ESTADOS DOS HORÁRIOS DE TRABALHO (Configuração) ---
    const [schedule, setSchedule] = useState({});
    const [editingSchedule, setEditingSchedule] = useState(false); // Alterna modo visualização/edição

    // --- ESTADOS DE CONTROLE (Loading/Erro/Menu) ---
    const [loadingAgenda, setLoadingAgenda] = useState(true);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [error, setError] = useState('');
    const [menuOpen, setMenuOpen] = useState(false); 

    // --- PERMISSÕES ---
    const isAdmin = user?.roles.includes('Admin');
    const isStaff = isAdmin || user?.roles.includes('Barbeiro');
    const ownBarberId = user?.barberId; 

    // 1. VERIFICAÇÃO DE TERMOS (Segurança)
    // Se o barbeiro logar e ainda não tiver aceitado os termos, força o redirecionamento.
    useEffect(() => {
        if (user && ownBarberId) {
            if (isAdmin) return; // Admin não precisa assinar termos de barbeiro
            
            const checkTerms = async () => {
                try {
                    const response = await api.get(`/api/Barber/${ownBarberId}`);
                    // Se hasAcceptedTerms for falso, joga para a tela de contrato
                    if (response.data.hasAcceptedTerms === false) {
                        navigate('/termos-barbeiro');
                    }
                } catch (err) {
                    console.error("Erro ao verificar aceite dos termos:", err);
                    logout(); 
                }
            };
            checkTerms();
        }
    }, [user, ownBarberId, navigate, logout, isAdmin]); 


    // 2. CARGA INICIAL (Apenas Admin)
    // Busca a lista de todos os barbeiros para preencher o filtro (dropdown)
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            setLoadingInitial(true);
            try {
                if (isAdmin) {
                    const barbersResponse = await api.get('/api/barber');
                    setAllBarbers(barbersResponse.data);
                }
            } catch (err) {
                setError('Erro ao carregar lista de barbeiros.');
            } finally {
                setLoadingInitial(false);
            }
        };
        fetchInitialData();
    }, [user, isAdmin]);

    // 3. BUSCA AGENDA (Agendamentos)
    // Roda toda vez que a data (selectedDate) ou o usuário muda.
    useEffect(() => {
        const fetchAgenda = async () => {
            if (!selectedDate || !user) return;
            setLoadingAgenda(true);
            setError('');
            try {
                // Chama a API passando a data selecionada no calendário
                const response = await api.get(`/api/appointments/agenda?date=${selectedDate}`);
                setAgenda(response.data);
            } catch (err) {
                setError('Erro ao carregar a agenda do dia.');
            } finally {
                setLoadingAgenda(false);
            }
        };
        fetchAgenda();
    }, [selectedDate, user]);

    // 4. BUSCA HORÁRIOS DE TRABALHO
    // Transforma a lista da API em um Objeto organizado por dia da semana (0 a 6).
    useEffect(() => {
        // Define de qual barbeiro buscar: Do próprio (se for barbeiro) ou do filtro (se for admin)
        const barberIdToFetch = isAdmin && filterBarberId ? filterBarberId : ownBarberId;
        
        if (!isStaff || !barberIdToFetch) {
            setSchedule({}); 
            setLoadingSchedule(false);
            return;
        }

        setLoadingSchedule(true);
        setError(''); 
        api.get(`/api/work-schedule/${barberIdToFetch}`)
            .then(res => {
                // REDUCE: Converte Array [ {dayOfWeek: 1...}, {dayOfWeek: 2...} ] 
                // para Objeto { 1: {...}, 2: {...} } facilitando a leitura.
                const scheduleObject = res.data.reduce((acc, day) => {
                    acc[day.dayOfWeek] = {
                        startTime: day.startTime.substring(0, 5), // Formata HH:MM
                        endTime: day.endTime.substring(0, 5),
                        breakStartTime: day.breakStartTime ? day.breakStartTime.substring(0, 5) : '00:00',
                        breakEndTime: day.breakEndTime ? day.breakEndTime.substring(0, 5) : '00:00',
                        isActive: true 
                    };
                    return acc;
                }, {});

                // Preenche os dias que não vieram da API com o estado padrão (fechado)
                daysOfWeek.forEach((_, index) => {
                    if (!scheduleObject[index]) {
                        scheduleObject[index] = { ...initialDayState };
                    }
                });
                setSchedule(scheduleObject);
            })
            .catch(err => {
                 setError('Erro ao carregar horários de trabalho.');
            })
            .finally(() => setLoadingSchedule(false));
    }, [ownBarberId, filterBarberId, isAdmin, isStaff]); 


    // Função simples de Logout
    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/login');
    };

    // 'handleDeleteAccount' foi removida

    
// Loading Screen simples para evitar tela branca enquanto carrega dados do usuário
    if (loadingInitial || !user) return <div className={styles.page}><p>Carregando...</p></div>;

    return (
        <div className={styles.page}>
            
            {/* --- CABEÇALHO --- */}
            <header className={styles.header}>
                <h1>Painel de Gestão</h1>
                <div style={{ display: 'flex', alignItems: 'center' }}> 
                    <span className={styles.welcomeMessage}>Bem-vindo(a), <strong>{user.fullName}!</strong></span>
                    
                    {/* Menu de Configurações (Engrenagem) */}
                    <div className={styles.settingsMenu}>
                        <button onClick={() => setMenuOpen(!menuOpen)} className={styles.gearButton}>
                            <FaCog />
                        </button>
                        
                        {/* Dropdown Condicional (Abre/Fecha) */}
                        {menuOpen && (
                            <div className={styles.dropdown}>
                                {/* Renderização Condicional de botões baseada em Permissão (Roles) */}
                                {isStaff && ( <button onClick={() => navigateAndClose('/barbeiros')}>Barbeiros</button> )}
                                {isAdmin && ( <button onClick={() => navigateAndClose('/adicionar-barbeiro')}>Adicionar Barbeiro</button> )}
                                <button onClick={() => navigateAndClose(isStaff ? '/editar-barbeiro' : '/perfil')}>Editar Perfil</button>
                                
                                <hr style={{borderColor: '#444', margin: '5px 0'}} />
                                <button onClick={handleLogout}>Sair</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Mensagem de Erro Global */}
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
            
            <div className={styles.mainGrid}>
                
                {/* --- SEÇÃO DA AGENDA (ESQUERDA) --- */}
                <section className={styles.agendaSection}>
                    <h2>Agenda do Dia</h2>
                    
                    {/* Controles de Filtro (Data e Barbeiro) */}
                    <div className={styles.agendaControls}>
                        <label htmlFor="date-picker">Dia:</label>
                        <input type="date" id="date-picker" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                        
                        {/* Select de Barbeiros (Visível apenas para Admin) */}
                        {isAdmin && ( 
                            <>
                                <label htmlFor="barber-filter">Barbeiro:</label>
                                <select id="barber-filter" value={filterBarberId} onChange={e => setFilterBarberId(e.target.value)}>
                                    <option value="">Todos</option>
                                    {allBarbers.map(barber => <option key={barber.barberId} value={barber.barberId}>{barber.fullName}</option>)}
                                </select>
                            </>
                        )}
                    </div>

                    {/* Lista de Agendamentos */}
                    {loadingAgenda ? <p>Carregando agenda...</p> : (
                        <div className={styles.appointmentList}>
                            {filteredAgenda.length > 0 ? filteredAgenda.map(app => (
                                <div key={app.id} className={styles.appointmentCard}>
                                    {/* Exibe horário (convertendo UTC para local se necessário, ou apenas cortando string) */}
                                    <h3>{new Date(app.startDateTime).toLocaleTimeString('pt-BR', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit'})}</h3>
                                    <p><strong>Cliente:</strong> {app.customer.fullName}</p>
                                    
                                    {/* Mostra nome do barbeiro no card apenas se o admin estiver vendo "Todos" */}
                                    {isAdmin && !filterBarberId && <p><strong>Barbeiro:</strong> {app.barber?.userAccount?.fullName || 'N/A'}</p>}
                                    
                                    <p><strong>Serviços:</strong> {app.services.map(s => s.name).join(', ')}</p>
                                    <p><strong>Status:</strong> {app.status === 0 ? 'Agendado' : 'Cancelado'}</p>
                                </div>
                            )) : <p>Nenhum agendamento para este dia{filterBarberId ? ' para este barbeiro' : ''}.</p>}
                        </div>
                    )}
                </section>
                
                <section className={styles.actionsSection}>
                    <h2>Ações Rápidas</h2>
                    {/* O código cortou aqui... */}
                    {/* --- 1. BOTÃO DE CONFIGURAR HORÁRIOS --- */}
                    {/* LÓGICA COMPLEXA DE EXIBIÇÃO:
                        Mostra este botão SE:
                        1. For um Barbeiro comum (Staff mas não Admin)
                        OU
                        2. For um Admin E ele tiver selecionado um barbeiro específico no filtro (filterBarberId).
                        
                        Por que? O Admin não pode "editar horários" se estiver vendo a agenda de "Todos".
                    */}
                    {((isStaff && !isAdmin) || (isAdmin && filterBarberId)) && (
                        <button className={styles.actionButton} onClick={() => setEditingSchedule(!editingSchedule)}>
                            {/* Texto Dinâmico do Botão:
                                - Se estiver editando: Mostra "Fechar"
                                - Se não: Mostra "Editar..." (com o nome do barbeiro se for Admin, ou "Meus" se for Barbeiro)
                            */}
                            {editingSchedule 
                                ? 'Fechar Edição de Horários' 
                                : (isAdmin && filterBarberId 
                                    ? `Editar Horários (${allBarbers.find(b => b.barberId == filterBarberId)?.fullName || 'Selecionado'})` 
                                    : 'Editar Meus Horários')}
                        </button>
                    )}
                    
                    {/* --- 2. BOTÃO ADICIONAR BARBEIRO --- */}
                    {/* Exclusivo para usuários com role 'Admin' */}
                    {isAdmin && (
                         <button className={styles.actionButton} onClick={() => navigate('/adicionar-barbeiro')}>Adicionar Barbeiro</button>
                    )}
                     
                    {/* --- 3. BOTÃO GERENCIAR SERVIÇOS --- */}
                    {/* Visível para qualquer membro da equipe (Admin ou Barbeiro) */}
                    {isStaff && (
                         <Link to="/servicos" className={styles.actionButton}>
                             Gerenciar Serviços
                         </Link>
                    )}
                    
                    {/* --- 2. FORMULÁRIO DE HORÁRIOS SÓ APARECE SE FOR BARBEIRO OU ADMIN COM FILTRO --- */}
                    {/* --- CONDIÇÃO DE EXIBIÇÃO DO FORMULÁRIO --- */}
                    {/* O formulário só aparece se:
                        1. A variável de estado 'editingSchedule' for TRUE (clicou no botão)
                        E
                        2. O usuário tiver permissão válida (Barbeiro ou Admin com alvo selecionado)
                    */}
                    {editingSchedule && ((isStaff && !isAdmin) || (isAdmin && filterBarberId)) && (
                        
                        <form className={styles.scheduleContainer} onSubmit={handleSaveSchedule}>
                            
                            {/* Título Dinâmico: Muda o texto dependendo de quem está editando quem */}
                            <h3>
                                {isAdmin && filterBarberId
                                    ? `Editando horários de ${allBarbers.find(b => b.barberId == filterBarberId)?.fullName}`
                                    : "Meus Horários de Trabalho"
                                }
                            </h3>

                            {loadingSchedule ? <p>Carregando...</p> : (
                                
                                /* --- LOOP DE DIAS DA SEMANA --- */
                                /* Percorre o array ['Domingo', 'Segunda'...] e cria uma linha para cada um. */
                                daysOfWeek.map((dayName, index) => {
                                    // Pega os dados do dia atual (ou usa o padrão se estiver vazio)
                                    const dayData = schedule[index] || initialDayState; 
                                    const isActive = dayData.isActive;

                                    return (
                                        <div key={index} className={styles.dayRow}>
                                            
                                            {/* CHECKBOX: Define se trabalha neste dia */}
                                            <label className={styles.dayLabel}>
                                                <input type="checkbox" checked={isActive} onChange={() => handleDayToggle(index)} />
                                                {dayName}
                                            </label>
                                            
                                            {/* HORÁRIO DE TRABALHO (Início - Fim) */}
                                            <div className={styles.timeInputs}>
                                                {/* disabled={!isActive}: Impede digitar horário se o dia estiver desmarcado (UX) */}
                                                <input type="time" value={dayData.startTime} disabled={!isActive} onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)} />
                                                <span>-</span>
                                                <input type="time" value={dayData.endTime} disabled={!isActive} onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)} />
                                            </div>
                                             
                                             {/* HORÁRIO DE PAUSA (Almoço) */}
                                             {/* Usa style inline para alinhar à direita (marginLeft: auto) */}
                                            <div className={styles.timeInputs} style={{marginLeft: 'auto'}}> 
                                                 <span>Pausa:</span>
                                                 <input type="time" value={dayData.breakStartTime} disabled={!isActive} onChange={(e) => handleTimeChange(index, 'breakStartTime', e.target.value)} />
                                                 <span>-</span>
                                                 <input type="time" value={dayData.breakEndTime} disabled={!isActive} onChange={(e) => handleTimeChange(index, 'breakEndTime', e.target.value)} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            
                            {/* Botão de Submit do Formulário */}
                            <button type="submit" className={styles.saveScheduleButton} disabled={loadingSchedule}>Salvar Horários</button>
                        </form>
                    )}
                </section>
            </div>
            
        </div>
    );
}

export default ManagementDashboard;