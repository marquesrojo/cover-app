import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'
import { Badge, Spinner, Btn, Input, Select, TextArea, AlertBanner } from '@/components/ui'

const STATUS = {
  pendiente:  { color: C.blue,   label: 'PENDIENTE' },
  completado: { color: C.green,  label: 'COMPLETADO' },
  vencido:    { color: C.red,    label: 'VENCIDO' },
  cancelado:  { color: C.muted,  label: 'CANCELADO' },
}

const TIPOS = ['Inspección semestral', 'Inspección anual', 'Mantenimiento preventivo', 'Post-tormenta', 'Extraordinaria']

// ── NUEVO EVENTO ──────────────────────────────────────────────
function NuevoEventoForm({ onCreated, onCancel }) {
  const { user } = useAuth()
  const [plants, setPlants] = useState([])
  const [plantId, setPlantId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('plants').select('id,name').order('name').then(({ data }) => setPlants(data || []))
  }, [])

  const save = async () => {
    if (!plantId || !title || !scheduledDate) { setError('Planta, título y fecha son obligatorios'); return }
    setSaving(true); setError('')
    const { data, error: e } = await supabase.from('maintenance_schedules').insert({
      plant_id: plantId, title, type, scheduled_date: scheduledDate,
      notes, status: 'pendiente', created_by: user.id
    }).select('*, plants(name)').single()
    if (e) { setError(e.message); setSaving(false); return }
    setSaving(false); onCreated(data)
  }

  return (
    <div style={{ padding: '16px 16px 80px', animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C.amber, fontFamily: 'IBM Plex Mono', fontSize: 11, marginBottom: 16, padding: 0 }}>← VOLVER</button>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Nuevo Evento</div>
      {error && <AlertBanner color={C.red} icon="✗">{error}</AlertBanner>}
      <Select label="Planta" value={plantId} onChange={setPlantId} options={plants.map(p => ({ value: p.id, label: p.name }))} required />
      <Input label="Título" value={title} onChange={setTitle} placeholder="Ej: Inspección semestral otoño 2026" required />
      <Select label="Tipo" value={type} onChange={setType} options={TIPOS} />
      <Input label="Fecha programada" type="date" value={scheduledDate} onChange={setScheduledDate} required />
      <TextArea label="Notas" value={notes} onChange={setNotes} placeholder="Observaciones, preparación necesaria..." rows={3} />
      <Btn full onClick={save} disabled={saving}>{saving ? 'GUARDANDO...' : 'CREAR EVENTO →'}</Btn>
    </div>
  )
}

// ── PANTALLA PRINCIPAL ────────────────────────────────────────
export default function CalendarioScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNuevo, setShowNuevo] = useState(false)
  const [filter, setFilter] = useState('proximos')
  const [view, setView] = useState('lista') // 'lista' | 'mes'
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('maintenance_schedules')
      .select('*, plants(name)')
      .order('scheduled_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function markComplete(event) {
    await supabase.from('maintenance_schedules').update({
      status: 'completado',
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }).eq('id', event.id)
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'completado', completed_date: new Date().toISOString().split('T')[0] } : e))
  }

  async function cancelEvent(event) {
    await supabase.from('maintenance_schedules').update({ status: 'cancelado' }).eq('id', event.id)
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'cancelado' } : e))
  }

  if (showNuevo) return <NuevoEventoForm onCreated={(e) => { setEvents(prev => [e, ...prev]); setShowNuevo(false) }} onCancel={() => setShowNuevo(false)} />
  if (loading) return <Spinner />

  const today = new Date()
  const filtered =
    filter === 'proximos' ? events.filter(e => e.status === 'pendiente' && new Date(e.scheduled_date) >= today) :
    filter === 'vencidos' ? events.filter(e => e.status === 'vencido' || (e.status === 'pendiente' && new Date(e.scheduled_date) < today)) :
    filter === 'completados' ? events.filter(e => e.status === 'completado') :
    events

  // ── Vista mensual ────────────────────────────────────────────
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const monthEvents = events.filter(e => {
    const d = new Date(e.scheduled_date)
    return d >= monthStart && d <= monthEnd
  })

  const daysInMonth = monthEnd.getDate()
  const firstDayOfWeek = monthStart.getDay()
  const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const getEventsForDay = (day) => monthEvents.filter(e => new Date(e.scheduled_date).getDate() === day)

  // KPIs
  const proximos30 = events.filter(e => {
    const d = new Date(e.scheduled_date)
    const diff = (d - today) / (1000 * 60 * 60 * 24)
    return e.status === 'pendiente' && diff >= 0 && diff <= 30
  }).length
  const vencidos = events.filter(e => e.status === 'vencido' || (e.status === 'pendiente' && new Date(e.scheduled_date) < today)).length
  const completados = events.filter(e => e.status === 'completado').length

  return (
    <div style={{ padding: '0 0 80px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>PLANIFICACIÓN</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>Calendario</div>
          </div>
          <button onClick={() => setShowNuevo(true)} style={{ background: C.amber, color: C.bg, border: 'none', borderRadius: 8, padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, minHeight: 44 }}>+ EVENTO</button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[['Próx. 30d', proximos30, C.amber], ['Vencidos', vencidos, C.red], ['Completados', completados, C.green]].map(([l, v, c]) => (
            <div key={l} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
              <div className="mono" style={{ fontSize: 8, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Toggle vista */}
        <div style={{ display: 'flex', gap: 0, background: C.surface2, borderRadius: 8, padding: 4, marginBottom: 14 }}>
          {[['lista', 'Lista'], ['mes', 'Mes']].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} style={{ flex: 1, background: view === k ? C.amber : 'transparent', color: view === k ? C.bg : C.muted, border: 'none', borderRadius: 6, padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, transition: 'all 0.2s' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── VISTA LISTA ─────────────────────────────────────── */}
      {view === 'lista' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
            {[['proximos', 'PRÓXIMOS'], ['vencidos', 'VENCIDOS'], ['completados', 'COMPLETADOS'], ['todos', 'TODOS']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ background: filter === k ? C.amberDim : C.surface2, border: `1px solid ${filter === k ? C.amber : C.border}`, borderRadius: 6, padding: '7px 12px', fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700, color: filter === k ? C.amber : C.muted, letterSpacing: '0.08em', minHeight: 36, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{l}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>No hay eventos en este filtro</div>
              <button onClick={() => setShowNuevo(true)} style={{ background: C.amber, color: C.bg, border: 'none', borderRadius: 8, padding: '12px 20px', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700 }}>+ CREAR PRIMER EVENTO</button>
            </div>
          ) : (
            filtered.map((event, i) => {
              const stat = STATUS[event.status] || STATUS.pendiente
              const d = new Date(event.scheduled_date + 'T12:00:00')
              const daysUntil = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
              const isOverdue = event.status !== 'completado' && daysUntil < 0
              const isUrgent = event.status === 'pendiente' && daysUntil >= 0 && daysUntil <= 7

              return (
                <div key={event.id} style={{ background: C.surface2, border: `1px solid ${isOverdue ? C.red + '66' : isUrgent ? C.amber + '66' : C.border}`, borderRadius: 8, padding: 14, marginBottom: 8, animation: `fadeIn ${0.3 + i * 0.06}s ease` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{event.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{event.plants?.name}</div>
                    </div>
                    <Badge color={stat.color} small>{stat.label}</Badge>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: event.status === 'pendiente' ? 10 : 0 }}>
                    <span className="mono" style={{ fontSize: 10, color: C.amber }}>📅 {d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    {event.status === 'pendiente' && (
                      <span className="mono" style={{ fontSize: 10, color: isOverdue ? C.red : isUrgent ? C.amber : C.muted }}>
                        {isOverdue ? `Vencido hace ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'HOY' : `En ${daysUntil}d`}
                      </span>
                    )}
                    {event.type && <Badge color={C.blue} small>{event.type}</Badge>}
                  </div>

                  {event.notes && <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>{event.notes}</div>}

                  {event.status === 'pendiente' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => markComplete(event)} style={{ flex: 1, background: C.green + '22', color: C.green, border: `1px solid ${C.green}44`, borderRadius: 6, padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, minHeight: 36 }}>✓ COMPLETAR</button>
                      <button onClick={() => navigate(`/inspeccion/nueva?plantId=${event.plant_id}`)} style={{ flex: 1, background: C.amber + '22', color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 6, padding: '8px', fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, minHeight: 36 }}>+ INSPECCIÓN</button>
                      <button onClick={() => cancelEvent(event)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 12px', color: C.muted, fontFamily: 'IBM Plex Mono', fontSize: 10, minHeight: 36 }}>✕</button>
                    </div>
                  )}
                  {event.status === 'completado' && event.completed_date && (
                    <div className="mono" style={{ fontSize: 10, color: C.green }}>✓ Completado el {new Date(event.completed_date + 'T12:00:00').toLocaleDateString('es-AR')}</div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── VISTA MES ────────────────────────────────────────── */}
      {view === 'mes' && (
        <div style={{ padding: '0 16px' }}>
          {/* Navegación mes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', color: C.amber, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>‹</button>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', color: C.amber, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>›</button>
          </div>

          {/* Header días semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map((d, i) => (
              <div key={i} className="mono" style={{ textAlign: 'center', fontSize: 9, color: C.muted, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Grilla días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {/* Espacios vacíos antes del día 1 */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
            {/* Días del mes */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dayEvents = getEventsForDay(day)
              const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()
              return (
                <div key={day} style={{ background: isToday ? C.amber + '22' : C.surface2, border: `1px solid ${isToday ? C.amber : C.border}`, borderRadius: 4, padding: '4px', minHeight: 48, position: 'relative' }}>
                  <div className="mono" style={{ fontSize: 10, color: isToday ? C.amber : C.muted, fontWeight: isToday ? 700 : 400 }}>{day}</div>
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} style={{ background: (STATUS[e.status]?.color || C.blue) + '33', borderRadius: 2, padding: '1px 3px', marginTop: 2 }}>
                      <div style={{ fontSize: 8, color: STATUS[e.status]?.color || C.blue, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.plants?.name?.split('—')[0]}</div>
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div style={{ fontSize: 8, color: C.muted, marginTop: 1 }}>+{dayEvents.length - 2}</div>}
                </div>
              )
            })}
          </div>

          {/* Eventos del mes */}
          {monthEvents.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                {MONTHS[currentMonth.getMonth()]} — {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}
              </div>
              {monthEvents.map(e => {
                const stat = STATUS[e.status] || STATUS.pendiente
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div className="mono" style={{ fontSize: 11, color: C.amber, width: 28, flexShrink: 0 }}>{new Date(e.scheduled_date + 'T12:00:00').getDate()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{e.plants?.name}</div>
                    </div>
                    <Badge color={stat.color} small>{stat.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
