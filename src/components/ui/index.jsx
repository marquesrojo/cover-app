import { C, rciColor } from '@/styles/tokens'

export const Badge = ({color,children,small})=>(
  <span className="mono" style={{background:color+'22',color,border:`1px solid ${color}44`,borderRadius:3,padding:small?'1px 6px':'3px 8px',fontSize:small?9:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{children}</span>
)

export const RciGauge = ({value,size=80})=>{
  const r=(size/2)-8,circ=2*Math.PI*r,color=rciColor(value)
  return(
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ*(1-value/100)} strokeLinecap="round"
        style={{transition:'stroke-dashoffset 1s ease'}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}
        fill={color} fontFamily="IBM Plex Mono" fontWeight="700" fontSize={size>70?18:13}>{value}</text>
    </svg>
  )
}

export const Toggle = ({label,value,onChange,sub})=>(
  <div onClick={()=>onChange(!value)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${C.border}`,cursor:'pointer',minHeight:44,gap:12}}>
    <div style={{flex:1}}>
      <div style={{fontSize:13,color:value?C.text:C.mutedLight}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}
    </div>
    <div style={{width:42,height:24,borderRadius:12,background:value?C.green+'33':C.border,border:`1.5px solid ${value?C.green:C.border}`,position:'relative',transition:'all 0.2s',flexShrink:0}}>
      <div style={{width:18,height:18,borderRadius:9,background:value?C.green:C.muted,position:'absolute',top:2,left:value?20:2,transition:'all 0.2s'}}/>
    </div>
  </div>
)

export const SeverityChips = ({value,onChange})=>{
  const levels=[{l:'Sin daño',c:C.green},{l:'Leve',c:C.yellow},{l:'Moderado',c:C.orange},{l:'Severo',c:C.red}]
  return(
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {levels.map(({l,c})=>(
        <button key={l} onClick={()=>onChange(l)} style={{background:value===l?c+'33':C.surface2,border:`1.5px solid ${value===l?c:C.border}`,borderRadius:6,padding:'8px 12px',color:value===l?c:C.muted,fontSize:12,minHeight:44,transition:'all 0.15s'}}>{l}</button>
