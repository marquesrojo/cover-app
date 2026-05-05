import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C, rciColor } from '@/styles/tokens'
import { Badge, Spinner, Btn, Input, TextArea, Select, PhotoUpload, AlertBanner } from '@/components/ui'

const STATUS={planificada:{color:C.blue,label:'PLANIFICADA'},en_curso:{color:C.amber,label:'EN CURSO'},pausada:{color:C.orange,label:'PAUSADA'},finalizada:{color:C.green,label:'FINALIZADA'}}
const WORK_TYPES=['Demolicion','Impermeabilizacion','Aplicacion membrana','Soldadura','Sellado','Inspeccion NDT','Limpieza','Otros']
const WEATHER=['Soleado','Nublado','Lluvia','Viento fuerte']
const WEATHER_ICON={'Soleado':'Sol','Nublado':'Nub','Lluvia':'Lluv','Viento fuerte':'Viento'}

function NuevaObraForm({onCreated,onCancel}){
  const {user}=useAuth()
  const [plants,setPlants]=useState([])
  const [tickets,setTickets]=useState([])
  const [plantId,setPlantId]=useState('')
  const [ticketId,setTicketId]=useState('')
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  const [type,setType]=useState('')
  const [contractor,setContractor]=useState('')
  const [plannedStart,setPlannedStart]=useState('')
  const [plannedEnd,setPlannedEnd]=useState('')
  const [hitos,setHitos]=useState([{title:'Inicio de obra',planned_date:''},{title:'Finalizacion',planned_date:''}])
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{supabase.from('plants').select('id,name').order('name').then(({data})=>setPlants(data||[]))},[])
  useEffect(()=>{if(plantId)supabase.from('tickets').select('id,title,severity').eq('plant_id',plantId).neq('status','resuelto').then(({data})=>setTickets(data||[]))},[plantId])

  const addHito=()=>setHitos(prev=>[...prev,{title:'',planned_date:''}])
  const updateHito=(i,field,val)=>setHitos(prev=>prev.map((h,idx)=>idx===i?{...h,[field]:val}:h))
  const removeHito=(i)=>setHitos(prev=>prev.filter((_,idx)=>idx!==i))

  const save=async()=>{
    if(!plantId||!title||!type){setError('Planta, titulo y tipo son obligatorios');return}
    setSaving(true);setError('')
    const {data:obra,error:e}=await supabase.from('obras').insert({plant_id:plantId,ticket_id:ticketId||null,title,description,type,contractor,planned_start:plannedStart||null,planned_end:plannedEnd||null,status:'planificada',created_by:user.id}).select().single()
    if(e){setError(e.message);setSaving(false);return}
    if(hitos.filter(h=>h.title).length>0){
      await supabase.from('obra_hitos').insert(hitos.filter(h=>h.title).map((h,i)=>({obra_id:obra.id,title:h.title,planned_date:h.planned_date||null,order_index:i})))
    }
    setSaving(false);onCreated(obra)
  }

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <button onClick={onCancel} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,marginBottom:16,padding:0}}>VOLVER</button>
      <div style={{fontSize:18,fontWeight:600,marginBottom:20}}>Nueva Obra</div>
      {error&&<AlertBanner color={C.red} icon="!">{error}</AlertBanner>}
      <Select label="Planta" value={plantId} onChange={setPlantId} options={plants.map(p=>({value:p.id,label:p.name}))} required/>
      {tickets.length>0&&<Select label="Ticket origen (opcional)" value={ticketId} onChange={setTicketId} options={tickets.map(t=>({value:t.id,label:t.title}))}/>}
      <Input label="Titulo de la obra" value={title} onChange={setTitle} placeholder="Ej: Restauracion sector Norte" required/>
      <Select label="Tipo de obra" value={type} onChange={setType} options={['Reparacion puntual','Restauracion parcial','Reemplazo total','Mantenimiento preventivo']} required/>
      <TextArea label="Descripcion" value={description} onChange={setDescription} placeholder="Alcance y detalles..." rows={3}/>
      <Input label="Contratista / Empresa ejecutora" value={contractor} onChange={setContractor} placeholder="Nombre del contratista"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <Input label="Inicio planificado" type="date" value={plannedStart} onChange={setPlannedStart}/>
        <Input label="Fin planificado" type="date" value={plannedEnd} onChange={setPlannedEnd}/>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>Hitos del cronograma</div>
          <button onClick={addHito} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 10px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:10}}>+ HITO</button>
        </div>
        {hitos.map((h,i)=>(
          <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
            <input value={h.title} onChange={e=>updateHito(i,'title',e.target.value)} placeholder={`Hito ${i+1}`} style={{flex:1,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:12,outline:'none'}}/>
            <input type="date" value={h.planned_date} onChange={e=>updateHito(i,'planned_date',e.target.value)} style={{width:130,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 8px',color:C.text,fontSize:11,outline:'none'}}/>
            {hitos.length>1&&<button onClick={()=>removeHito(i)} style={{background:'none',border:'none',color:C.red,fontSize:16,padding:'0 4px'}}>x</button>}
          </div>
        ))}
      </div>
      <Btn full onClick={save} disabled={saving}>{saving?'CREANDO...':'CREAR OBRA'}</Btn>
    </div>
  )
}

function NuevoParteForm({obraId,onCreated,onCancel}){
  const {user}=useAuth()
  const [date,setDate]=useState(new Date().toISOString().split('T')[0])
  const [workTypes,setWorkTypes]=useState([])
  const [workersCount,setWorkersCount]=useState('1')
  const [hoursWorked,setHoursWorked]=useState('8')
  const [progressPct,setProgressPct]=useState('0')
  const [notes,setNotes]=useState('')
  const [weather,setWeather]=useState('')
  const [photo,setPhoto]=useState(null)
  const [saving,setSaving]=useState(false)

  const toggleWorkType=(t)=>setWorkTypes(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])

  const save=async()=>{
    setSaving(true)
    const {data:parte,error}=await supabase.from('obra_partes').insert({obra_id:obraId,date,work_types:workTypes,workers_count:Number(workersCount),hours_worked:Number(hoursWorked),progress_pct:Number(progressPct),notes,weather:weather||null,created_by:user.id}).select().single()
    if(error){alert(error.message);setSaving(false);return}
    if(photo?.file){
      try{
        const path=`${obraId}/${parte.id}-${Date.now()}.jpg`
        const {error:upErr}=await supabase.storage.from('obra-fotos').upload(path,photo.file)
        if(!upErr){
          const {data:{publicUrl}}=supabase.storage.from('obra-fotos').getPublicUrl(path)
          await supabase.from('obra_fotos').insert({obra_id:obraId,parte_id:parte.id,storage_path:path,public_url:publicUrl,uploaded_by:user.id})
        }
      }catch(e){console.error(e)}
    }
    await supabase.from('obras').update({status:'en_curso',updated_at:new Date().toISOString()}).eq('id',obraId)
    setSaving(false);onCreated()
  }

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <button onClick={onCancel} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,marginBottom:16,padding:0}}>VOLVER</button>
      <div style={{fontSize:18,fontWeight:600,marginBottom:20}}>Nuevo Parte Diario</div>
      <Input label="Fecha" type="date" value={date} onChange={setDate}/>
      <div style={{marginBottom:14}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Tipos de trabajo</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {WORK_TYPES.map(t=>(
            <button key={t} onClick={()=>toggleWorkType(t)} style={{background:workTypes.includes(t)?C.amber+'33':C.surface2,border:`1.5px solid ${workTypes.includes(t)?C.amber:C.border}`,borderRadius:6,padding:'8px 12px',color:workTypes.includes(t)?C.amber:C.muted,fontSize:12,minHeight:44,transition:'all 0.15s'}}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        <Input label="Operarios" type="number" value={workersCount} onChange={setWorkersCount}/>
        <Input label="Horas trabajadas" type="number" value={hoursWorked} onChange={setHoursWorked}/>
      </div>
      <div style={{marginBottom:14}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Avance acumulado: <span style={{color:C.amber}}>{progressPct}%</span></div>
        <input type="range" min={0} max={100} value={progressPct} onChange={e=>setProgressPct(e.target.value)} style={{width:'100%',accentColor:C.amber}}/>
        <div style={{display:'flex',justifyContent:'space-between'}}><span className="mono" style={{fontSize:9,color:C.muted}}>0%</span><span className="mono" style={{fontSize:9,color:C.muted}}>100%</span></div>
      </div>
      <div style={{marginBottom:14}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Condicion climatica</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {WEATHER.map(w=>(
            <button key={w} onClick={()=>setWeather(weather===w?'':w)} style={{background:weather===w?C.blue+'33':C.surface2,border:`1.5px solid ${weather===w?C.blue:C.border}`,borderRadius:6,padding:'8px 12px',color:weather===w?C.blue:C.muted,fontSize:12,minHeight:44,transition:'all 0.15s'}}>{w}</button>
          ))}
        </div>
      </div>
      <TextArea label="Notas del dia" value={notes} onChange={setNotes} placeholder="Descripcion de trabajos realizados, inconvenientes, observaciones..." rows={4}/>
      <PhotoUpload label="Foto del avance" value={photo} onChange={setPhoto}/>
      <Btn full onClick={save} disabled={saving}>{saving?'GUARDANDO...':'GUARDAR PARTE DIARIO'}</Btn>
    </div>
  )
}

function ObraDetail({obraId,onBack}){
  const navigate=useNavigate()
  const {user}=useAuth()
  const [obra,setObra]=useState(null)
  const [partes,setPartes]=useState([])
  const [hitos,setHitos]=useState([])
  const [fotos,setFotos]=useState([])
  const [loading,setLoading]=useState(true)
  const [showNuevoParte,setShowNuevoParte]=useState(false)

  useEffect(()=>{loadData()},[obraId])

  async function loadData(){
    setLoading(true)
    const [o,p,h,f]=await Promise.all([
      supabase.from('obras').select('*, plants(name), tickets(title)').eq('id',obraId).single(),
      supabase.from('obra_partes').select('*').eq('obra_id',obraId).order('date',{ascending:false}),
      supabase.from('obra_hitos').select('*').eq('obra_id',obraId).order('order_index'),
      supabase.from('obra_fotos').select('*').eq('obra_id',obraId).order('uploaded_at',{ascending:false}),
    ])
    setObra(o.data);setPartes(p.data||[]);setHitos(h.data||[]);setFotos(f.data||[])
    setLoading(false)
  }

  const toggleHito=async(hito)=>{
    await supabase.from('obra_hitos').update({completed:!hito.completed,actual_date:!hito.completed?new Date().toISOString().split('T')[0]:null}).eq('id',hito.id)
    setHitos(prev=>prev.map(h=>h.id===hito.id?{...h,completed:!h.completed}:h))
  }

  const changeStatus=async(status)=>{
    await supabase.from('obras').update({status,updated_at:new Date().toISOString(),...(status==='finalizada'?{actual_end:new Date().toISOString().split('T')[0]}:{}),...(status==='en_curso'&&!obra.actual_start?{actual_start:new Date().toISOString().split('T')[0]}:{})}).eq('id',obraId)
    setObra(prev=>({...prev,status}))
  }

  if(loading)return<Spinner/>
  if(!obra)return<div style={{padding:24,color:C.muted}}>Obra no encontrada</div>
  if(showNuevoParte)return<NuevoParteForm obraId={obraId} onCreated={()=>{setShowNuevoParte(false);loadData()}} onCancel={()=>setShowNuevoParte(false)}/>

  const lastProgress=partes.length>0?partes[0].progress_pct:0
  const totalDays=partes.length
  const totalHours=partes.reduce((s,p)=>s+Number(p.hours_worked||0),0)
  const stat=STATUS[obra.status]||STATUS.planificada
  const hitosCompleted=hitos.filter(h=>h.completed).length

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <button onClick={onBack} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,marginBottom:16,padding:0}}>VOLVER</button>

      <div style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <div style={{fontSize:18,fontWeight:600,flex:1,paddingRight:10}}>{obra.title}</div>
          <Badge color={stat.color}>{stat.label}</Badge>
        </div>
        <div className="mono" style={{fontSize:10,color:C.muted}}>{obra.plants?.name}</div>
        {obra.contractor&&<div style={{fontSize:12,color:C.mutedLight,marginTop:2}}>{obra.contractor}</div>}
        {obra.tickets&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>Ticket: {obra.tickets.title}</div>}
      </div>

      <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>Avance</span>
          <span className="mono" style={{fontSize:14,fontWeight:700,color:C.amber}}>{lastProgress}%</span>
        </div>
        <div style={{height:8,background:C.border,borderRadius:4}}>
          <div style={{height:'100%',width:`${lastProgress}%`,background:`linear-gradient(90deg,${C.amber},${C.green})`,borderRadius:4,transition:'width 0.8s ease'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:12}}>
          {[['Dias trabajados',totalDays],['Horas totales',totalHours],['Hitos',`${hitosCompleted}/${hitos.length}`]].map(([l,v])=>(
            <div key={l} style={{textAlign:'center'}}>
              <div className="mono" style={{fontSize:16,fontWeight:700,color:C.text}}>{v}</div>
              <div className="mono" style={{fontSize:8,color:C.muted,textTransform:'uppercase'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {(obra.planned_start||obra.planned_end)&&(
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>Cronograma</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['Inicio plan.',obra.planned_start],['Fin plan.',obra.planned_end],['Inicio real',obra.actual_start||'—'],['Fin real',obra.actual_end||'—']].map(([l,v])=>(
              <div key={l}>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>{l}</div>
                <div style={{fontSize:13,color:C.text,marginTop:2}}>{v||'—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hitos.length>0&&(
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>Hitos</div>
          {hitos.map(h=>(
            <div key={h.id} onClick={()=>toggleHito(h)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.border}`,cursor:'pointer',minHeight:44}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:h.completed?C.green+'33':C.border,border:`2px solid ${h.completed?C.green:C.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {h.completed&&<span style={{color:C.green,fontSize:11}}>v</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:h.completed?C.muted:C.text,textDecoration:h.completed?'line-through':'none'}}>{h.title}</div>
                {h.planned_date&&<div className="mono" style={{fontSize:9,color:C.muted}}>Plan: {h.planned_date}{h.actual_date?` - Real: ${h.actual_date}`:''}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>Estado de la obra</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {Object.entries(STATUS).map(([k,v])=>(
            <button key={k} onClick={()=>changeStatus(k)} style={{background:obra.status===k?v.color+'33':C.surface,border:`1.5px solid ${obra.status===k?v.color:C.border}`,borderRadius:6,padding:'8px 12px',color:obra.status===k?v.color:C.muted,fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,minHeight:44,transition:'all 0.15s'}}>{v.label}</button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>Legajo de obra</div>
          <button onClick={()=>navigate(`/obras/legajo/${obraId}`)} style={{background:C.blue,color:'#fff',border:'none',borderRadius:6,padding:'8px 12px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700}}>VER LEGAJO</button>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>Partes diarios ({partes.length})</div>
        <button onClick={()=>setShowNuevoParte(true)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:6,padding:'8px 12px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700}}>+ PARTE</button>
      </div>

      {partes.length===0?(
        <div style={{textAlign:'center',padding:'24px 0',color:C.muted,fontSize:13}}>Sin partes diarios. Carga el primer avance.</div>
      ):(
        partes.map((p,i)=>(
          <div key={p.id} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:8,animation:`fadeIn ${0.3+i*0.05}s ease`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span className="mono" style={{fontSize:11,fontWeight:700,color:C.amber}}>{p.date}</span>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                {p.weather&&<span className="mono" style={{fontSize:10,color:C.muted}}>{WEATHER_ICON[p.weather]||p.weather}</span>}
                <Badge color={C.green} small>{p.progress_pct}%</Badge>
              </div>
            </div>
            {p.work_types?.length>0&&(
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                {p.work_types.map(t=><span key={t} style={{background:C.amber+'22',color:C.amber,border:`1px solid ${C.amber}44`,borderRadius:3,padding:'2px 6px',fontSize:9,fontFamily:'IBM Plex Mono'}}>{t}</span>)}
              </div>
            )}
            <div style={{display:'flex',gap:12,marginBottom:p.notes?8:0}}>
              <span className="mono" style={{fontSize:10,color:C.muted}}>{p.workers_count} operarios</span>
              <span className="mono" style={{fontSize:10,color:C.muted}}>{p.hours_worked}hs</span>
            </div>
            {p.notes&&<div style={{fontSize:12,color:C.mutedLight,lineHeight:1.5}}>{p.notes}</div>}
          </div>
        ))
      )}

      {fotos.length>0&&(
        <div style={{marginTop:16}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>Fotos ({fotos.length})</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {fotos.map(f=>(
              <div key={f.id}>
                <img src={f.public_url} alt="" style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:8,border:`1px solid ${C.border}`}}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ObrasScreen(){
  const navigate=useNavigate()
  const [obras,setObras]=useState([])
  const [loading,setLoading]=useState(true)
  const [showNueva,setShowNueva]=useState(false)
  const [selectedObraId,setSelectedObraId]=useState(null)
  const [filter,setFilter]=useState('activas')

  useEffect(()=>{fetchObras()},[])

  async function fetchObras(){
    setLoading(true)
    const {data}=await supabase.from('obras').select('*, plants(name)').order('created_at',{ascending:false})
    setObras(data||[])
    setLoading(false)
  }

  if(showNueva)return<NuevaObraForm onCreated={(o)=>{setShowNueva(false);setSelectedObraId(o.id);fetchObras()}} onCancel={()=>setShowNueva(false)}/>
  if(selectedObraId)return<ObraDetail obraId={selectedObraId} onBack={()=>{setSelectedObraId(null);fetchObras()}}/>

  const filtered=filter==='activas'?obras.filter(o=>o.status!=='finalizada'):filter==='finalizadas'?obras.filter(o=>o.status==='finalizada'):obras

  if(loading)return<Spinner/>

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>REPARACIONES</div>
          <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Obras</div>
        </div>
        <button onClick={()=>setShowNueva(true)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:8,padding:'10px 14px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,minHeight:44}}>+ NUEVA</button>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['activas','ACTIVAS'],['finalizadas','FINALIZADAS'],['todas','TODAS']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{background:filter===k?C.amberDim:C.surface2,border:`1px solid ${filter===k?C.amber:C.border}`,borderRadius:6,padding:'7px 12px',fontFamily:'IBM Plex Mono',fontSize:9,fontWeight:700,color:filter===k?C.amber:C.muted,letterSpacing:'0.08em',minHeight:36,transition:'all 0.15s'}}>{l}</button>
        ))}
      </div>

      {filtered.length===0?(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:14,color:C.muted,marginBottom:16}}>{filter==='activas'?'No hay obras activas':'No hay obras en este filtro'}</div>
          <button onClick={()=>setShowNueva(true)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:8,padding:'12px 20px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700}}>+ CREAR PRIMERA OBRA</button>
        </div>
      ):(
        filtered.map((o,i)=>{
          const stat=STATUS[o.status]||STATUS.planificada
          const diasRestantes=o.planned_end?Math.ceil((new Date(o.planned_end)-new Date())/(1000*60*60*24)):null
          return(
            <div key={o.id} onClick={()=>setSelectedObraId(o.id)} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:8,cursor:'pointer',animation:`fadeIn ${0.3+i*0.07}s ease`,transition:'border-color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.amber+'55'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:600,flex:1,paddingRight:8}}>{o.title}</div>
                <Badge color={stat.color} small>{stat.label}</Badge>
              </div>
              <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{o.plants?.name}</div>
              {o.contractor&&<div style={{fontSize:11,color:C.mutedLight,marginBottom:8}}>{o.contractor}</div>}
              <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                {o.planned_start&&<span className="mono" style={{fontSize:9,color:C.muted}}>Inicio: {o.planned_start}</span>}
                {o.planned_end&&<span className="mono" style={{fontSize:9,color:o.status!=='finalizada'&&diasRestantes<0?C.red:C.muted}}>Fin: {o.planned_end}{o.status!=='finalizada'&&diasRestantes!==null?` (${diasRestantes>0?`${diasRestantes}d restantes`:'vencida'})`:''}</span>}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
