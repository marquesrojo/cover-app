import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C, rciColor, rciLabel, rciRec } from '@/styles/tokens'
import { Badge, RciGauge, Spinner, Btn, Select, Toggle, SeverityChips, PhotoUpload, AlertBanner } from '@/components/ui'

const JSA_LABELS=['EPP completo (casco, arnés, línea de vida)','Revisión estructural antes de acceso','Comunicación con supervisor aprobada','Condiciones climáticas verificadas','Señalización del área activa','Punto de anclaje certificado confirmado']
const STEPS=[{id:1,label:'IDENTIFICACIÓN'},{id:2,label:'JSA'},{id:3,label:'MEMBRANA'},{id:4,label:'UNIONES'},{id:5,label:'DRENAJE'},{id:6,label:'EQUIPOS'},{id:7,label:'RCI FINAL'}]

async function uploadPhoto(file,bucket,path){
  const {data,error}=await supabase.storage.from(bucket).upload(path,file,{upsert:true})
  if(error)throw error
  const {data:{publicUrl}}=supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

function StepBar({step}){
  return(
    <div style={{padding:'10px 16px 0',background:C.surface,borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>
      <div style={{display:'flex',gap:0,minWidth:'max-content'}}>
        {STEPS.map((s,i)=>{
          const done=s.id<step,active=s.id===step
          return(
            <div key={s.id} style={{display:'flex',alignItems:'center'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'0 8px 8px',borderBottom:active?`2px solid ${C.amber}`:'2px solid transparent'}}>
                <span style={{fontSize:14,color:done?C.green:active?C.amber:C.muted}}>{done?'✓':s.id}</span>
                <span className="mono" style={{fontSize:7,color:active?C.amber:C.muted,letterSpacing:'0.06em'}}>{s.label}</span>
              </div>
              {i<6&&<div style={{width:6,height:1,background:C.border,flexShrink:0}}/>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function InspectionDetail(){
  const {id}=useParams()
  const navigate=useNavigate()
  const [insp,setInsp]=useState(null)
  const [plant,setPlant]=useState(null)
  const [photos,setPhotos]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    async function load(){
      const [{data:i},{data:ph}]=await Promise.all([
        supabase.from('inspections').select('*, profiles(full_name)').eq('id',id).single(),
        supabase.from('inspection_photos').select('*').eq('inspection_id',id)
      ])
      setInsp(i)
      if(i?.plant_id){const {data:p}=await supabase.from('plants').select('*').eq('id',i.plant_id).single();setPlant(p)}
      setPhotos(ph||[])
      setLoading(false)
    }
    load()
  },[id])

  if(loading)return<Spinner/>
  if(!insp)return(
    <div style={{padding:24}}>
      <button onClick={()=>navigate('/inspeccion')} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,marginBottom:16,padding:0}}>← VOLVER</button>
      <div style={{color:C.muted,textAlign:'center',padding:40}}>Inspección no encontrada</div>
    </div>
  )

  const color=rciColor(insp.rci||0)
  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <button onClick={()=>navigate('/inspeccion')} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,marginBottom:16,padding:0}}>← VOLVER</button>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
        <RciGauge value={insp.rci||0} size={80}/>
        <div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>{plant?.name}</div>
          <div className="mono" style={{fontSize:10,color:C.muted,marginBottom:6}}>{insp.type} · {new Date(insp.created_at).toLocaleDateString('es-AR')}</div>
          <div style={{display:'flex',gap:6}}><Badge color={color}>{rciLabel(insp.rci||0)}</Badge><Badge color={C.green} small>COMPLETADA</Badge></div>
        </div>
      </div>
      <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        {[['Inspector',insp.profiles?.full_name||'—'],['Membrana',insp.membrane||'—'],['Tipo',insp.type||'—'],['Fecha',new Date(insp.created_at).toLocaleString('es-AR')]].map(([k,v])=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontSize:12,color:C.muted}}>{k}</span><span style={{fontSize:12,color:C.text,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
      {photos.length>0&&(
        <div style={{marginBottom:12}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',marginBottom:10,textTransform:'uppercase'}}>Fotos ({photos.length})</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {photos.map(ph=>(<div key={ph.id}><img src={ph.public_url} alt="" style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:8,border:`1px solid ${C.border}`}}/><div className="mono" style={{fontSize:8,color:C.muted,marginTop:4,textTransform:'uppercase'}}>{ph.step}</div></div>))}
          </div>
        </div>
      )}
      <div style={{background:color+'11',border:`1px solid ${color}33`,borderRadius:8,padding:14,marginBottom:12}}>
        <div className="mono" style={{fontSize:10,color,letterSpacing:'0.1em',marginBottom:6,textTransform:'uppercase'}}>Recomendación</div>
        <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{rciRec(insp.rci||0)}</div>
      </div>
      <div style={{textAlign:'center'}}><div className="mono" style={{fontSize:9,color:C.muted,wordBreak:'break-all'}}>{window.location.href}</div></div>
    </div>
  )
}

function InspeccionList(){
  const navigate=useNavigate()
  const [inspections,setInspections]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    supabase.from('inspections').select('*, profiles(full_name), plants(name)').eq('status','completed').order('created_at',{ascending:false}).then(({data})=>{setInspections(data||[]);setLoading(false)})
  },[])

  if(loading)return<Spinner/>
  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>REGISTRO</div>
          <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Inspecciones</div>
        </div>
        <button onClick={()=>navigate('/inspeccion/nueva')} style={{background:C.amber,color:C.bg,border:'none',borderRadius:8,padding:'10px 14px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,minHeight:44}}>+ NUEVA</button>
      </div>
      {inspections.length===0?(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:16}}>No hay inspecciones realizadas</div>
          <button onClick={()=>navigate('/inspeccion/nueva')} style={{background:C.amber,color:C.bg,border:'none',borderRadius:8,padding:'12px 20px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700}}>+ INICIAR PRIMERA INSPECCIÓN</button>
        </div>
      ):(
        inspections.map((insp,i)=>{
          const color=rciColor(insp.rci||0)
          return(
            <div key={insp.id} onClick={()=>navigate(`/inspeccion/${insp.id}`)} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',marginBottom:8,cursor:'pointer',display:'flex',alignItems:'center',gap:12,animation:`fadeIn ${0.3+i*0.06}s ease`,transition:'border-color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.amber+'55'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <RciGauge value={insp.rci||0} size={52}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{insp.plants?.name||'—'}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  <Badge color={color} small>{rciLabel(insp.rci||0)}</Badge>
                  <span className="mono" style={{fontSize:9,color:C.muted}}>{insp.type}</span>
                  <span className="mono" style={{fontSize:9,color:C.muted}}>{new Date(insp.created_at).toLocaleDateString('es-AR')}</span>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{insp.profiles?.full_name}</div>
              </div>
              <span style={{color:C.muted,fontSize:16}}>›</span>
            </div>
          )
        })
      )}
    </div>
    
    export default function InspeccionScreen(){
  const navigate=useNavigate()
  const [params]=useSearchParams()
  const {user}=useAuth()
  const [step,setStep]=useState(1)
  const [plants,setPlants]=useState([])
  const [plantId,setPlantId]=useState(params.get('plantId')||'')
  const [type,setType]=useState('')
  const [membrane,setMembrane]=useState('')
  const [jsa,setJsa]=useState(Array(6).fill(false))
  const [memb,setMemb]=useState({cuarteamiento:'',ampollas:'',granulos:'',perforaciones:'',uvDeg:''})
  const [membPhoto,setMembPhoto]=useState(null)
  const [uniones,setUniones]=useState({viento:'',adhesiva:'',termico:''})
  const [unionPhoto,setUnionPhoto]=useState(null)
  const [drain,setDrain]=useState([false,false,false])
  const [drainPhoto,setDrainPhoto]=useState(null)
  const [equip,setEquip]=useState([false,false,false])
  const [equipPhoto,setEquipPhoto]=useState(null)
  const [saving,setSaving]=useState(false)
  const [savedId,setSavedId]=useState(null)

  useEffect(()=>{
    supabase.from('plants').select('id,name,membrane').order('name').then(({data})=>setPlants(data||[]))
  },[])


  const canNext=()=>{
    if(step===1)return !!(plantId&&type&&membrane)
    if(step===2)return jsa.every(Boolean)
    if(step===3)return Object.values(memb).every(v=>v!=='')&&!!membPhoto
    if(step===4)return Object.values(uniones).every(v=>v!=='')
    if(step===5)return drain.every(Boolean)
    if(step===6)return equip.every(Boolean)
    return true
  }

  const calcRCI=()=>{
    const pen={'Sin daño':0,'Leve':0.25,'Moderado':0.6,'Severo':1}
    const w={perforaciones:18,viento:15,adhesiva:14,ampollas:12,termico:10,cuarteamiento:8,granulos:6,uvDeg:7}
    let t=0
    t+=(pen[memb.perforaciones]||0)*w.perforaciones
    t+=(pen[uniones.viento]||0)*w.viento
    t+=(pen[uniones.adhesiva]||0)*w.adhesiva
    t+=(pen[memb.ampollas]||0)*w.ampollas
    t+=(pen[uniones.termico]||0)*w.termico
    t+=(pen[memb.cuarteamiento]||0)*w.cuarteamiento
    t+=(pen[memb.granulos]||0)*w.granulos
    t+=(pen[memb.uvDeg]||0)*w.uvDeg
    if(!drain[1])t+=8
    return Math.max(0,Math.round(100-t))
  }

  const save=async()=>{
    setSaving(true)
    const rci=calcRCI()
    const {data:insp,error}=await supabase.from('inspections').insert({
      plant_id:plantId,inspector_id:user.id,type,membrane,status:'completed',rci,
      jsa_epp:jsa[0],jsa_estructura:jsa[1],jsa_supervisor:jsa[2],jsa_clima:jsa[3],jsa_senalizacion:jsa[4],jsa_anclaje:jsa[5],
      memb_cuarteamiento:memb.cuarteamiento,memb_ampollas:memb.ampollas,memb_granulos:memb.granulos,memb_perforaciones:memb.perforaciones,memb_uv_deg:memb.uvDeg,
      union_viento:uniones.viento,union_adhesiva:uniones.adhesiva,union_termico:uniones.termico,
      drain_embudo:drain[0],drain_agua:drain[1],drain_bajante:drain[2],
      equip_hvac:equip[0],equip_sellos:equip[1],equip_escorrentia:equip[2],
      completed_at:new Date().toISOString()
    }).select().single()

    if(error){setSaving(false);alert('Error: '+error.message);return}

    for(const {photo,step:s} of [{photo:membPhoto,step:'membrana'},{photo:unionPhoto,step:'uniones'},{photo:drainPhoto,step:'drenaje'},{photo:equipPhoto,step:'equipos'}].filter(x=>x.photo?.file)){
      try{
        const path=`${insp.id}/${s}-${Date.now()}.jpg`
        const url=await uploadPhoto(photo.file,'inspection-photos',path)
        await supabase.from('inspection_photos').insert({inspection_id:insp.id,step:s,storage_path:path,public_url:url,lat:photo.lat,lng:photo.lng,uploaded_by:user.id})
      }catch(e){console.error(e)}
    }
    setSavedId(insp.id)
    setSaving(false)
  }

  if(savedId){
    const rci=calcRCI()
    return(
      <div style={{padding:'24px 16px 80px',textAlign:'center',animation:'fadeIn 0.3s ease'}}>
        <div style={{display:'inline-block',marginBottom:12}}><RciGauge value={rci} size={120}/></div>
        <div style={{marginBottom:8}}><Badge color={rciColor(rci)}>{rciLabel(rci)}</Badge></div>
        <div style={{fontSize:13,color:C.muted,maxWidth:280,margin:'0 auto 20px',lineHeight:1.6}}>{rciRec(rci)}</div>
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:16,textAlign:'left'}}>
          <div className="mono" style={{fontSize:10,color:C.amber,marginBottom:8}}>INSPECCIÓN GUARDADA ✓</div>
          <div className="mono" style={{fontSize:10,color:C.text,wordBreak:'break-all',background:C.bg,padding:'8px 10px',borderRadius:6}}>{window.location.origin}/inspeccion/{savedId}</div>
        </div>
        <Btn full onClick={()=>navigate(`/inspeccion/${savedId}`)}>VER INSPECCIÓN COMPLETA →</Btn>
        <div style={{marginTop:12}}><Btn full outline onClick={()=>navigate('/inspeccion')}>VER TODAS LAS INSPECCIONES</Btn></div>
      </div>
    )
  }

  return(
    <div style={{animation:'fadeIn 0.3s ease'}}>
      <StepBar step={step}/>
      <div style={{padding:'16px 16px 100px'}}>
        {step===1&&(
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <button onClick={()=>navigate('/inspeccion')} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,padding:0}}>← VOLVER</button>
              <div style={{fontSize:16,fontWeight:600}}>Identificación del Activo</div>
            </div>
            <Select label="Planta" value={plantId} onChange={setPlantId} options={plants.map(p=>({value:p.id,label:p.name}))} required/>
            <Select label="Tipo de inspección" value={type} onChange={setType} options={['Primavera','Otoño','Post-Evento','Extraordinaria']} required/>
            <Select label="Membrana" value={membrane} onChange={setMembrane} options={['TPO','EPDM','PVC','Asfáltica']} required/>
          </div>
        )}
        {step===2&&(
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>JSA — Análisis de Seguridad</div>
            <AlertBanner color={C.amber} icon="⚠">Ley 19.587 / Decreto 911/96 — Todos los controles son obligatorios</AlertBanner>
            {JSA_LABELS.map((l,i)=><Toggle key={i} label={l} value={jsa[i]} onChange={v=>{const a=[...jsa];a[i]=v;setJsa(a)}}/>)}
            <div className="mono" style={{fontSize:10,color:jsa.every(Boolean)?C.green:C.red,marginTop:12}}>{jsa.every(Boolean)?'✓ TODOS LOS CONTROLES OK':`✗ ${jsa.filter(Boolean).length}/6 COMPLETADOS`}</div>
          </div>
        )}
        {step===3&&(
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Superficie de Membrana</div>
            {[['Cuarteamiento superficial','cuarteamiento'],['Ampollas (blistering)','ampollas'],['Pérdida de gránulos','granulos'],['Perforaciones / punzocortantes','perforaciones'],['Degradación UV','uvDeg']].map(([label,key])=>(
              <div key={key} style={{marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{label}</div>
                <SeverityChips value={memb[key]} onChange={v=>setMemb(p=>({...p,[key]:v}))}/>
              </div>
            ))}
            <PhotoUpload label="Foto de membrana (obligatorio)" value={membPhoto} onChange={setMembPhoto}/>
          </div>
        )}
        {step===4&&(
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Uniones y Costuras</div>
            {[['Levantamiento por viento','viento'],['Separación adhesiva','adhesiva'],['Estrés térmico','termico']].map(([label,key])=>(
              <div key={key} style={{marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{label}</div>
                <SeverityChips value={uniones[key]} onChange={v=>setUniones(p=>({...p,[key]:v}))}/>
              </div>
            ))}
            <PhotoUpload label="Foto de costura crítica" value={unionPhoto} onChange={setUnionPhoto}/>
          </div>
        )}
        {step===5&&(
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>Sistema de Drenaje</div>
            <AlertBanner color={C.blue} icon="ℹ">Agua estancada +48hs puede invalidar garantía de membrana.</AlertBanner>
            {['Embudos y rejillas sin escombros','Sin agua estancada por más de 48hs','Bajantes sin obstrucción verificada'].map((l,i)=>(
              <Toggle key={i} label={l} value={drain[i]} onChange={v=>{const a=[...drain];a[i]=v;setDrain(a)}}/>
            ))}
            <div style={{marginTop:14}}><PhotoUpload label="Foto del embudo principal" value={drainPhoto} onChange={setDrainPhoto}/></div>
          </div>
        )}
        {step===6&&(
          <div style={{animation:'fadeIn 0.3s ease'}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Equipos Montados</div>
            {['Soportes HVAC sin vibración','Sellos de claraboyas íntegros','Sin escorrentía de condensación'].map((l,i)=>(
              <Toggle key={i} label={l} value={equip[i]} onChange={v=>{const a=[...equip];a[i]=v;setEquip(a)}}/>
            ))}
            <div style={{marginTop:14}}><PhotoUpload label="Foto de unidad HVAC" value={equipPhoto} onChange={setEquipPhoto}/></div>
          </div>
        )}
        {step===7&&(
          <div style={{animation:'fadeIn 0.3s ease',textAlign:'center',paddingTop:8}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:20}}>RCI Final — Cierre</div>
            <div style={{display:'inline-block',marginBottom:12}}><RciGauge value={calcRCI()} size={100}/></div>
            <div style={{marginBottom:8}}><Badge color={rciColor(calcRCI())}>{rciLabel(calcRCI())}</Badge></div>
            <div style={{fontSize:13,color:C.muted,maxWidth:280,margin:'0 auto 20px',lineHeight:1.6}}>{rciRec(calcRCI())}</div>
            <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,textAlign:'left',marginBottom:16}}>
              {[['Planta',plants.find(p=>p.id===plantId)?.name||'—'],['Tipo',type],['Membrana',membrane]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.muted}}>{k}</span><span style={{fontSize:12,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={save} disabled={saving}>{saving?'GUARDANDO...':'✓ CERRAR Y GUARDAR INSPECCIÓN'}</Btn>
          </div>
        )}
        {step<7&&(
          <div style={{display:'flex',gap:10,marginTop:24}}>
            {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{flexShrink:0,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 20px',color:C.text,fontFamily:'IBM Plex Mono',fontSize:12,minHeight:44}}>← ATRÁS</button>}
            <button onClick={()=>canNext()&&setStep(s=>s+1)} disabled={!canNext()} style={{flex:1,background:canNext()?C.amber:C.border,color:canNext()?C.bg:C.muted,border:'none',borderRadius:10,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:12,fontWeight:700,letterSpacing:'0.1em',transition:'all 0.2s',minHeight:44,cursor:canNext()?'pointer':'not-allowed'}}>SIGUIENTE PASO →</button>
          </div>
        )}
      </div>
    </div>
  )
}
  )
  } 
}
