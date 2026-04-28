import { useState, useEffect } from 'react'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'
import { Badge, Spinner, Btn, Input, TextArea, Select, AlertBanner, PhotoUpload } from '@/components/ui'

const SEV={critico:{color:C.red,label:'CRÍTICO'},moderado:{color:C.orange,label:'MODERADO'},leve:{color:C.yellow,label:'LEVE'}}
const STAT={abierto:{color:C.red,label:'ABIERTO'},en_proceso:{color:C.blue,label:'EN PROCESO'},resuelto:{color:C.green,label:'RESUELTO'}}

// ── Modal editar ticket ──────────────────────────────────────
function EditModal({ticket,onClose,onSaved}){
  const [status,setStatus]=useState(ticket.status)
  const [severity,setSeverity]=useState(ticket.severity)
  const [title,setTitle]=useState(ticket.title)
  const [desc,setDesc]=useState(ticket.description||'')
  const [resolution,setResolution]=useState(ticket.resolution_notes||'')
  const [saving,setSaving]=useState(false)

  const save=async()=>{
    setSaving(true)
    const updates={status,severity,title,description:desc,resolution_notes:resolution,updated_at:new Date().toISOString()}
    if(status==='resuelto'&&ticket.status!=='resuelto')updates.resolved_at=new Date().toISOString()
    const {data,error}=await supabase.from('tickets').update(updates).eq('id',ticket.id).select().single()
    setSaving(false)
    if(!error){onSaved(data);onClose()}
  }

  return(
    <div style={{position:'fixed',inset:0,background:'#000b',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.surface,border:`1px solid ${C.border}`,borderRadius:'12px 12px 0 0',padding:20,maxHeight:'90vh',overflowY:'auto',animation:'slideUp 0.25s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span className="mono" style={{fontSize:12,fontWeight:700,color:C.amber}}>EDITAR {ticket.id?.slice(0,8).toUpperCase()}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:18}}>✕</button>
        </div>

        <Input label="Título" value={title} onChange={setTitle}/>
        <TextArea label="Descripción" value={desc} onChange={setDesc}/>

        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Severidad</div>
          <div style={{display:'flex',gap:6}}>
            {Object.entries(SEV).map(([k,v])=>(
              <button key={k} onClick={()=>setSeverity(k)} style={{flex:1,background:severity===k?v.color+'33':C.surface2,border:`1.5px solid ${severity===k?v.color:C.border}`,borderRadius:6,padding:'10px 6px',color:severity===k?v.color:C.muted,fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,minHeight:44}}>{v.label}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Estado</div>
          <div style={{display:'flex',gap:6,flexDirection:'column'}}>
            {Object.entries(STAT).map(([k,v])=>(
              <button key={k} onClick={()=>setStatus(k)} style={{background:status===k?v.color+'22':C.surface2,border:`1.5px solid ${status===k?v.color:C.border}`,borderRadius:8,padding:'12px 14px',textAlign:'left',color:status===k?v.color:C.muted,fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,minHeight:44,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:status===k?v.color:C.muted}}/>
                {v.label}
                {k==='resuelto'&&status!=='resuelto'&&<span style={{marginLeft:'auto',fontSize:9,color:C.muted}}>Registra fecha de cierre</span>}
              </button>
            ))}
          </div>
        </div>

        {status==='resuelto'&&(
          <TextArea label="Notas de resolución" value={resolution} onChange={setResolution} placeholder="Describí cómo se resolvió el incidente..." rows={3}/>
        )}

        <Btn full onClick={save} disabled={saving}>{saving?'GUARDANDO...':'GUARDAR CAMBIOS'}</Btn>
      </div>
    </div>
  )
}

// ── Pantalla principal Tickets ────────────────────────────────
export default function TicketsScreen(){
  const {user}=useAuth()
  const [tickets,setTickets]=useState([])
  const [plants,setPlants]=useState([])
  const [loading,setLoading]=useState(true)
  const [filter,setFilter]=useState('activos')
  const [showNew,setShowNew]=useState(false)
  const [editTicket,setEditTicket]=useState(null)
  // New ticket form
  const [plantId,setPlantId]=useState('')
  const [severity,setSeverity]=useState('')
  const [title,setTitle]=useState('')
  const [desc,setDesc]=useState('')
  const [sector,setSector]=useState('')
  const [photo,setPhoto]=useState(null)
  const [saving,setSaving]=useState(false)

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    setLoading(true)
    const [{data:t},{data:p}]=await Promise.all([
      supabase.from('tickets').select('*, plants(name), profiles!tickets_created_by_fkey(full_name)').order('created_at',{ascending:false}),
      supabase.from('plants').select('id,name').order('name')
    ])
    setTickets(t||[])
    setPlants(p||[])
    setLoading(false)
  }

  const filtered=filter==='activos'?tickets.filter(t=>t.status!=='resuelto'):filter==='criticos'?tickets.filter(t=>t.severity==='critico'):filter==='resueltos'?tickets.filter(t=>t.status==='resuelto'):tickets

  async function createTicket(){
    if(!plantId||!severity||!title){return}
    setSaving(true)
    const payload={plant_id:plantId,created_by:user.id,severity,title,description:desc,sector,status:'abierto'}
    if(severity==='critico')payload.sla_start_at=new Date().toISOString()
    const {data,error}=await supabase.from('tickets').insert(payload).select('*, plants(name), profiles!tickets_created_by_fkey(full_name)').single()
    if(!error){
      if(photo?.file){
        try{
          const path=`${data.id}/foto-${Date.now()}.jpg`
          const {data:{publicUrl}}=supabase.storage.from('ticket-photos').getPublicUrl((await supabase.storage.from('ticket-photos').upload(path,photo.file)).data.path)
          await supabase.from('ticket_photos').insert({ticket_id:data.id,storage_path:path,public_url:publicUrl,uploaded_by:user.id})
        }catch(e){console.error(e)}
      }
      setTickets(prev=>[data,...prev])
      setShowNew(false);setPlantId('');setSeverity('');setTitle('');setDesc('');setSector('');setPhoto(null)
    }
    setSaving(false)
  }

  const slaUrgent=(t)=>t.severity==='critico'&&t.status!=='resuelto'&&t.sla_start_at&&Math.floor((Date.now()-new Date(t.sla_start_at))/(1000*60*60*24))>=25

  if(loading)return<Spinner/>

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>INCIDENTES</div>
          <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Tickets</div>
        </div>
        <Btn small onClick={()=>setShowNew(!showNew)}>+ NUEVO</Btn>
      </div>

      {/* Nuevo ticket */}
      {showNew&&(
        <div style={{background:C.surface2,border:`1px solid ${C.amber}44`,borderRadius:8,padding:14,marginBottom:14,animation:'slideUp 0.25s ease'}}>
          <div className="mono" style={{fontSize:11,color:C.amber,letterSpacing:'0.1em',marginBottom:12,textTransform:'uppercase'}}>Nuevo Ticket</div>
          <Select label="Planta" value={plantId} onChange={setPlantId} options={plants.map(p=>({value:p.id,label:p.name}))} required/>
          <Input label="Título del incidente" value={title} onChange={setTitle} placeholder="Ej: Filtración activa en sector B3" required/>
          <div style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Severidad *</div>
            <div style={{display:'flex',gap:6}}>
              {Object.entries(SEV).map(([k,v])=>(
                <button key={k} onClick={()=>setSeverity(k)} style={{flex:1,background:severity===k?v.color+'33':C.surface,border:`1.5px solid ${severity===k?v.color:C.border}`,borderRadius:6,padding:'10px 6px',color:severity===k?v.color:C.muted,fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,minHeight:44}}>{v.label}</button>
              ))}
            </div>
          </div>
          {severity==='critico'&&<AlertBanner color={C.red} icon="🚨">Inicia contador SLA de 30 días para notificación al proveedor.</AlertBanner>}
          <TextArea label="Descripción" value={desc} onChange={setDesc} placeholder="Describí el incidente..."/>
          <Input label="Sector / Zona (opcional)" value={sector} onChange={setSector} placeholder="Ej: Sector B-3, Zona Norte"/>
          <PhotoUpload label="Foto del incidente" value={photo} onChange={setPhoto}/>
          <div style={{display:'flex',gap:8}}>
            <Btn outline onClick={()=>setShowNew(false)}>CANCELAR</Btn>
            <button onClick={createTicket} disabled={!plantId||!severity||!title||saving} style={{flex:1,background:plantId&&severity&&title&&!saving?C.amber:C.border,color:plantId&&severity&&title&&!saving?C.bg:C.muted,border:'none',borderRadius:10,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:12,fontWeight:700,minHeight:44,transition:'all 0.2s'}}>
              {saving?'CREANDO...':'CREAR TICKET'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{display:'flex',gap:6,marginBottom:14,overflowX:'auto'}}>
        {[['activos','ACTIVOS'],['criticos','CRÍTICOS'],['resueltos','RESUELTOS'],['todos','TODOS']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{background:filter===k?C.amberDim:C.surface2,border:`1px solid ${filter===k?C.amber:C.border}`,borderRadius:6,padding:'7px 12px',fontFamily:'IBM Plex Mono',fontSize:9,fontWeight:700,color:filter===k?C.amber:C.muted,letterSpacing:'0.08em',minHeight:36,whiteSpace:'nowrap',transition:'all 0.15s'}}>{l}</button>
        ))}
      </div>

      {filtered.length===0&&<div style={{textAlign:'center',color:C.muted,padding:'40px 0',fontSize:13}}>No hay tickets en este filtro</div>}

      {filtered.map((t,i)=>{
        const sev=SEV[t.severity]||SEV.leve
        const stat=STAT[t.status]||STAT.abierto
        const urgent=slaUrgent(t)
        const daysOpen=t.sla_start_at?Math.floor((Date.now()-new Date(t.sla_start_at))/(1000*60*60*24)):null
        return(
          <div key={t.id} style={{background:C.surface2,border:`1px solid ${urgent?C.red+'66':C.border}`,borderRadius:8,padding:14,marginBottom:10,animation:`fadeIn ${0.3+i*0.06}s ease`,position:'relative'}}>
            {urgent&&<div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.red},${C.orange})`,borderRadius:'8px 8px 0 0'}}/>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                <Badge color={sev.color} small>{sev.label}</Badge>
                <Badge color={stat.color} small>{stat.label}</Badge>
                {urgent&&<Badge color={C.red}>⚠ SLA D+{daysOpen}</Badge>}
              </div>
              <button onClick={()=>setEditTicket(t)} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'5px 10px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.08em'}}>EDITAR</button>
            </div>
            <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{t.title}</div>
            {t.description&&<div style={{fontSize:12,color:C.muted,marginBottom:8,lineHeight:1.5}}>{t.description}</div>}
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:C.muted}}>{t.plants?.name}</span>
              {t.sector&&<span className="mono" style={{fontSize:10,color:C.muted}}>· {t.sector}</span>}
              {t.status==='resuelto'&&t.resolved_at&&<span className="mono" style={{fontSize:10,color:C.green}}>· Resuelto {new Date(t.resolved_at).toLocaleDateString('es-AR')}</span>}
              {t.sla_start_at&&t.status!=='resuelto'&&<span className="mono" style={{fontSize:10,color:daysOpen>=25?C.red:C.muted}}>· SLA: {30-daysOpen}d restantes</span>}
            </div>
            {t.resolution_notes&&t.status==='resuelto'&&(
              <div style={{background:C.green+'11',border:`1px solid ${C.green}33`,borderRadius:6,padding:'8px 10px',marginTop:8}}>
                <span style={{fontSize:11,color:C.green}}>✓ {t.resolution_notes}</span>
              </div>
            )}
          </div>
        )
      })}

      {editTicket&&<EditModal ticket={editTicket} onClose={()=>setEditTicket(null)} onSaved={(updated)=>{setTickets(prev=>prev.map(t=>t.id===updated.id?{...t,...updated}:t));setEditTicket(null)}}/>}
    </div>
  )
}
