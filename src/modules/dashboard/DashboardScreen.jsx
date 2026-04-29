import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/db/supabase'
import { C, rciColor, rciLabel } from '@/styles/tokens'
import { Badge, RciGauge, Spinner } from '@/components/ui'

function KPICard({label,value,unit,color,sub}){
  return(
    <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'14px 12px'}}>
      <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
        <span className="mono" style={{fontSize:24,fontWeight:700,color:color||C.text,lineHeight:1}}>{value}</span>
        {unit&&<span className="mono" style={{fontSize:11,color:C.muted}}>{unit}</span>}
      </div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  )
}

function DistBar({label,count,total,color}){
  const pct=total>0?(count/total)*100:0
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span className="mono" style={{fontSize:10,color:C.mutedLight}}>{label}</span>
        <span className="mono" style={{fontSize:10,color,fontWeight:700}}>{count}</span>
      </div>
      <div style={{height:6,background:C.border,borderRadius:3}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 0.8s ease'}}/>
      </div>
    </div>
  )
}

export default function DashboardScreen(){
  const navigate=useNavigate()
  const [plants,setPlants]=useState([])
  const [tickets,setTickets]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    setLoading(true)
    const [{data:p},{data:t}]=await Promise.all([
      supabase.from('plants').select('*, sectors(rci)').order('created_at',{ascending:false}),
      supabase.from('tickets').select('*').neq('status','resuelto')
    ])
    const plantsWithRci=(p||[]).map(pl=>{
      const rcis=(pl.sectors||[]).map(s=>s.rci).filter(r=>r!=null)
      const avg=rcis.length?Math.round(rcis.reduce((a,b)=>a+b,0)/rcis.length):100
      return{...pl,rciAvg:avg}
    })
    setPlants(plantsWithRci)
    setTickets(t||[])
    setLoading(false)
  }

  if(loading)return<Spinner/>

  const avgRci=plants.length?Math.round(plants.reduce((s,p)=>s+p.rciAvg,0)/plants.length):0
  const criticals=tickets.filter(t=>t.severity==='critico').length
  const dist={
    excelente:plants.filter(p=>p.rciAvg>=70).length,
    regular:plants.filter(p=>p.rciAvg>=50&&p.rciAvg<70).length,
    pobre:plants.filter(p=>p.rciAvg>=30&&p.rciAvg<50).length,
    critico:plants.filter(p=>p.rciAvg<30).length,
  }

  return(
    <div style={{padding:'16px 16px 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{marginBottom:16}}>
        <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>PORTAFOLIO</div>
        <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Dashboard</div>
      </div>
      {plants.length===0?(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:32,marginBottom:12}}>🏭</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:16}}>No hay instalaciones cargadas</div>
          <button onClick={()=>navigate('/gemelo')} style={{background:C.amber,color:C.bg,border:'none',borderRadius:8,padding:'12px 20px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700}}>+ CREAR PRIMERA PLANTA</button>
        </div>
      ):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <KPICard label="RCI Promedio" value={avgRci} color={rciColor(avgRci)} sub={rciLabel(avgRci)}/>
            <KPICard label="Plantas" value={plants.length} color={C.blue} sub="en portafolio"/>
            <KPICard label="Alertas Activas" value={tickets.length} color={criticals>0?C.red:C.amber} sub={criticals>0?`${criticals} críticos`:'Sin críticos'}/>
            <KPICard label="Inspecciones" value="—" color={C.muted} sub="este mes"/>
          </div>
          <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:16}}>
            <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Distribución por RCI</div>
            <DistBar label="EXCELENTE  70–100" count={dist.excelente} total={plants.length} color={C.green}/>
            <DistBar label="REGULAR    50–69" count={dist.regular} total={plants.length} color={C.yellow}/>
            <DistBar label="POBRE      30–49" count={dist.pobre} total={plants.length} color={C.orange}/>
            <DistBar label="CRÍTICO     0–29" count={dist.critico} total={plants.length} color={C.red}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase'}}>Instalaciones ({plants.length})</div>
            <button onClick={fetchData} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:10}}>↻ ACTUALIZAR</button>
          </div>
          {plants.map((p,i)=>(
            <div key={p.id} onClick={()=>navigate(`/gemelo/${p.id}`)} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',marginBottom:8,cursor:'pointer',display:'flex',alignItems:'center',gap:12,animation:`fadeIn ${0.3+i*0.08}s ease`,transition:'border-color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.amber+'55'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <RciGauge value={p.rciAvg} size={52}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  <Badge color={rciColor(p.rciAvg)} small>{rciLabel(p.rciAvg)}</Badge>
                  {p.area_m2&&<span className="mono" style={{fontSize:9,color:C.muted}}>{p.area_m2.toLocaleString()} m²</span>}
                  {p.membrane&&<span className="mono" style={{fontSize:9,color:C.muted}}>{p.membrane}</span>}
                </div>
              </div>
              <span style={{color:C.muted,fontSize:16}}>›</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
