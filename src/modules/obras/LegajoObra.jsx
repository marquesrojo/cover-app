import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { C } from '@/styles/tokens'
import { Spinner } from '@/components/ui'

const STATUS_LABEL={planificada:'Planificada',en_curso:'En curso',pausada:'Pausada',finalizada:'Finalizada'}

function rciColorPdf(rci){
  if(rci>=70) return {bg:'#dcfce7',border:'#22c55e',text:'#166534'}
  if(rci>=50) return {bg:'#fef9c3',border:'#eab308',text:'#854d0e'}
  if(rci>=30) return {bg:'#ffedd5',border:'#f97316',text:'#9a3412'}
  return {bg:'#fee2e2',border:'#ef4444',text:'#991b1b'}
}

function MapaSectores({ plant, sectors }){
  const rows = plant.grid_rows || 0
  const cols = plant.grid_cols || 0
  if(!rows || !cols) return null
  const [bgImage, setBgImage] = useState(null)
  useEffect(()=>{
    supabase.storage.from('plant-backgrounds').list(plant.id)
      .then(({data})=>{
        if(data?.length>0){
          const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(`${plant.id}/${data[0].name}`)
          setBgImage(publicUrl)
        }
      })
  },[plant.id])
  const getSector = (r,c) => sectors.find(s => s.row_index===r && s.col_index===c)
  const cellSize = Math.min(32, Math.floor(520 / (cols + 1)))
  const rciValues = sectors.map(s => s.rci ?? 100)
  const rciPromedio = rciValues.length > 0 ? Math.round(rciValues.reduce((a,b)=>a+b,0)/rciValues.length) : 100
  const promedioColor = rciColorPdf(rciPromedio)
  return(
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div style={{ background: promedioColor.bg, border: `1px solid ${promedioColor.border}`, borderRadius: 8, padding: '10px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, fontWeight: 700, color: promedioColor.text }}>{rciPromedio}</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>RCI Promedio</div>
        </div>
        <div style={{ fontSize: 12, color: '#555' }}>
          <div><strong>{rows} × {cols}</strong> sectores · {plant.cell_size_m || '—'}m por celda</div>
          <div style={{ marginTop: 4, color: '#888' }}>{plant.area_m2?.toLocaleString()} m² totales</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-block', minWidth: (cols+1)*cellSize+8, position:'relative' }}>
          {bgImage&&(
            <img src={bgImage} alt="" style={{
              position:'absolute', top:20, left:cellSize+2, right:0, bottom:2,
              width:`calc(100% - ${cellSize+2}px)`, height:`calc(100% - 22px)`,
              objectFit:'cover', opacity:0.5, pointerEvents:'none', borderRadius:2
            }}/>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `${cellSize}px repeat(${cols}, ${cellSize}px)`, gap: 2, marginBottom: 2 }}>
            <div/>
            {Array.from({length:cols},(_,i)=>(
              <div key={i} style={{ textAlign:'center', fontFamily:'IBM Plex Mono', fontSize: 8, color:'#aaa' }}>{i+1}</div>
            ))}
          </div>
          {Array.from({length:rows},(_,ri)=>(
            <div key={ri} style={{ display:'grid', gridTemplateColumns:`${cellSize}px repeat(${cols}, ${cellSize}px)`, gap:2, marginBottom:2 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'IBM Plex Mono', fontSize:8, color:'#aaa' }}>
                {String.fromCharCode(65+ri)}
              </div>
              {Array.from({length:cols},(_,ci)=>{
                const s = getSector(ri,ci)
                const rci = s?.rci ?? 100
                const {bg, border, text} = rciColorPdf(rci)
                return(
                  <div key={ci} style={{ width:cellSize, height:cellSize, background:bg, border:`1px solid ${border}`, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:'IBM Plex Mono', fontSize:cellSize>24?8:7, fontWeight:700, color:text }}>{rci}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:14, marginTop:10, flexWrap:'wrap' }}>
        {[['EXCELENTE (70-100)','#dcfce7','#22c55e','#166534'],['REGULAR (50-69)','#fef9c3','#eab308','#854d0e'],['POBRE (30-49)','#ffedd5','#f97316','#9a3412'],['CRÍTICO (0-29)','#fee2e2','#ef4444','#991b1b']].map(([l,bg,border])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:12, height:12, background:bg, border:`1.5px solid ${border}`, borderRadius:2 }}/>
            <span style={{ fontFamily:'IBM Plex Mono', fontSize:9, color:'#666' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PrintStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Sora:wght@400;600&display=swap');
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; color: black !important; margin: 0 !important; }
      .legajo { background: white !important; color: #111 !important; max-width: 100% !important; padding: 20px !important; }
      nav, header { display: none !important; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .parte-card { page-break-inside: avoid !important; break-inside: avoid !important; }
      .kpi-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .hito-row { page-break-inside: avoid; break-inside: avoid; }
      .firma-grid { page-break-inside: avoid; break-inside: avoid; }
    }
    .legajo { font-family: 'Sora', sans-serif; max-width: 800px; margin: 0 auto; background: white; color: #111; padding: 40px; line-height: 1.5; }
    .legajo h1 { font-family: 'IBM Plex Mono', monospace; font-size: 22px; margin-bottom: 4px; }
    .legajo h2 { font-family: 'IBM Plex Mono', monospace; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; color: #555; border-bottom: 2px solid #f5a623; padding-bottom: 6px; margin: 28px 0 14px; }
    .legajo table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    .legajo th { background: #f5a623; color: white; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 10px; text-align: left; }
    .legajo td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    .legajo tr:nth-child(even) td { background: #fafafa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-box { border: 1px solid #eee; border-radius: 6px; padding: 12px; text-align: center; }
    .kpi-value { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; }
    .kpi-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
    .progress-bar-outer { height: 10px; background: #eee; border-radius: 5px; margin: 6px 0; }
    .progress-bar-inner { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #f5a623, #22c55e); }
    .hito-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .hito-check { width: 18px; height: 18px; border-radius: 50%; border: 2px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; }
    .header-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f5a623; }
    .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .firma-line { border-bottom: 1px solid #aaa; height: 50px; margin-bottom: 6px; }
    .firma-label { font-size: 11px; color: #666; font-family: 'IBM Plex Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; }
    .parte-card { border: 1px solid #eee; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
    .parte-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
    .parte-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 16px; margin-bottom: 8px; }
    .parte-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 2px; }
    .parte-footer { margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
    .foto-grid-parte { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
    .foto-grid-parte img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
  `}</style>
)

export default function LegajoObra() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [obra, setObra] = useState(null)
  const [partes, setPartes] = useState([])
  const [hitos, setHitos] = useState([])
  const [fotos, setFotos] = useState([])
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [o, p, h, f] = await Promise.all([
        supabase.from('obras').select('*, plants(name, address, membrane, area_m2, grid_rows, grid_cols, cell_size_m), tickets(title), profiles!obras_created_by_fkey(full_name)').eq('id', id).single(),
        supabase.from('obra_partes').select('*').eq('obra_id', id).order('date', { ascending: true }),
        supabase.from('obra_hitos').select('*').eq('obra_id', id).order('order_index'),
        supabase.from('obra_fotos').select('*').eq('obra_id', id).order('uploaded_at', { ascending: true }),
      ])
      setObra(o.data)
      setPartes(p.data || [])
      setHitos(h.data || [])
      setFotos(f.data || [])
      if(o.data?.plant_id){
        const {data:sec} = await supabase.from('sectors').select('row_index,col_index,rci').eq('plant_id', o.data.plant_id)
        setSectors(sec || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <Spinner />
  if (!obra) return <div style={{ padding: 24, color: C.muted }}>Obra no encontrada</div>

  const totalDays = partes.length
  const totalHours = partes.reduce((s, p) => s + Number(p.hours_worked || 0), 0)
  const totalWorkers = partes.reduce((s, p) => s + Number(p.workers_count || 0), 0)
  const lastProgress = partes.length > 0 ? partes[partes.length - 1].progress_pct : 0
  const hitosCompleted = hitos.filter(h => h.completed).length
  const emitDate = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const allWorkTypes = partes.flatMap(p => p.work_types || [])
  const workTypeSummary = allWorkTypes.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc }, {})

  return (
    <div style={{ background: 'white', minHeight: '100vh' }}>
      <PrintStyles />

      <div className="no-print" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: C.amber, fontFamily: 'IBM Plex Mono', fontSize: 11, cursor: 'pointer' }}>← VOLVER</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.print()} style={{ background: C.amber, color: C.bg, border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          🖨 IMPRIMIR / GUARDAR PDF
        </button>
      </div>

      <div className="legajo">

        <div className="header-bar">
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>GRUPO AISLAR · LEGAJO DE OBRA</div>
            <h1>{obra.title}</h1>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{obra.plants?.name}</div>
            {obra.plants?.address && <div style={{ fontSize: 12, color: '#888' }}>{obra.plants.address}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#888' }}>Emitido: {emitDate}</div>
            <div style={{ marginTop: 8 }}>
              <span className="badge" style={{ background: obra.status === 'finalizada' ? '#22c55e22' : '#f5a62322', color: obra.status === 'finalizada' ? '#22c55e' : '#f5a623', border: `1px solid ${obra.status === 'finalizada' ? '#22c55e44' : '#f5a62344'}` }}>
                {STATUS_LABEL[obra.status] || obra.status}
              </span>
            </div>
            {obra.contractor && <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>🏗 {obra.contractor}</div>}
          </div>
        </div>

        <h2>Datos Generales</h2>
        <table>
          <tbody>
            {[
              ['Instalación', obra.plants?.name],
              ['Membrana', obra.plants?.membrane || '—'],
              ['Superficie', obra.plants?.area_m2 ? `${obra.plants.area_m2.toLocaleString()} m²` : '—'],
              ['Tipo de obra', obra.type || '—'],
              ['Contratista', obra.contractor || '—'],
              ['Responsable', obra.profiles?.full_name || '—'],
              ['Inicio planificado', obra.planned_start || '—'],
              ['Fin planificado', obra.planned_end || '—'],
              ['Inicio real', obra.actual_start || '—'],
              ['Fin real', obra.actual_end || '—'],
            ].map(([k, v]) => (
              <tr key={k}><td style={{ fontWeight: 600, width: '35%', color: '#555' }}>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        {obra.description && (
          <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 6, padding: 14, marginBottom: 20, fontSize: 13 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Descripción</div>
            {obra.description}
          </div>
        )}

        {obra.plants?.grid_rows > 0 && (
          <>
            <h2>Estado de la Cubierta — Mapa RCI</h2>
            <MapaSectores plant={obra.plants} sectors={sectors} />
          </>
        )}

        <h2>Resumen Ejecutivo</h2>
        <div className="kpi-grid">
          {[
            [lastProgress + '%', 'Avance total', '#f5a623'],
            [totalDays, 'Días trabajados', '#3b82f6'],
            [totalHours + 'hs', 'Horas totales', '#8b5cf6'],
            [`${hitosCompleted}/${hitos.length}`, 'Hitos completados', '#22c55e'],
          ].map(([v, l, c]) => (
            <div key={l} className="kpi-box">
              <div className="kpi-value" style={{ color: c }}>{v}</div>
              <div className="kpi-label">{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>Avance de obra</span><span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>{lastProgress}%</span>
          </div>
          <div className="progress-bar-outer">
            <div className="progress-bar-inner" style={{ width: `${lastProgress}%` }} />
          </div>
        </div>
        {Object.keys(workTypeSummary).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Tipos de trabajo realizados</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(workTypeSummary).map(([t, count]) => (
                <span key={t} className="badge" style={{ background: '#f5a62311', color: '#c87a00', border: '1px solid #f5a62333' }}>{t} ({count})</span>
              ))}
            </div>
          </div>
        )}

        {hitos.length > 0 && (
          <>
            <h2>Cronograma e Hitos</h2>
            {hitos.map(h => (
              <div key={h.id} className="hito-row">
                <div className="hito-check" style={{ borderColor: h.completed ? '#22c55e' : '#ddd', background: h.completed ? '#22c55e22' : 'white', color: '#22c55e' }}>
                  {h.completed && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: '#888', fontFamily: 'IBM Plex Mono' }}>
                    Plan: {h.planned_date || '—'}{h.actual_date && ` · Real: ${h.actual_date}`}
                  </div>
                </div>
                <span className="badge" style={{ background: h.completed ? '#22c55e22' : '#eee', color: h.completed ? '#22c55e' : '#888', border: `1px solid ${h.completed ? '#22c55e44' : '#ddd'}` }}>
                  {h.completed ? 'COMPLETADO' : 'PENDIENTE'}
                </span>
              </div>
            ))}
          </>
        )}

        {partes.length > 0 && (
          <>
            <h2>Partes Diarios de Avance</h2>
            {partes.map((p, i) => (
              <div key={p.id} className="parte-card">
                <div className="parte-header">
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 700, color: '#111' }}>Parte #{i + 1} — {p.date}</div>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 700, color: '#f5a623' }}>{p.progress_pct}%</span>
                </div>
                <div className="parte-grid">
                  <div><div className="parte-label">Operarios</div><div style={{ fontSize: 12, fontWeight: 600 }}>{p.workers_count}</div></div>
                  <div><div className="parte-label">Horas</div><div style={{ fontSize: 12, fontWeight: 600 }}>{p.hours_worked}hs</div></div>
                  <div><div className="parte-label">Clima</div><div style={{ fontSize: 12 }}>{p.weather || '—'}</div></div>
                </div>
                {(p.work_types || []).length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div className="parte-label">Trabajos realizados</div>
                    <div style={{ fontSize: 12 }}>{(p.work_types || []).join(' · ')}</div>
                  </div>
                )}
                {p.notes && (
                  <div style={{ marginBottom: 6 }}>
                    <div className="parte-label">Notas</div>
                    <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>{p.notes}</div>
                  </div>
                )}
                <div className="parte-footer">
                  <span className="parte-label">Responsable: </span>
                  <span style={{ fontSize: 12 }}>{p.responsable || '—'}</span>
                </div>
                {fotos.filter(f => f.parte_id === p.id).length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div className="parte-label" style={{ marginBottom: 6 }}>Fotos ({fotos.filter(f => f.parte_id === p.id).length})</div>
                    <div className="foto-grid-parte">
                      {fotos.filter(f => f.parte_id === p.id).map(f => (
                        <img key={f.id} src={f.public_url} alt="" onError={e => e.target.style.display = 'none'} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{ background: '#fff8ee', border: '1px solid #f5a62333', borderRadius: 6, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Total operarios-día: </span><strong>{totalWorkers}</strong></div>
              <div><span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Total horas: </span><strong>{totalHours}hs</strong></div>
              <div><span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Avance final: </span><strong style={{ color: '#f5a623' }}>{lastProgress}%</strong></div>
            </div>
          </>
        )}

        <h2>Conformidad y Cierre</h2>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
          El presente legajo certifica la ejecución de los trabajos descritos en la obra <strong>{obra.title}</strong>, correspondiente a la instalación <strong>{obra.plants?.name}</strong>.
          Avance registrado al {emitDate}: <strong>{lastProgress}%</strong>.
          {obra.actual_start && <span> Inicio real de obra: <strong>{obra.actual_start}</strong>.</span>}
        </div>
        <div className="firma-grid">
          <div>
            <div className="firma-line" />
            <div className="firma-label">Responsable de obra</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{obra.profiles?.full_name || '—'}</div>
          </div>
          <div>
            <div className="firma-line" />
            <div className="firma-label">Conformidad del cliente</div>
          </div>
        </div>
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', fontFamily: 'IBM Plex Mono' }}>
          <span>COVER · GRUPO AISLAR · Gestión de Cubiertas Industriales</span>
          <span>Legajo generado el {emitDate}</span>
        </div>
      </div>
    </div>
  )
}
