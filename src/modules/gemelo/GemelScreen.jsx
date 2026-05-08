import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C, rciColor, rciLabel } from '@/styles/tokens'
import { Badge, Spinner, Btn, Input, Select, AlertBanner } from '@/components/ui'

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

// ── Formulario nueva cubierta ─────────────────────────────────
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

  // Calcular grilla automáticamente
  const w=Number(widthM)||0
  const l=Number(lengthM)||0
  const cs=Number(cellSize)||10
  const cols=w>0?Math.ceil(w/cs):0
  const rows=l>0?Math.ceil(l/cs):0
  const areaM2=w>0&&l>0?w*l:0

  const create=async()=>{
    if(!name||!membrane){setError('Nombre y membrana son obligatorios');return}
    if(!widthM||!lengthM){setError('Ancho y largo son obligatorios');return}
    if(cols===0||rows===0){setError('Ancho y largo deben ser mayores a 0');return}
    setSaving(true);setError('')
    const {data:plant,error:e}=await supabase.from('plants').insert({
      name,address,
      width_m:w,length_m:l,
      area_m2:areaM2,
      membrane,
      grid_rows:rows,grid_cols:cols,
      cell_size_m:cs,
      created_by:user.id
    }).select().single()
    if(e){setError(e.message);setSaving(false);return}
    // Crear sectores vacíos
    const sectors=[]
    for(let r=0;r<rows;r++)
      for(let c=0;c<cols;c++)
        sectors.push({plant_id:plant.id,row_index:r,col_index:c,rci:100})
    await supabase.from('sectors').insert(sectors)
    setSaving(false)
    onCreated(plant)
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

        {/* Preview calculado */}
        {areaM2>0&&(
          <div style={{background:C.bg,borderRadius:6,padding:12,marginTop:10}}>
            <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:8}}>Resumen calculado</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                ['Superficie',`${areaM2.toLocaleString()} m2`],
                ['Grilla',`${rows} x ${cols}`],
                ['Total sectores',`${rows*cols}`],
                ['Celda',`${cellSize}m x ${cellSize}m`],
              ].map(([k,v])=>(
                <div key={k}>
                  <div className="mono" style={{fontSize:8,color:C.muted,textTransform:'uppercase'}}>{k}</div>
                  <div className="mono" style={{fontSize:13,fontWeight:700,color:C.amber,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Preview visual proporcional de la grilla */}
            <div style={{marginTop:12}}>
              <div className="mono" style={{fontSize:8,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Vista previa proporcional</div>
              <div style={{
                display:'grid',
                gridTemplateColumns:`repeat(${Math.min(cols,20)},1fr)`,
                gap:2,
                maxWidth:'100%',
                aspectRatio:`${cols}/${rows}`,
                maxHeight:120,
              }}>
                {Array.from({length:Math.min(rows,10)*Math.min(cols,20)},(_,i)=>(
                  <div key={i} style={{background:C.green+'22',border:`1px solid ${C.green}44`,borderRadius:1}}/>
                ))}
              </div>
              {(rows>10||cols>20)&&<div className="mono" style={{fontSize:8,color:C.muted,marginTop:4}}>Vista simplificada — grilla completa: {rows}x{cols}</div>}
            </div>
          </div>
        )}
      </div>

      <Btn full onClick={create} disabled={saving||!name||!membrane||!widthM||!lengthM}>
        {saving?'CREANDO...':'CREAR CUBIERTA'}
      </Btn>
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
        MAPA DE SECTORES · {rows}x{cols} · {selPlant?.cell_size_m||10}m x {selPlant?.cell_size_m||10}m por celda
      </div>
      <div style={{position:'relative',display:'inline-block',minWidth:Math.max(cols*36+28,200)}}>
        {/* Imagen de fondo */}
        {bgImage&&(
          <div style={{
            position:'absolute',
            top:24,left:28,right:0,bottom:0,
            zIndex:0,borderRadius:4,overflow:'hidden',
            aspectRatio:`${cols}/${rows}`
          }}>
            <img src={bgImage} alt="plano" style={{width:'100%',height:'100%',objectFit:'cover',opacity:1-gridOpacity/100}}/>
          </div>
        )}
        {/* Grilla */}
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
                const cellOpacity=bgImage?gridOpacity/100:1
                return(
                  <div key={ci} onClick={()=>s&&setSelCell(s)} style={{
                    aspectRatio:'1',
                    background:color+'22',
                    border:`1.5px solid ${selCell?.id===s?.id?C.amber:color+'55'}`,
                    borderRadius:3,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    cursor:'pointer',transition:'all 0.15s',
                    minWidth:30,
                    opacity:cellOpacity
                  }}>
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
    try{
      const {data}=await supabase.storage.from('plant-backgrounds').list(pid)
      if(data&&data.length>0){
        const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(`${pid}/${data[0].name}`)
        setBgImage(publicUrl)
      } else {
        setBgImage(null)
      }
    }catch(e){setBgImage(null)}
  }

  async function uploadBgImage(file){
    if(!selPlant||!file)return
    const ext=file.name.split('.').pop()
    const path=`${selPlant.id}/background.${ext}`
    const {error}=await supabase.storage.from('plant-backgrounds').upload(path,file,{upsert:true})
    if(!error){
      const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(path)
      setBgImage(publicUrl)
      setShowBgPanel(false)
    }
  }

  async function removeBgImage(){
    if(!selPlant||!bgImage)return
    const parts=bgImage.split('/')
    const path=`${parts[parts.length-2]}/${parts[parts.length-1]}`
    await supabase.storage.from('plant-backgrounds').remove([path])
    setBgImage(null)
    setShowBgPanel(false)
  }

  if(loading)return<Spinner/>
  if(showNew)return<NewCubiertaForm onCreated={(p)=>{setPlants(prev=>[p,...prev]);setSelPlant(p);fetchSectors(p.id);setShowNew(false)}} onCancel={()=>setShowNew(false)}/>

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>REPRESENTACION DIGITAL</div>
          <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Gemelo Digital</div>
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
          {/* Selector de cubierta */}
          <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:14,paddingBottom:4}}>
            {plants.map(p=>(
              <button key={p.id} onClick={()=>setSelPlant(p)} style={{background:selPlant?.id===p.id?C.amberDim:C.surface2,border:`1px solid ${selPlant?.id===p.id?C.amber:C.border}`,borderRadius:6,padding:'6px 12px',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                <span className="mono" style={{fontSize:9,color:selPlant?.id===p.id?C.amber:C.mutedLight,letterSpacing:'0.08em'}}>{p.name.split('—')[0].trim()}</span>
              </button>
            ))}
          </div>

          {selPlant&&(
            <>
              {/* Info cubierta */}
              <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{selPlant.name}</div>
                  <div className="mono" style={{fontSize:10,color:C.muted,marginTop:2}}>
                    {selPlant.width_m&&selPlant.length_m
                      ?`${selPlant.width_m}m x ${selPlant.length_m}m · ${selPlant.area_m2?.toLocaleString()} m2`
                      :`${selPlant.area_m2?.toLocaleString()} m2`
                    } · {selPlant.membrane} · Grilla {selPlant.grid_rows}x{selPlant.grid_cols}
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
                      Subi una foto aerea o captura de Google Maps del techo. La imagen se superpone debajo de la grilla.
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e=>{if(e.target.files[0])uploadBgImage(e.target.files[0])}}/>
                    <button onClick={()=>fileInputRef.current?.click()} style={{width:'100%',background:C.amber+'22',border:`1.5px dashed ${C.amber}`,borderRadius:8,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,color:C.amber,cursor:'pointer',marginBottom:10}}>
                      SUBIR IMAGEN / PLANO
                    </button>
                    {bgImage&&(
                      <div style={{marginBottom:10}}>
                        <img src={bgImage} alt="plano" style={{width:'100%',borderRadius:8,border:`1px solid ${C.border}`,marginBottom:8}}/>
                        <button onClick={removeBgImage} style={{background:'none',border:`1px solid ${C.red}44`,borderRadius:6,padding:'6px 12px',color:C.red,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer',width:'100%'}}>
                          ELIMINAR IMAGEN
                        </button>
                      </div>
                    )}
                    {bgImage&&(
                      <div>
                        <div className="mono" style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:6}}>
                          Opacidad de la grilla: <span style={{color:C.amber}}>{gridOpacity}%</span>
                        </div>
                        <input type="range" min={20} max={100} value={gridOpacity} onChange={e=>setGridOpacity(Number(e.target.value))} style={{width:'100%',accentColor:C.amber}}/>
                        <div style={{display:'flex',justifyContent:'space-between'}}>
                          <span className="mono" style={{fontSize:9,color:C.muted}}>Ver imagen</span>
                          <span className="mono" style={{fontSize:9,color:C.muted}}>Ver grilla</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grilla */}
              <PlantGrid selPlant={selPlant} sectors={sectors} selCell={selCell} setSelCell={setSelCell} bgImage={bgImage} gridOpacity={gridOpacity}/>

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
