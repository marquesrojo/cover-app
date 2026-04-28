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
        <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>PORTAFOLIO — {new Date().toLocaleDateString('es-AR',{month:'long',year:'numeric'}).toUpperCase()}</div>
        <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Dashboard</div>
