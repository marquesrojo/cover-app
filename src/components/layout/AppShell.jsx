import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'

const TABS=[
  {path:'/dashboard',icon:'▦',label:'DASHBOARD'},
  {path:'/gemelo',   icon:'◫',label:'GEMELO'},
  {path:'/inspeccion/lista',icon:'✓',label:'INSPECCIÓN'},
  {path:'/tickets',  icon:'◈',label:'TICKETS'},
]

function Header(){
  const {profile,signOut}=useAuth()
  return(
    <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontFamily:'IBM Plex Mono',fontSize:18,fontWeight:700,color:C.amber,letterSpacing:'-0.04em'}}>COVER</span>
        <div style={{width:1,height:16,background:C.border}}/>
        <span className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.1em'}}>GRUPO AISLAR</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {profile&&<span style={{fontSize:12,color:C.mutedLight}}>{profile.full_name?.split(' ')[0]}</span>}
        <button onClick={signOut} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'5px 10px',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.08em'}}>SALIR</button>
      </div>
    </header>
  )
}

function NavBar(){
  const navigate=useNavigate()
  const {pathname}=useLocation()
  return(
    <nav style={{position:'fixed',bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:'flex',zIndex:200,maxWidth:480,margin:'0 auto'}}>
      {TABS.map(t=>{
        const on=pathname.startsWith(t.path)
        return(
          <button key={t.path} onClick={()=>navigate(t.path)} style={{flex:1,background:'none',border:'none',borderBottom:on?`2px solid ${C.amber}`:'2px solid transparent',padding:'10px 4px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,minHeight:56}}>
            <span style={{fontSize:18,color:on?C.amber:C.muted}}>{t.icon}</span>
            <span className="mono" style={{fontSize:8,letterSpacing:'0.1em',color:on?C.amber:C.muted,fontWeight:700}}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default function AppShell(){
  return(
    <div style={{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:C.bg}}>
      <Header/>
      <main style={{paddingBottom:64}}><Outlet/></main>
      <NavBar/>
    </div>
  )
}
