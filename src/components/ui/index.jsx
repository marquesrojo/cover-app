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
      ))}
    </div>
  )
}

export const Btn = ({children,onClick,color,disabled,full,outline,small})=>(
  <button onClick={onClick} disabled={disabled} style={{
    background:outline?'transparent':(disabled?C.border:color||C.amber),
    color:outline?(color||C.amber):(disabled?C.muted:C.bg),
    border:outline?`1.5px solid ${color||C.amber}`:'none',
    borderRadius:10,padding:small?'8px 14px':'14px 20px',
    fontFamily:'IBM Plex Mono',fontSize:small?11:12,fontWeight:700,letterSpacing:'0.08em',
    width:full?'100%':'auto',transition:'all 0.2s',minHeight:small?36:44,
    opacity:disabled?0.5:1,cursor:disabled?'not-allowed':'pointer'
  }}>{children}</button>
)

export const Input = ({label,value,onChange,placeholder,type='text',required})=>(
  <div style={{marginBottom:14}}>
    {label&&<div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{label}{required&&<span style={{color:C.red}}> *</span>}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:'100%',background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',color:C.text,fontSize:13,outline:'none',transition:'border-color 0.2s'}}
      onFocus={e=>e.target.style.borderColor=C.amber}
      onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
)

export const TextArea = ({label,value,onChange,placeholder,rows=4})=>(
  <div style={{marginBottom:14}}>
    {label&&<div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{label}</div>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:'100%',background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',color:C.text,fontSize:13,outline:'none',resize:'vertical',transition:'border-color 0.2s'}}
      onFocus={e=>e.target.style.borderColor=C.amber}
      onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
)

export const Select = ({label,value,onChange,options,required})=>(
  <div style={{marginBottom:14}}>
    {label&&<div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{label}{required&&<span style={{color:C.red}}> *</span>}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 14px',color:value?C.text:C.muted,fontSize:13,outline:'none',appearance:'none'}}>
      <option value="">Seleccioná...</option>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
)

export const Spinner = ()=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:40}}>
    <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.amber}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
  </div>
)

export const AlertBanner = ({color,icon,children})=>(
  <div style={{background:color+'11',border:`1px solid ${color}33`,borderRadius:6,padding:'8px 12px',display:'flex',gap:8,alignItems:'flex-start',marginBottom:14}}>
    {icon&&<span style={{color,fontSize:14,flexShrink:0}}>{icon}</span>}
    <span style={{fontSize:11,color,lineHeight:1.5}}>{children}</span>
  </div>
)

export const PhotoUpload = ({label,value,onChange})=>{
  const handleFile=async(e)=>{
    const file=e.target.files[0]
    if(!file)return
    const blobUrl=URL.createObjectURL(file)
    let lat=null,lng=null
    try{
      const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000}))
      lat=pos.coords.latitude;lng=pos.coords.longitude
    }catch{}
    onChange({file,blobUrl,lat,lng,timestamp:new Date().toISOString()})
  }
  return(
    <div style={{marginBottom:14}}>
      {label&&<div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{label}</div>}
      <label style={{display:'flex',alignItems:'center',gap:12,background:C.surface2,border:`1.5px dashed ${value?C.green:C.border}`,borderRadius:8,padding:14,cursor:'pointer',minHeight:64,transition:'all 0.15s'}}>
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:'none'}}/>
        {value?(
          <>
            <img src={value.blobUrl} alt="" style={{width:56,height:56,objectFit:'cover',borderRadius:6}}/>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.green}}>✓ Foto capturada</div>
              <div className="mono" style={{fontSize:9,color:C.muted,marginTop:2}}>
                {value.timestamp?.slice(0,16).replace('T',' ')}
                {value.lat?' · GPS ✓':' · Sin GPS'}
              </div>
            </div>
          </>
        ):(
          <>
            <span style={{fontSize:24}}>📷</span>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>Tomar foto</div>
              <div className="mono" style={{fontSize:9,color:C.muted,marginTop:2}}>Toca para abrir cámara</div>
            </div>
          </>
        )}
      </label>
    </div>
  )
}
