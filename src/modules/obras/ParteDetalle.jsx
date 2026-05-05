import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
import { C } from '@/styles/tokens'
import { Spinner, Badge } from '@/components/ui'

const WEATHER_LABEL={'Soleado':'Sol','Nublado':'Nublado','Lluvia':'Lluvia','Viento fuerte':'Viento fuerte'}

export default function ParteDetalle(){
  const {id}=useParams()
  const navigate=useNavigate()
  const [parte,setParte]=useState(null)
  const [obra,setObra]=useState(null)
  const [fotos,setFotos]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    async function load(){
      const {data:p}=await supabase.from('obra_partes').select('*, profiles(full_name)').eq('id',id).single()
      if(!p){setLoading(false);return}
      setParte(p)
      const [{data:o},{data:f}]=await Promise.all([
        supabase.from('obras').select('*, plants(name)').eq('id',p.obra_id).single(),
        supabase.from('obra_fotos').select('*').eq('parte_id',id).order('uploaded_at'),
      ])
      setObra(o)
      setFotos(f||[])
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
  const whatsappText=encodeURIComponent(`Parte diario de obra — ${obra?.title || ''}\nPlanta: ${obra?.plants?.name || ''}\nFecha: ${parte.date}\nAvance: ${parte.progress_pct}%\n\nVer detalle: ${url}`)
  const whatsappUrl=`https://wa.me/?text=${whatsappText}`

  return(
    <div style={{background:C.bg,minHeight:'100vh'}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:'IBM Plex Mono',fontSize:18,fontWeight:700,color:C.amber,letterSpacing:'-0.04em'}}>COVER</span>
          <div style={{width:1,height:16,background:C.border}}/>
          <span className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.1em'}}>PARTE DIARIO</span>
        </div>
        {/* Botón WhatsApp */}
        <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{background:'#25D366',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:14}}>💬</span> COMPARTIR
        </a>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'16px 16px 40px'}}>
        {/* Info obra */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>OBRA</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:2}}>{obra?.title||'—'}</div>
          <div style={{fontSize:12,color:C.muted}}>{obra?.plants?.name||'—'}</div>
        </div>

        {/* Datos del parte */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
          <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>PARTE DIARIO</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {[
              ['Fecha',parte.date],
              ['Avance',`${parte.progress_pct}%`],
              ['Operarios',`${parte.workers_count}`],
              ['Horas',`${parte.hours_worked}hs`],
              ['Clima',WEATHER_LABEL[parte.weather]||parte.weather||'—'],
              ['Responsable',parte.profiles?.full_name||'—'],
            ].map(([k,v])=>(
              <div key={k}>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:3}}>{k}</div>
                <div style={{fontSize:13,fontWeight:600,color:k==='Avance'?C.amber:C.text}}>{v}</div>
              </div>
            ))}
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

          {/* Notas */}
          {parte.notes&&(
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Notas</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.6,background:C.surface2,borderRadius:6,padding:10}}>{parte.notes}</div>
            </div>
          )}
        </div>

        {/* Fotos */}
        {fotos.length>0&&(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
            <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>FOTOS ({fotos.length})</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {fotos.map(f=>(
                <div key={f.id}>
                  <img src={f.public_url} alt="" style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:8,border:`1px solid ${C.border}`}}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón WhatsApp grande */}
        <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'#25D366',color:'#fff',borderRadius:10,padding:'14px',fontFamily:'IBM Plex Mono',fontSize:12,fontWeight:700,letterSpacing:'0.08em',textDecoration:'none',marginBottom:12}}>
          <span style={{fontSize:18}}>💬</span> COMPARTIR POR WHATSAPP
        </a>

        {/* Link para copiar */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:12,textAlign:'center'}}>
          <div className="mono" style={{fontSize:9,color:C.muted,marginBottom:6}}>O COMPARTIR ESTE LINK</div>
          <div className="mono" style={{fontSize:10,color:C.amber,wordBreak:'break-all',background:C.surface2,padding:'8px 10px',borderRadius:6,cursor:'pointer'}}
            onClick={()=>{navigator.clipboard?.writeText(url);alert('Link copiado!')}}>
            {url}
          </div>
        </div>

        {/* Pie */}
        <div style={{textAlign:'center',marginTop:20}}>
          <div className="mono" style={{fontSize:9,color:C.muted}}>COVER · GRUPO AISLAR · Gestion de Cubiertas Industriales</div>
        </div>
      </div>
    </div>
  )
}
