import { useState } from 'react'
import { useAuth } from '@/store/AuthContext'
import { supabase } from '@/db/supabase'
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
    } else if(mode==='register'){
      if(!name.trim()){setError('El nombre es obligatorio');setLoading(false);return}
      const {error:e}=await signUp(email,password,name)
      if(e)setError(e.message)
      else setSuccess('Cuenta creada. El administrador revisara tu solicitud y te habilitara el acceso.')
    } else if(mode==='forgot'){
      const {error:e}=await supabase.auth.resetPasswordForEmail(email,{
        redirectTo:`${window.location.origin}/auth`
      })
      if(e)setError(e.message)
      else setSuccess('Te enviamos un email para restablecer tu contraseña.')
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

        {mode!=='forgot'&&(
          <div style={{display:'flex',gap:0,marginBottom:24,background:C.surface2,borderRadius:8,padding:4}}>
            {[['login','Iniciar sesión'],['register','Registrarse']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError('');setSuccess('')}} style={{flex:1,background:mode===m?C.amber:'transparent',color:mode===m?C.bg:C.muted,border:'none',borderRadius:6,padding:'8px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,transition:'all 0.2s'}}>{l}</button>
            ))}
          </div>
        )}

        {mode==='forgot'&&(
          <div style={{marginBottom:20}}>
            <button onClick={()=>{setMode('login');setError('');setSuccess('')}} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:11,padding:0,cursor:'pointer',marginBottom:12}}>← VOLVER</button>
            <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Restablecer contraseña</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.5}}>Ingresa tu email y te enviaremos un link para crear una nueva contraseña.</div>
          </div>
        )}

        {error&&<AlertBanner color={C.red} icon="x">{error}</AlertBanner>}
        {success&&<AlertBanner color={C.green} icon="v">{success}</AlertBanner>}

        {mode==='register'&&<Input label="Nombre completo" value={name} onChange={setName} placeholder="Juan Garcia" required/>}
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@empresa.com" required/>
        {mode!=='forgot'&&<Input label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Minimo 6 caracteres" required/>}

        <Btn full onClick={handle} disabled={loading||!email||(mode!=='forgot'&&!password)}>
          {loading?'...':(mode==='login'?'INGRESAR →':mode==='register'?'CREAR CUENTA →':'ENVIAR EMAIL')}
        </Btn>

        {mode==='login'&&(
          <button onClick={()=>{setMode('forgot');setError('');setSuccess('')}}
            style={{width:'100%',background:'none',border:'none',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:10,marginTop:12,cursor:'pointer',padding:8,letterSpacing:'0.06em'}}>
            OLVIDE MI CONTRASEÑA
          </button>
        )}
      </div>
      <div className="mono" style={{fontSize:9,color:C.muted,marginTop:24,letterSpacing:'0.1em',textAlign:'center'}}>BETA v1.0 · {new Date().getFullYear()}</div>
    </div>
  )
}
