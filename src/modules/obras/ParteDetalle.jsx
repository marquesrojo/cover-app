import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

import { C } from '@/styles/tokens'
import { Spinner } from '@/components/ui'

const WEATHER_LABEL={'Soleado':'Soleado','Nublado':'Nublado','Lluvia':'Lluvia','Viento fuerte':'Viento fuerte'}

function rciColorPdf(rci){
  if(rci>=70) return {bg:'#16a34a22',border:'#16a34a',text:'#16a34a'}
  if(rci>=50) return {bg:'#ca8a0422',border:'#ca8a04',text:'#ca8a04'}
  if(rci>=30) return {bg:'#ea580c22',border:'#ea580c',text:'#ea580c'}
  return {bg:'#dc262622',border:'#dc2626',text:'#dc2626'}
}

function MapaSectores({ plant, sectors, bgImage }){
  const rows = plant.grid_rows || 0
  const cols = plant.grid_cols || 0
  if(!rows || !cols) return null
  const getSector = (r,c) => sectors.find(s => s.row_index===r && s.col_index===c)
  const cellSize = Math.min(32, Math.floor(340 / (cols + 1)))
  const rciValues = sectors.map(s => s.rci ?? 100)
  const rciPromedio = rciValues.length > 0 ? Math.round(rciValues.reduce((a,b)=>a+b,0)/rciValues.length) : 100
  const promedioColor = rciColorPdf(rciPromedio)

  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
      <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>ESTADO DE LA CUBIERTA</div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <div style={{background:promedioColor.bg,border:`1px solid ${promedioColor.border}`,borderRadius:8,padding:'8px 16px',textAlign:'center'}}>
          <div style={{fontFamily:'IBM Plex Mono',fontSize:24,fontWeight:700,color:promedioColor.text}}>{rciPromedio}</div>
          <div style={{fontFamily:'IBM Plex Mono',fontSize:8,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>RCI Promedio</div>
        </div>
        <div style={{fontSize:11,color:C.muted}}>
          <div><span style={{color:C.text,fontWeight:600}}>{rows} × {cols}</span> sectores</div>
          <div style={{marginTop:2}}>{plant.cell_size_m || '—'}m por celda</div>
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <div style={{display:'inline-block',minWidth:(cols+1)*cellSize+8,position:'relative'}}>
          {bgImage&&(
            <img src={bgImage} alt="" style={{position:'absolute',top:20,left:cellSize+2,right:0,bottom:2,width:`calc(100% - ${cellSize+2}px)`,height:`calc(100% - 22px)`,objectFit:'cover',opacity:0.5,pointerEvents:'none',borderRadius:2}}/>
          )}
          <div style={{display:'grid',gridTemplateColumns:`${cellSize}px repeat(${cols},${cellSize}px)`,gap:2,marginBottom:2}}>
            <div/>
            {Array.from({length:cols},(_,i)=>(
              <div key={i} style={{textAlign:'center',fontFamily:'IBM Plex Mono',fontSize:7,color:C.muted}}>{i+1}</div>
            ))}
          </div>
          {Array.from({length:rows},(_,ri)=>(
            <div key={ri} style={{display:'grid',gridTemplateColumns:`${cellSize}px repeat(${cols},${cellSize}px)`,gap:2,marginBottom:2}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'IBM Plex Mono',fontSize:7,color:C.muted}}>
                {String.fromCharCode(65+ri)}
              </div>
              {Array.from({length:cols},(_,ci)=>{
                const s = getSector(ri,ci)
                const rci = s?.rci ?? 100
                const {bg,border,text} = rciColorPdf(rci)
                return(
                  <div key={ci} style={{width:cellSize,height:cellSize,background:bg,border:`1px solid ${border}`,borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontFamily:'IBM Plex Mono',fontSize:cellSize>24?8:7,fontWeight:700,color:text}}>{rci}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
        {[['EXC','#16a34a'],['REG','#ca8a04'],['POBRE','#ea580c'],['CRÍT','#dc2626']].map(([l,c])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:10,height:10,background:c+'22',border:`1.5px solid ${c}`,borderRadius:2}}/>
            <span style={{fontFamily:'IBM Plex Mono',fontSize:8,color:C.muted}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ParteDetalle(){
  const {id}=useParams()
  const [parte,setParte]=useState(null)
  const [obra,setObra]=useState(null)
  const [fotos,setFotos]=useState([])
  const [sectors,setSectors]=useState([])
  const [plant,setPlant]=useState(null)
  const [bgImage,setBgImage]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    async function load(){
      const {data:p,error:pe}=await supabase.from('obra_partes').select('*').eq('id',id).single()
      if(pe||!p){setLoading(false);return}
      setParte(p)
      const [{data:o},{data:f}]=await Promise.all([
        supabase.from('obras').select('title, plant_id, plants(id, name, grid_rows, grid_cols, cell_size_m, area_m2)').eq('id',p.obra_id).single(),
        supabase.from('obra_fotos').select('public_url').eq('parte_id',id).order('uploaded_at'),
      ])
      setObra(o)
      setFotos(f||[])
      if(o?.plants?.id){
        const plantId = o.plants.id
        setPlant(o.plants)
        const {data:sec}=await supabase.from('sectors').select('row_index,col_index,rci').eq('plant_id',plantId)
        setSectors(sec||[])
        const {data:files}=await supabase.storage.from('plant-backgrounds').list(plantId)
        if(files?.length>0){
          const {data:{publicUrl}}=supabase.storage.from('plant-backgrounds').getPublicUrl(`${plantId}/${files[0].name}`)
          setBgImage(publicUrl)
        }
      }
      setLoading(false)
    }
    load()
  },[id])

  if(loading)return<Spinner/>

  if(!parte)return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:'IBM Plex Mono',fontSize:20,fontWeight:700,color:C.amber,marginBottom:8}}>COVER</div>
        <div style={{color:C.muted}}>Parte diario no encontrado</div>
      </div>
    </div>
  )

  const url=window.location.href
  const shareTitle='Parte Diario de Obra'
  const shareText=`Parte diario\nObra: ${obra?.title||''}\nPlanta: ${obra?.plants?.name||''}\nFecha: ${parte.date}\nAvance: ${parte.progress_pct}%`
  const whatsappUrl=`https://wa.me/?text=${encodeURIComponent(shareText+'\n\nVer detalle: '+url)}`

  const handleShare=async()=>{
    if(navigator.share){
      try{ await navigator.share({title:shareTitle,text:shareText,url}) }catch(e){}
    } else {
      window.open(whatsappUrl,'_blank')
    }
  }

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:'IBM Plex Mono',fontSize:18,fontWeight:700,color:C.amber,letterSpacing:'-0.04em'}}>COVER</span>
          <div style={{width:1,height:16,background:C.border}}/>
          <span className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.1em'}}>PARTE DIARIO</span>
        </div>
        <button onClick={handleShare} style={{background:'#25D366',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,cursor:'pointer'}}>
          COMPARTIR
        </button>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'16px 16px 40px'}}>

        {/* Info obra */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>OBRA</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:2}}>{obra?.title||'—'}</div>
          <div style={{fontSize:12,color:C.muted}}>{obra?.plants?.name||'—'}</div>
        </div>

        {/* Mapa de sectores */}
        {plant&&plant.grid_rows>0&&(
          <MapaSectores plant={plant} sectors={sectors} bgImage={bgImage}/>
        )}

        {/* Datos estructurados del parte */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>DATOS DEL DIA</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Fecha</div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{parte.date}</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Avance</div>
              <div style={{fontSize:13,fontWeight:600,color:C.amber}}>{parte.progress_pct}%</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Operarios</div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{parte.workers_count}</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Horas</div>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{parte.hours_worked}hs</div>
            </div>
            {parte.hora_inicio&&(
              <div>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Hora inicio</div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{parte.hora_inicio}</div>
              </div>
            )}
            {parte.hora_fin&&(
              <div>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Hora fin</div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{parte.hora_fin}</div>
              </div>
            )}
            {parte.weather&&(
              <div>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Clima</div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{WEATHER_LABEL[parte.weather]||parte.weather}</div>
              </div>
            )}
            {parte.responsable&&(
              <div>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>Responsable</div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{parte.responsable}</div>
              </div>
            )}
          </div>

          {/* Barra de avance */}
          <div style={{marginBottom:12}}>
            <div style={{height:8,background:C.border,borderRadius:4}}>
              <div style={{height:'100%',width:`${parte.progress_pct}%`,background:`linear-gradient(90deg,${C.amber},${C.green})`,borderRadius:4}}/>
            </div>
          </div>

          {/* Tipos de trabajo */}
          {parte.work_types?.length>0&&(
            <div style={{marginBottom:12}}>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Trabajos realizados</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {parte.work_types.map(t=>(
                  <span key={t} style={{background:C.amber+'22',color:C.amber,border:`1px solid ${C.amber}44`,borderRadius:4,padding:'4px 8px',fontSize:11,fontFamily:'IBM Plex Mono'}}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones (campo nuevo) */}
          {parte.observaciones&&(
            <div style={{marginBottom: parte.notes ? 12 : 0}}>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Observaciones</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7,background:C.surface2,borderRadius:6,padding:10}}>{parte.observaciones}</div>
            </div>
          )}

          {/* Notas legacy — partes viejos */}
          {parte.notes&&!parte.observaciones&&(
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Observaciones</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7,background:C.surface2,borderRadius:6,padding:10}}>{parte.notes}</div>
            </div>
          )}
        </div>

        {/* Fotos */}
        {fotos.length>0&&(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
            <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>FOTOS ({fotos.length})</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {fotos.map((f,i)=>(
                <img key={i} src={f.public_url} alt="" style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:8,border:`1px solid ${C.border}`}}/>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleShare} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'#25D366',color:'#fff',borderRadius:10,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:12,fontWeight:700,letterSpacing:'0.08em',border:'none',width:'100%',marginBottom:12,cursor:'pointer'}}>
          COMPARTIR POR WHATSAPP
        </button>

        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:12,textAlign:'center'}}>
          <div className="mono" style={{fontSize:9,color:C.muted,marginBottom:6}}>O COPIA ESTE LINK</div>
          <div className="mono" style={{fontSize:10,color:C.amber,wordBreak:'break-all',background:C.surface2,padding:'8px 10px',borderRadius:6,cursor:'pointer'}}
            onClick={()=>{navigator.clipboard?.writeText(url);alert('Link copiado!')}}>
            {url}
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:20}}>
          <div className="mono" style={{fontSize:9,color:C.muted}}>COVER · GRUPO AISLAR · Gestion de Cubiertas Industriales</div>
        </div>
      </div>
    </div>
  )
}
