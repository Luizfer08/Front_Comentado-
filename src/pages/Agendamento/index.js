import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styles from './Agendamento.module.css';
import { FaArrowLeft } from 'react-icons/fa'; 

// Configuração do Calendário para Português-BR
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR); 

function Agendamento() {
    
    // --- ESTADOS DE SELEÇÃO (O que o usuário escolheu) ---
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]); // Array, pois pode escolher vários
    const [selectedDate, setSelectedDate] = useState(null); 
    
    // --- ESTADOS DE DADOS (O que a API retornou) ---
    const [availableSlots, setAvailableSlots] = useState([]); // Horários livres (ex: ["09:00", "09:30"])
    const [barberSchedule, setBarberSchedule] = useState([]); // Dias que o barbeiro trabalha
    
    // --- CONTROLE DE UI ---
    const [loading, setLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(false); 
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 1. CARGA INICIAL (Paralela)
    // Busca Barbeiros E Serviços ao mesmo tempo para montar a tela rápido.
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Promise.all: Só termina quando as duas requisições finalizarem.
                const [barbersResponse, servicesResponse] = await Promise.all([
                    api.get('/api/barber'),
                    api.get('/api/services')
                ]);
                setBarbers(barbersResponse.data);
                setServices(servicesResponse.data);
            } catch (err) {
                setError('Erro ao carregar dados. Tente novamente.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // 2. BUSCA A ESCALA DE TRABALHO (Quando seleciona Barbeiro)
    // Necessário para saber quais dias bloquear no calendário (ex: Barbeiro não trabalha segunda).
    useEffect(() => {
        const fetchBarberSchedule = async () => {
            if (!selectedBarber) {
                setBarberSchedule([]);
                setSelectedDate(null); // Reseta a data se trocar de barbeiro
                return;
            }
            
            setScheduleLoading(true);
            try {
                const response = await api.get(`/api/work-schedule/${selectedBarber}`);
                setBarberSchedule(response.data);
            } catch (err) {
                setError('Erro ao carregar os horários do barbeiro.');
            } finally {
                setScheduleLoading(false);
            }
        };
        fetchBarberSchedule();
    }, [selectedBarber]);

    // 3. BUSCA HORÁRIOS DISPONÍVEIS (O passo final)
    // Só roda se tiver: Barbeiro + Serviços + Data selecionados.
    useEffect(() => {
        const fetchAvailability = async () => {
            if (selectedBarber && selectedServices.length > 0 && selectedDate) {
                setSlotsLoading(true);
                setAvailableSlots([]);
                try {
                    // Monta a Query String para enviar múltiplos IDs de serviço (ex: serviceIds=1&serviceIds=2)
                    const serviceIdsQuery = selectedServices.map(id => `serviceIds=${id}`).join('&');
                    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    
                    // Chama a API que calcula a disponibilidade matemática (duração total vs buracos na agenda)
                    const response = await api.get(`/api/availability?barberId=${selectedBarber}&${serviceIdsQuery}&date=${formattedDate}`);
                    setAvailableSlots(response.data);
                } catch (err) {
                    setError('Erro ao buscar horários disponíveis.');
                } finally {
                    setSlotsLoading(false);
                }
            }
        };
        fetchAvailability();
    }, [selectedBarber, selectedServices, selectedDate]);

    
    // Lógica de Multi-Seleção de serviços (Adiciona ou Remove do array)
    const handleServiceToggle = (serviceId) => {
        setSelectedServices(prev => 
            prev.includes(serviceId) 
            ? prev.filter(id => id !== serviceId) // Remove se já existe
            : [...prev, serviceId] // Adiciona se não existe
        );
    };

    // 4. FINALIZAR AGENDAMENTO
    const handleBookAppointment = async (slot) => {
        // 'slot' vem como string "09:30:00"
        const [hour, minute] = slot.split(':');
        
        // Constrói o objeto Date final combinando o Dia Selecionado + Horário do Slot
        const startDateTime = new Date(selectedDate);
        startDateTime.setUTCHours(hour, minute, 0, 0); 

        try {
            await api.post('/api/appointments', {
                barberId: selectedBarber,
                startDateTime: startDateTime.toISOString(),
                serviceIds: selectedServices
            });
            alert('Agendamento realizado com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            setError('Falha ao criar agendamento. O horário pode ter sido ocupado.');
            console.error(err);
        }
    };

    // Filtro do Calendário: Retorna TRUE se o dia deve estar habilitado
    const isWeekdayAvailable = (date) => {
        if (!barberSchedule || barberSchedule.length === 0) {
            return false;
        }
        const day = date.getDay(); // 0 = Domingo, 1 = Segunda...
        // Verifica se o barbeiro trabalha nesse dia da semana
        return barberSchedule.some(scheduleDay => scheduleDay.dayOfWeek === day);
    };

    if (loading) return <div className={styles.page}><p className={styles.loadingText}>Carregando...</p></div>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
                    <FaArrowLeft /> Voltar
                </button>
                <h1>Faça seu Agendamento</h1>
                <div style={{width: '100px'}}></div> 
            </header>
            
            <div className={styles.selectionContainer}>
                
                {/* COLUNA 1: Barbeiros */}
                <div className={styles.column}>
                    <h2>1. Escolha o Barbeiro</h2>
                    {barbers.map(barber => (
                        <div 
                            key={barber.barberId} 
                            // Classe condicional: Muda cor se estiver selecionado
                            className={`${styles.item} ${selectedBarber === barber.barberId ? styles.selected : ''}`}
                            onClick={() => setSelectedBarber(barber.barberId)}
                        >
                            {barber.fullName}
                        </div>
                    ))}
                </div>
                
                {/* COLUNA 2: Serviços */}
                <div className={styles.column}>
                    <h2>2. Escolha o(s) Serviço(s)</h2>
                    {services.map(service => (
                        <div 
                            key={service.id} 
                            className={`${styles.item} ${selectedServices.includes(service.id) ? styles.selected : ''}`}
                            onClick={() => handleServiceToggle(service.id)}
                        >
                            {service.name} - R$ {service.price} ({service.durationInMinutes} min)
                        </div>
                    ))}
                </div>
            </div>

            {/* Renderização Condicional: Calendário só aparece depois de escolher Barbeiro e Serviço */}
            {selectedBarber && selectedServices.length > 0 && (
                <div className={styles.datePicker}>
                    <h2>3. Escolha a Data</h2>
                    {scheduleLoading ? <p>Carregando horários...</p> : (
                        <DatePicker
                            locale="pt-BR"
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            filterDate={isWeekdayAvailable} // Aplica o filtro de dias úteis do barbeiro
                            minDate={new Date()} // Não permite agendar no passado
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Clique para selecionar uma data"
                            className={styles.datePickerInput}
                            inline // Mostra o calendário aberto direto na tela
                        />
                    )}
                </div>
            )}

            {slotsLoading && <p className={styles.loadingText}>Buscando horários...</p>}

            {/* Renderização Condicional: Slots só aparecem se a API retornou horários livres */}
            {availableSlots.length > 0 && (
                <div className={styles.slotsContainer}>
                    <h2>4. Horários Disponíveis</h2>
                    <div className={styles.slotsGrid}>
                        {availableSlots.map(slot => (
                            <button key={slot} className={styles.slotButton} onClick={() => handleBookAppointment(slot)}>
                                {/* Mostra apenas HH:MM (corta os segundos) */}
                                {slot.substring(0, 5)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Agendamento;