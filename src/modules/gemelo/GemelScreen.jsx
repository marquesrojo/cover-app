import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C, rciColor, rciLabel } from '@/styles/tokens'
import { Badge, RciGauge, Spinner, Btn, Input, Select, AlertBanner } from '@/components/ui'

// ── Modal editar sector ──────────────────────────────────────
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
          <span className="mono" style={{fontSize:12,fontWeight:700,color:C.amber}}>SECTOR {sector.label||`${sector.row_index+1}-${sector.col_index+1}`}</span>
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

// ── Formulario nueva planta ───────────────────────────────────
function NewPlantForm({onCreated,onCancel}){
  const {user}=useAuth()
  const [name,setName]=useState('')
  const [address,setAddress]=useState('')
  const [area,setArea]=useState('')
  const [membrane,setMembrane]=useState('')
  const [rows,setRows]=useState('10')
  const [cols,setCols]=useState('10')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  const create=async()=>{
    if(!name||!membrane){setError('Nombre y membrana son obligatorios');return}
    setSaving(true);setError('')
    const {data:plant,error:e}=await supabase.from('plants').insert({
      name,address,area_m2:area?Number(area):null,
      membrane,grid_rows:Number(rows),grid_cols:Number(cols),
      cell_size_m:10,created_by:user.id
    }).select().single()
    if(e){setError(e.message);setSaving(false);return}
    const sectors=[]
    for(let r=0;r<Number(rows);r++)
      for(let c=0;c<Number(cols);c++)
        sectors.push({plant_id:plant.id,row_index:r,col_index:c,rci:100})
    await supabase.from('sectors').insert(sectors)
    setSaving(false)
    onCreated(plant)
  }

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <button onClick={onCancel} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,letterSpacing:'0.05em',marginBottom:16,padding:0}}>VOLVER</button>
      <div style={{fontSize:18,fontWeight:600,marginBottom:20}}>Nueva Instalacion</div>
      {error&&<AlertBanner color={C.red} icon="!">{error}</AlertBanner>}
      <Input label="Nombre de la planta" value={name} onChange={setName} placeholder="Ej: Planta Norte — Cordoba" required/>
      <Input label="Direccion" value={address} onChange={setAddress} placeholder="Direccion o referencia"/>
      <Input label="Superficie (m2)" type="number" value={area} onChange={setArea} placeholder="Ej: 4200"/>
      <Select label="Tipo de membrana" value={membrane} onChange={setMembrane} options={['TPO','EPDM','PVC','Asfaltica']} required/>
      <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Grilla del Gemelo Digital</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Input label="Filas" type="number" value={rows} onChange={setRows}/>
          <Input label="Columnas" type="number" value={cols} onChange={setCols}/>
        </div>
        <div style={{fontSize:11,color:C.muted}}>Cada celda: 10m x 10m. Grilla {rows}x{cols} = {Number(rows)*10}m x {Number(cols)*10}m</div>
      </div>
      <Btn full onClick={create} disabled={saving}>{saving?'CREANDO...':'CREAR INSTALACION'}</Btn>
    </div>
  )
}

// ── Grid con imagen superpuesta ───────────────────────────────
function PlantGrid({selPlant,sectors,selCell,setSelCell,bgImage,gridOpacity}){
  const rows=selPlant?.grid_rows||10
  const cols=selPlant?.grid_cols||10
  const getSector=(r,c)=>sectors.find(s=>s.row_index===r&&s.col_index===c)

  return(
    <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14,overflowX:'auto'}}>
      <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10}}>
        MAPA DE SECTORES · {rows}x{cols} · 10m x 10m por celda
      </div>
      <div style={{position:'relative',display:'inline-block',minWidth:Math.max(cols*36+28,200)}}>
        {/* Imagen de fondo */}
        {bgImage&&(
          <div style={{position:'absolute',top:24,left:28,right:0,bottom:0,zIndex:0,borderRadius:4,overflow:'hidden'}}>
            <img src={bgImage} alt="plano" style={{width:'100%',height:'100%',objectFit:'cover',opacity:1-gridOpacity/100}}/>
          </div>
        )}
        {/* Grilla */}
        <div style={{position:'relative',zIndex:1}}>
          {/* Header cols */}
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
                const opacity=bgImage?gridOpacity/100:1
                return(
                  <div key={ci} onClick={()=>s&&setSelCell(s)} style={{aspectRatio:'1',background:color+'22',border:`1.5px solid ${selCell?.id===s?.id?C.amber:color+'55'}`,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s',minWidth:30,opacity}}>
                    <span className="mono" style={{fontSize:9,fontWeight:700,color}}>{rci}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Leyenda */}
      <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
        {[['EXCELENTE',C.green],['REGULAR',C.yellow],['POBRE',C.orange],['CRITICO',C.red]].map(([l,c])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:8,height:8,background:c+'44',border:`1.5px solid ${c}77`,borderRadius:2}}/>
            <span className="mono" style={{fontSize:8,color:C.muted}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pantalla principal Gemelo ─────────────────────────────────
export default function GemelScreen(){
  const {plantId}=useParams()
  const navigate=useNavigate()
  const {user}=useAuth()
  const [plants,setPlants]=useState([])
  const [selPlant,setSelPlant]=useState(null)
  const [sectors,setSectors]=useState([])
  const [selCell,setSelCell]=useState(null)
  const [loading,setLoading]=useState(true)
  const [showNew,setShowNew]=useState(false)
  const [bgImage,setBgImage]=useState(null)
  const [gridOpacity,setGridOpacity]=useState(70)
  const [showBgPanel,setShowBgPanel]=useState(false)
  const fileInputRef=useRef()

  useEffect(()=>{fetchPlants()},[])
  useEffect(()=>{if(selPlant){fetchSectors(selPlant.id);loadBgImage(selPlant.id)}},[selPlant])
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

  async function loadBgImage(pid){
    // Intentar cargar imagen del storage
    const {data}=await supabase.storage.from('plant-backgrounds').list(pid)
    if(data&&data.length>0){
      const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(`${pid}/${data[0].name}`)
      setBgImage(publicUrl)
    } else {
      setBgImage(null)
    }
  }

  async function uploadBgImage(file){
    if(!selPlant||!file)return
    const path=`${selPlant.id}/background.${file.name.split('.').pop()}`
    const {error}=await supabase.storage.from('plant-backgrounds').upload(path,file,{upsert:true})
    if(!error){
      const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(path)
      setBgImage(publicUrl)
      setShowBgPanel(false)
    }
  }

  async function removeBgImage(){
    if(!selPlant||!bgImage)return
    const path=bgImage.split('/').slice(-2).join('/')
    await supabase.storage.from('plant-backgrounds').remove([path])
    setBgImage(null)
    setShowBgPanel(false)
  }

  if(loading)return<Spinner/>
  if(showNew)return<NewPlantForm onCreated={(p)=>{setPlants(prev=>[p,...prev]);setSelPlant(p);fetchSectors(p.id);setShowNew(false)}} onCancel={()=>setShowNew(false)}/>

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>REPRESENTACION DIGITAL</div>
          <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Gemelo Digital</div>
        </div>
        <Btn small onClick={()=>setShowNew(true)}>+ PLANTA</Btn>
      </div>

      {plants.length===0?(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:32,marginBottom:12}}>🏗</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:16}}>No hay instalaciones</div>
          <Btn onClick={()=>setShowNew(true)}>+ CREAR PRIMERA PLANTA</Btn>
        </div>
      ):(
        <>
          {/* Selector de planta */}
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
                    {selPlant.area_m2?.toLocaleString()} m2 · {selPlant.membrane} · Grilla {selPlant.grid_rows||10}x{selPlant.grid_cols||10}
                  </div>
                </div>
                <button onClick={()=>navigate(`/inspeccion/nueva?plantId=${selPlant.id}`)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:6,padding:'8px 12px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>+ INSPECCION</button>
              </div>

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
                    <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.5}}>
                      Subi una foto aerea del techo o un plano. Puede ser una captura de Google Maps o un plano de planta.
                    </div>

                    {/* Upload */}
                    <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e=>{if(e.target.files[0])uploadBgImage(e.target.files[0])}}/>
                    <button onClick={()=>fileInputRef.current?.click()} style={{width:'100%',background:C.amber+'22',border:`1.5px dashed ${C.amber}`,borderRadius:8,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,color:C.amber,cursor:'pointer',marginBottom:10}}>
                      SUBIR IMAGEN / PLANO
                    </button>

                    {/* Preview */}
                    {bgImage&&(
                      <div style={{marginBottom:10}}>
                        <img src={bgImage} alt="plano" style={{width:'100%',borderRadius:8,border:`1px solid ${C.border}`,marginBottom:8}}/>
                        <button onClick={removeBgImage} style={{background:'none',border:`1px solid ${C.red}44`,borderRadius:6,padding:'6px 12px',color:C.red,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer',width:'100%'}}>
                          ELIMINAR IMAGEN
                        </button>
                      </div>
                    )}

                    {/* Control opacidad */}
                    {bgImage&&(
                      <div>
                        <div className="mono" style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:6}}>
                          Opacidad de la grilla: <span style={{color:C.amber}}>{gridOpacity}%</span>
                        </div>
                        <input type="range" min={20} max={100} value={gridOpacity} onChange={e=>setGridOpacity(Number(e.target.value))}
                          style={{width:'100%',accentColor:C.amber}}/>
                        <div style={{display:'flex',justifyContent:'space-between'}}>
                          <span className="mono" style={{fontSize:9,color:C.muted}}>Imagen visible</span>
                          <span className="mono" style={{fontSize:9,color:C.muted}}>Grilla visible</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grilla */}
              <PlantGrid
                selPlant={selPlant}
                sectors={sectors}
                selCell={selCell}
                setSelCell={setSelCell}
                bgImage={bgImage}
                gridOpacity={gridOpacity}
              />

              <div className="mono" style={{fontSize:10,color:C.muted,textAlign:'center'}}>
                TOCA UNA CELDA PARA EDITAR SU RCI Y NOTAS
              </div>
            </>
          )}
        </>
      )}

      {selCell&&<SectorModal sector={selCell} onClose={()=>setSelCell(null)} onSave={saveSector}/>}
    </div>
  )
}
