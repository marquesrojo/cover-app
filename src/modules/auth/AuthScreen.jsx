import { useState } from 'react'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'
import { Btn, Input, AlertBanner } from '@/components/ui'

export default function AuthScreen(){
  const {signIn,signUp}=useAuth()
  const [mode,setMode]=useState('login')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [name,setName]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')

  const handle=async()=>{
    setError('');setSuccess('');setLoading(true)
    if(mode==='login'){
      const {error:e}=await signIn(email,password)
      if(e)setError(e.message==='Invalid login credentials'?'Email o contraseña incorrectos':e.message)
    } else {
      if(!name.trim()){setError('El nombre es obligatorio');setLoading(false);return}
      const {error:e}=await signUp(email,password,name)
      if(e)setError(e.message)
      else setSuccess('¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.')
    }
    setLoading(false)
  }

  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{fontFamily:'IBM Plex Mono',fontSize:36,fontWeight:700,color:C.amber,letterSpacing:'-0.04em',marginBottom:4}}>COVER</div>
        <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.2em'}}>GRUPO AISLAR · CUBIERTAS INDUSTRIALES</div>
      </div>
      <div style={{width:'100%',maxWidth:380,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
        <div style={{display:'flex',gap:0,marginBottom:24,background:C.surface2,borderRadius:8,padding:4}}>
          {[['login','Iniciar sesión'],['register','Registrarse']].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError('');setSuccess('')}} style={{flex:1,background:mode===m?C.amber:'transparent',color:mode===m?C.bg:C.muted,border:'none',borderRadius:6,padding:'8px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,transition:'all 0.2s'}}>{l}</button>
          ))}
        </div>
        {error&&<AlertBanner color={C.red} icon="✗">{error}</AlertBanner>}
        {success&&<AlertBanner color={C.green} icon="✓">{success}</AlertBanner>}
        {mode==='register'&&<Input label="Nombre completo" value={name} onChange={setName} placeholder="Juan García" required/>}
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" required/>
        <Input label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" required/>
        <Btn full onClick={handle} disabled={loading||!email||!password}>
          {loading?'...':(mode==='login'?'INGRESAR →':'CREAR CUENTA →')}
        </Btn>
      </div>
      <div className="mono" style={{fontSize:9,color:C.muted,marginTop:24,letterSpacing:'0.1em',textAlign:'center'}}>BETA v1.0 · {new Date().getFullYear()}</div>
    </div>
  )
}
