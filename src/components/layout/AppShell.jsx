function Header(){
  const {profile,signOut}=useAuth()
  const orgName=profile?.organizations?.name||'COVER'
  return(
    <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontFamily:'IBM Plex Mono',fontSize:18,fontWeight:700,color:C.amber,letterSpacing:'-0.04em'}}>COVER</span>
        <div style={{width:1,height:16,background:C.border}}/>
        <span className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>{orgName}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {(profile?.role==='cover_admin'||profile?.role==='admin')&&(
          <a href="/admin" style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:6,padding:'5px 8px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:9,textDecoration:'none',letterSpacing:'0.06em'}}>⚙️ ADMIN</a>
        )}
        {profile&&<span style={{fontSize:12,color:C.mutedLight}}>{profile.full_name?.split(' ')[0]}</span>}
        <button onClick={signOut} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'5px 10px',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.08em'}}>SALIR</button>
      </div>
    </header>
  )
}
