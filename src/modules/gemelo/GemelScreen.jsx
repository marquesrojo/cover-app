import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C, rciColor, rciLabel } from '@/styles/tokens'
import { Badge, Spinner, Btn, Input, Select, AlertBanner } from '@/components/ui'

function SectorModal({sector,onClose,onSave}){
  const [rci,setRci]=useState(sector.rci??100)
  const [notes,setNotes]=useState(sector.notes||'')
  const [label,setLabel]=useState(sector.label||'')
  const [saving,setSaving]=useState(false)
  const color=rciColor(rci)
  return(
    <div style={{position:'fixed',inset:0,background:'#000a',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.surface,border:`1px solid ${C.border}`,borderRadius:'12px 12px 0 0',padding:20,animation:'slideUp 0.25s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span className="mono" style={{fontSize:12,fontWeight:700,color:C.amber}}>SECTOR {sector.label||`${String.fromCharCode(65+sector.row_index)}${sector.col_index+1}`}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:18}}>✕</button>
        </div>
        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',marginBottom:8,textTransform:'uppercase'}}>RCI del sector: <span style={{color}}>{rci}</span></div>
          <input type="range" min={0} max={100} value={rci} onChange={e=>setRci(Number(e.target.value))} style={{width:'100%',accentColor:color}}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            <span className="mono" style={{fontSize:9,color:C.red}}>0 CRITICO</span>
            <Badge color={color} small>{rciLabel(rci)}</Badge>
            <span className="mono" style={{fontSize:9,color:C.green}}>100 EXCELENTE</span>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',marginBottom:6,textTransform:'uppercase'}}>Etiqueta del sector</div>
          <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ej: Zona HVAC, Acceso Norte..."
            style={{width:'100%',background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:13,outline:'none'}}/>
        </div>
        <div style={{marginBottom:16}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',marginBottom:6,textTransform:'uppercase'}}>Notas</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observaciones del sector..." rows={3}
            style={{width:'100%',background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:13,outline:'none',resize:'vertical'}}/>
        </div>
        <Btn full onClick={async()=>{setSaving(true);await onSave({...sector,rci,notes,label});setSaving(false);onClose()}} disabled={saving}>
          {saving?'GUARDANDO...':'GUARDAR SECTOR'}
        </Btn>
      </div>
    </div>
  )
}

function MultiSectorModal({count,onClose,onSave}){
  const [rci,setRci]=useState(100)
  const [notes,setNotes]=useState('')
  const [saving,setSaving]=useState(false)
  const color=rciColor(rci)
  return(
    <div style={{position:'fixed',inset:0,background:'#000a',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.surface,border:`1px solid ${C.amber}44`,borderRadius:'12px 12px 0 0',padding:20,animation:'slideUp 0.25s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span className="mono" style={{fontSize:12,fontWeight:700,color:C.amber}}>EDITAR {count} SECTORES</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:18}}>✕</button>
        </div>
        <div className="mono" style={{fontSize:10,color:C.muted,marginBottom:16}}>El RCI y las notas se aplicaran a todos los sectores seleccionados</div>
        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',marginBottom:8,textTransform:'uppercase'}}>RCI para los {count} sectores: <span style={{color}}>{rci}</span></div>
          <input type="range" min={0} max={100} value={rci} onChange={e=>setRci(Number(e.target.value))} style={{width:'100%',accentColor:color}}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            <span className="mono" style={{fontSize:9,color:C.red}}>0 CRITICO</span>
            <Badge color={color} small>{rciLabel(rci)}</Badge>
            <span className="mono" style={{fontSize:9,color:C.green}}>100 EXCELENTE</span>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',marginBottom:6,textTransform:'uppercase'}}>Notas (opcional)</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observaciones comunes a todos los sectores..." rows={3}
            style={{width:'100%',background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:13,outline:'none',resize:'vertical'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,background:'none',border:`1px solid ${C.border}`,borderRadius:10,padding:'14px',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:12}}>CANCELAR</button>
          <button onClick={async()=>{setSaving(true);await onSave(rci,notes);setSaving(false);onClose()}}
            style={{flex:2,background:C.amber,color:C.bg,border:'none',borderRadius:10,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:12,fontWeight:700}}>
            {saving?'GUARDANDO...':`APLICAR A ${count} SECTORES`}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewCubiertaForm({onCreated,onCancel}){
  const {user}=useAuth()
  const [name,setName]=useState('')
  const [address,setAddress]=useState('')
  const [widthM,setWidthM]=useState('')
  const [lengthM,setLengthM]=useState('')
  const [membrane,setMembrane]=useState('')
  const [cellSize,setCellSize]=useState('10')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  const w=Number(widthM)||0
  const l=Number(lengthM)||0
  const cs=Number(cellSize)||10
  const cols=w>0?Math.ceil(w/cs):0
  const rows=l>0?Math.ceil(l/cs):0
  const areaM2=w>0&&l>0?w*l:0

  const create=async()=>{
    if(!name||!membrane){setError('Nombre y membrana son obligatorios');return}
    if(!widthM||!lengthM){setError('Ancho y largo son obligatorios');return}
    setSaving(true);setError('')
    const {data:plant,error:e}=await supabase.from('plants').insert({
      name,address,width_m:w,length_m:l,area_m2:areaM2,
      membrane,grid_rows:rows,grid_cols:cols,cell_size_m:cs,created_by:user.id
    }).select().single()
    if(e){setError(e.message);setSaving(false);return}
    const sectors=[]
    for(let r=0;r<rows;r++)
      for(let c=0;c<cols;c++)
        sectors.push({plant_id:plant.id,row_index:r,col_index:c,rci:100})
    await supabase.from('sectors').insert(sectors)
    setSaving(false);onCreated(plant)
  }

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <button onClick={onCancel} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,marginBottom:16,padding:0}}>VOLVER</button>
      <div style={{fontSize:18,fontWeight:600,marginBottom:20}}>Nueva Cubierta</div>
      {error&&<AlertBanner color={C.red} icon="!">{error}</AlertBanner>}
      <Input label="Nombre de la cubierta" value={name} onChange={setName} placeholder="Ej: Cubierta Norte — Nave A" required/>
      <Input label="Direccion o referencia" value={address} onChange={setAddress} placeholder="Ej: Planta industrial Lujan"/>
      <Select label="Tipo de membrana" value={membrane} onChange={setMembrane} options={['TPO','EPDM','PVC','Asfaltica']} required/>
      <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Dimensiones de la cubierta</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <Input label="Ancho (m)" type="number" value={widthM} onChange={setWidthM} placeholder="Ej: 40"/>
          <Input label="Largo (m)" type="number" value={lengthM} onChange={setLengthM} placeholder="Ej: 60"/>
        </div>
        <Input label="Tamano de celda (m)" type="number" value={cellSize} onChange={setCellSize} placeholder="10"/>
        {areaM2>0&&(
          <div style={{background:C.bg,borderRadius:6,padding:12,marginTop:10}}>
            <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:8}}>Resumen calculado</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['Superficie',`${areaM2.toLocaleString()} m2`],['Grilla',`${rows} x ${cols}`],['Total sectores',`${rows*cols}`],['Celda',`${cellSize}m x ${cellSize}m`]].map(([k,v])=>(
                <div key={k}>
                  <div className="mono" style={{fontSize:8,color:C.muted,textTransform:'uppercase'}}>{k}</div>
                  <div className="mono" style={{fontSize:13,fontWeight:700,color:C.amber,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Btn full onClick={create} disabled={saving||!name||!membrane||!widthM||!lengthM}>{saving?'CREANDO...':'CREAR CUBIERTA'}</Btn>
    </div>
  )
}

export default function GemelScreen(){
  const {plantId}=useParams()
  const navigate=useNavigate()
  const {user,profile}=useAuth()
  const [plants,setPlants]=useState([])
  const [selPlant,setSelPlant]=useState(null)
  const [sectors,setSectors]=useState([])
  const [selCell,setSelCell]=useState(null)
  const [loading,setLoading]=useState(true)
  const [showNew,setShowNew]=useState(false)
  const [bgImage,setBgImage]=useState(null)
  const [gridOpacity,setGridOpacity]=useState(70)
  const [showBgPanel,setShowBgPanel]=useState(false)
  const [showDeleteConfirm,setShowDeleteConfirm]=useState(false)
  const [deleting,setDeleting]=useState(false)
  const fileInputRef=useRef()
  const [multiMode,setMultiMode]=useState(false)
  const [selectedIds,setSelectedIds]=useState([])
  const [showMultiModal,setShowMultiModal]=useState(false)

  const isAdmin=profile?.role==='cover_admin'||profile?.role==='admin'

  useEffect(()=>{fetchPlants()},[])
  useEffect(()=>{if(selPlant){fetchSectors(selPlant.id);loadBgImage(selPlant.id);setMultiMode(false);setSelectedIds([]);setShowDeleteConfirm(false)}},[selPlant])
  useEffect(()=>{if(plantId&&plants.length){const p=plants.find(x=>x.id===plantId);if(p)setSelPlant(p)}},[plantId,plants])

  async function fetchPlants(){
    setLoading(true)
    const {data}=await supabase.from('plants').select('*').order('created_at',{ascending:false})
    setPlants(data||[])
    if(!plantId&&data?.length)setSelPlant(data[0])
    setLoading(false)
  }

  async function fetchSectors(pid){
    const {data}=await supabase.from('sectors').select('*').eq('plant_id',pid)
    setSectors(data||[])
  }

  async function saveSector(updated){
    await supabase.from('sectors').update({rci:updated.rci,notes:updated.notes,label:updated.label,updated_by:user.id,updated_at:new Date().toISOString()}).eq('id',updated.id)
    setSectors(prev=>prev.map(s=>s.id===updated.id?{...s,...updated}:s))
  }

  async function saveMultiSectors(rci,notes){
    const updates=selectedIds.map(id=>supabase.from('sectors').update({rci,notes:notes||null,updated_by:user.id,updated_at:new Date().toISOString()}).eq('id',id))
    await Promise.all(updates)
    setSectors(prev=>prev.map(s=>selectedIds.includes(s.id)?{...s,rci,notes:notes||s.notes}:s))
    setSelectedIds([])
    setMultiMode(false)
  }

  function toggleCellSelection(sectorId){
    setSelectedIds(prev=>prev.includes(sectorId)?prev.filter(id=>id!==sectorId):[...prev,sectorId])
  }

  async function loadBgImage(pid){
    try{
      const {data}=await supabase.storage.from('plant-backgrounds').list(pid)
      if(data&&data.length>0){
        const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(`${pid}/${data[0].name}`)
        setBgImage(publicUrl)
      }else{setBgImage(null)}
    }catch(e){setBgImage(null)}
  }

  async function uploadBgImage(file){
    if(!selPlant||!file)return
    const ext=file.name.split('.').pop()
    const path=`${selPlant.id}/background.${ext}`
    const {error}=await supabase.storage.from('plant-backgrounds').upload(path,file,{upsert:true})
    if(!error){
      const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(path)
      setBgImage(publicUrl);setShowBgPanel(false)
    }
  }

  async function removeBgImage(){
    if(!selPlant||!bgImage)return
    const parts=bgImage.split('/')
    const path=`${parts[parts.length-2]}/${parts[parts.length-1]}`
    await supabase.storage.from('plant-backgrounds').remove([path])
    setBgImage(null);setShowBgPanel(false)
  }

  async function deletePlant(){
    if(!selPlant)return
    setDeleting(true)
    await supabase.from('sectors').delete().eq('plant_id',selPlant.id)
    await supabase.from('plant_access').delete().eq('plant_id',selPlant.id)
    await supabase.from('plants').delete().eq('id',selPlant.id)
    const remaining=plants.filter(p=>p.id!==selPlant.id)
    setPlants(remaining)
    setSelPlant(remaining.length>0?remaining[0]:null)
    setShowDeleteConfirm(false)
    setDeleting(false)
  }

  if(loading)return<Spinner/>
  if(showNew)return<NewCubiertaForm onCreated={(p)=>{setPlants(prev=>[p,...prev]);setSelPlant(p);fetchSectors(p.id);setShowNew(false)}} onCancel={()=>setShowNew(false)}/>

  const rows=selPlant?.grid_rows||10
  const cols=selPlant?.grid_cols||10
  const getSector=(r,c)=>sectors.find(s=>s.row_index===r&&s.col_index===c)
  const canDelete=selPlant&&(isAdmin||selPlant.created_by===user?.id)

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>MAPA DE SECTORES</div>
          <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Cubiertas</div>
        </div>
        <Btn small onClick={()=>setShowNew(true)}>+ CUBIERTA</Btn>
      </div>

      {plants.length===0?(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:32,marginBottom:12}}>🏗</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:16}}>No hay cubiertas cargadas</div>
          <Btn onClick={()=>setShowNew(true)}>+ CREAR PRIMERA CUBIERTA</Btn>
        </div>
      ):(
        <>
          <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:14,paddingBottom:4}}>
            {plants.map(p=>(
              <button key={p.id} onClick={()=>setSelPlant(p)} style={{background:selPlant?.id===p.id?C.amberDim:C.surface2,border:`1px solid ${selPlant?.id===p.id?C.amber:C.border}`,borderRadius:6,padding:'6px 12px',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                <span className="mono" style={{fontSize:9,color:selPlant?.id===p.id?C.amber:C.mutedLight,letterSpacing:'0.08em'}}>{p.name.split('—')[0].trim()}</span>
              </button>
            ))}
          </div>

          {selPlant&&(
            <>
              <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{selPlant.name}</div>
                  <div className="mono" style={{fontSize:10,color:C.muted,marginTop:2}}>
                    {selPlant.width_m&&selPlant.length_m?`${selPlant.width_m}m x ${selPlant.length_m}m · `:''}{selPlant.area_m2?.toLocaleString()} m2 · {selPlant.membrane} · {rows}x{cols}
                  </div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>navigate(`/inspeccion/nueva?plantId=${selPlant.id}`)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:6,padding:'8px 12px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>+ INSPECCION</button>
                  {canDelete&&(
                    <button onClick={()=>setShowDeleteConfirm(true)} style={{background:'none',border:`1px solid ${C.red}44`,borderRadius:6,padding:'8px 10px',fontFamily:'IBM Plex Mono',fontSize:10,color:C.red,cursor:'pointer'}}>🗑</button>
                  )}
                </div>
              </div>

              {/* Confirmar borrado */}
              {showDeleteConfirm&&(
                <div style={{background:C.red+'11',border:`1px solid ${C.red}44`,borderRadius:8,padding:14,marginBottom:14,animation:'fadeIn 0.2s ease'}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.red,marginBottom:6}}>Borrar cubierta "{selPlant.name}"</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Se eliminarán todos los sectores y accesos asociados. Esta acción no se puede deshacer.</div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowDeleteConfirm(false)} style={{flex:1,background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'10px',fontFamily:'IBM Plex Mono',fontSize:10,color:C.muted,cursor:'pointer'}}>CANCELAR</button>
                    <button onClick={deletePlant} disabled={deleting} style={{flex:1,background:C.red,color:'#fff',border:'none',borderRadius:6,padding:'10px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,cursor:'pointer'}}>
                      {deleting?'BORRANDO...':'CONFIRMAR BORRADO'}
                    </button>
                  </div>
                </div>
              )}

              {/* Panel imagen de fondo */}
              <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div className="mono" style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>Plano / Imagen de fondo</div>
                    <div style={{fontSize:11,color:bgImage?C.green:C.muted,marginTop:2}}>{bgImage?'Imagen cargada':'Sin imagen'}</div>
                  </div>
                  <button onClick={()=>setShowBgPanel(!showBgPanel)} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 12px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer'}}>
                    {showBgPanel?'CERRAR':'GESTIONAR'}
                  </button>
                </div>
                {showBgPanel&&(
                  <div style={{marginTop:12,animation:'fadeIn 0.2s ease'}}>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files[0])uploadBgImage(e.target.files[0])}}/>
                    <button onClick={()=>fileInputRef.current?.click()} style={{width:'100%',background:C.amber+'22',border:`1.5px dashed ${C.amber}`,borderRadius:8,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,color:C.amber,cursor:'pointer',marginBottom:10}}>
                      SUBIR IMAGEN / PLANO
                    </button>
                    {bgImage&&(
                      <>
                        <img src={bgImage} alt="plano" style={{width:'100%',borderRadius:8,border:`1px solid ${C.border}`,marginBottom:8}}/>
                        <button onClick={removeBgImage} style={{background:'none',border:`1px solid ${C.red}44`,borderRadius:6,padding:'6px 12px',color:C.red,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer',width:'100%',marginBottom:10}}>
                          ELIMINAR IMAGEN
                        </button>
                        <div className="mono" style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Opacidad grilla: <span style={{color:C.amber}}>{gridOpacity}%</span></div>
                        <input type="range" min={20} max={100} value={gridOpacity} onChange={e=>setGridOpacity(Number(e.target.value))} style={{width:'100%',accentColor:C.amber}}/>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Toolbar selección múltiple */}
              <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
                <button onClick={()=>{setMultiMode(!multiMode);setSelectedIds([])}} style={{background:multiMode?C.amber+'33':C.surface2,border:`1.5px solid ${multiMode?C.amber:C.border}`,borderRadius:6,padding:'7px 12px',color:multiMode?C.amber:C.muted,fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,cursor:'pointer',flex:1,transition:'all 0.15s'}}>
                  {multiMode?`SELECCION: ${selectedIds.length} celdas`:'SELECCION MULTIPLE'}
                </button>
                {multiMode&&selectedIds.length>0&&(
                  <button onClick={()=>setShowMultiModal(true)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:6,padding:'7px 14px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                    EDITAR {selectedIds.length}
                  </button>
                )}
                {multiMode&&(
                  <button onClick={()=>setSelectedIds(sectors.map(s=>s.id))} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'7px 10px',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
                    TODO
                  </button>
                )}
              </div>

              {multiMode&&(
                <div className="mono" style={{fontSize:10,color:C.amber,textAlign:'center',marginBottom:8,padding:'6px',background:C.amber+'11',borderRadius:6}}>
                  MODO SELECCION ACTIVO — TOCA LAS CELDAS PARA SELECCIONARLAS
                </div>
              )}

              {/* Grilla */}
              <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14,overflowX:'auto'}}>
                <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>
                  MAPA DE SECTORES · {rows}x{cols} · {selPlant?.cell_size_m||10}m x {selPlant?.cell_size_m||10}m por celda
                </div>
                <div style={{position:'relative',display:'inline-block',minWidth:Math.max(cols*36+28,200)}}>
                  {bgImage&&(
                    <div style={{position:'absolute',top:24,left:28,right:0,bottom:0,zIndex:0,borderRadius:4,overflow:'hidden'}}>
                      <img src={bgImage} alt="plano" style={{width:'100%',height:'100%',objectFit:'cover',opacity:1-gridOpacity/100}}/>
                    </div>
                  )}
                  <div style={{position:'relative',zIndex:1}}>
                    <div style={{display:'grid',gridTemplateColumns:`24px repeat(${cols},1fr)`,gap:3,marginBottom:3}}>
                      <div/>
                      {Array.from({length:cols},(_,i)=>(
                        <div key={i} className="mono" style={{textAlign:'center',fontSize:9,color:C.muted}}>{i+1}</div>
                      ))}
                    </div>
                    {Array.from({length:rows},(_,ri)=>(
                      <div key={ri} style={{display:'grid',gridTemplateColumns:`24px repeat(${cols},1fr)`,gap:3,marginBottom:3}}>
                        <div className="mono" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:C.muted}}>{String.fromCharCode(65+ri)}</div>
                        {Array.from({length:cols},(_,ci)=>{
                          const s=getSector(ri,ci)
                          const rci=s?.rci??100
                          const color=rciColor(rci)
                          const isSelected=s&&selectedIds.includes(s.id)
                          const isSingleSel=!multiMode&&selCell?.id===s?.id
                          const cellOpacity=bgImage?gridOpacity/100:1
                          return(
                            <div key={ci} onClick={()=>{
                              if(!s)return
                              if(multiMode){toggleCellSelection(s.id)}
                              else{setSelCell(s)}
                            }} style={{
                              aspectRatio:'1',
                              background:isSelected?C.amber+'44':color+'22',
                              border:`1.5px solid ${isSelected?C.amber:isSingleSel?C.amber:color+'55'}`,
                              borderRadius:3,
                              display:'flex',alignItems:'center',justifyContent:'center',
                              cursor:'pointer',transition:'all 0.1s',
                              minWidth:30,
                              opacity:cellOpacity,
                              transform:isSelected?'scale(0.92)':'scale(1)',
                            }}>
                              {isSelected
                                ?<span style={{fontSize:12,color:C.amber}}>✓</span>
                                :<span className="mono" style={{fontSize:9,fontWeight:700,color}}>{rci}</span>
                              }
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
                  {[['EXCELENTE',C.green],['REGULAR',C.yellow],['POBRE',C.orange],['CRITICO',C.red]].map(([l,c])=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
                      <div style={{width:8,height:8,background:c+'44',border:`1.5px solid ${c}77`,borderRadius:2}}/>
                      <span className="mono" style={{fontSize:8,color:C.muted}}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!multiMode&&<div className="mono" style={{fontSize:10,color:C.muted,textAlign:'center'}}>TOCA UNA CELDA PARA EDITAR · ACTIVA SELECCION MULTIPLE PARA EDITAR VARIAS</div>}
            </>
          )}
        </>
      )}

      {selCell&&!multiMode&&<SectorModal sector={selCell} onClose={()=>setSelCell(null)} onSave={saveSector}/>}
      {showMultiModal&&<MultiSectorModal count={selectedIds.length} onClose={()=>setShowMultiModal(false)} onSave={saveMultiSectors}/>}
    </div>
  )
}
