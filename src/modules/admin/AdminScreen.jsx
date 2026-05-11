import { useState, useEffect } from 'react'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'
import { Spinner, Btn, Input, AlertBanner, Badge } from '@/components/ui'

const SECTIONS=[
  {id:'pending',label:'Pendientes',icon:'⏳'},
  {id:'orgs',label:'Empresas',icon:'🏢'},
  {id:'users',label:'Usuarios',icon:'👥'},
  {id:'config',label:'Config',icon:'⚙️'},
]

const CONFIG_CATEGORIES=[
  {id:'membrane_types',label:'Tipos de membrana'},
  {id:'inspection_types',label:'Tipos de inspeccion'},
  {id:'jsa_items',label:'Items JSA'},
  {id:'work_types',label:'Tipos de trabajo'},
  {id:'weather_types',label:'Condiciones climaticas'},
  {id:'obra_types',label:'Tipos de obra'},
  {id:'alerts',label:'Alertas'},
]

function PendingPanel(){
  const [pending,setPending]=useState([])
  const [orgs,setOrgs]=useState([])
  const [loading,setLoading]=useState(true)
  const [approving,setApproving]=useState(null)
  const [selectedOrg,setSelectedOrg]=useState({})

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    setLoading(true)
    const [{data:u},{data:o}]=await Promise.all([
      supabase.from('profiles').select('*').eq('approved',false).neq('role','cover_admin').neq('role','admin').order('created_at',{ascending:false}),
      supabase.from('organizations').select('id,name').eq('active',true).order('name'),
    ])
    setPending(u||[])
    setOrgs(o||[])
    setLoading(false)
  }

  async function approveUser(userId){
    const orgId=selectedOrg[userId]
    if(!orgId){alert('Selecciona una empresa para este usuario');return}
    setApproving(userId)
    await supabase.from('profiles').update({approved:true,org_id:orgId,onboarding_completed:true}).eq('id',userId)
    await supabase.from('org_members').insert({user_id:userId,org_id:orgId,role:'org_member'})
    setApproving(null)
    fetchData()
  }

  async function rejectUser(userId){
    if(!confirm('Rechazar este usuario? Se eliminara su perfil.'))return
    await supabase.from('profiles').delete().eq('id',userId)
    fetchData()
  }

  if(loading)return<Spinner/>

  return(
    <div>
      {pending.length===0?(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:32,marginBottom:12}}>✅</div>
          <div style={{fontSize:14,color:C.muted}}>No hay usuarios pendientes de aprobacion</div>
        </div>
      ):(
        <>
          <div style={{background:C.amber+'11',border:`1px solid ${C.amber}33`,borderRadius:8,padding:12,marginBottom:16}}>
            <div className="mono" style={{fontSize:10,color:C.amber,textTransform:'uppercase',marginBottom:4}}>{pending.length} usuarios esperando aprobacion</div>
            <div style={{fontSize:12,color:C.muted}}>Asigna cada usuario a una empresa antes de aprobar.</div>
          </div>
          {pending.map(u=>(
            <div key={u.id} style={{background:C.surface2,border:`1px solid ${C.amber}44`,borderRadius:8,padding:14,marginBottom:8}}>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{u.full_name||'Sin nombre'}</div>
                <div className="mono" style={{fontSize:10,color:C.muted}}>{u.id.slice(0,20)}...</div>
                <div className="mono" style={{fontSize:9,color:C.muted,marginTop:2}}>Registrado: {new Date(u.created_at).toLocaleDateString('es-AR')}</div>
              </div>
              <div style={{marginBottom:12}}>
                <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Asignar a empresa:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {orgs.map(o=>(
                    <button key={o.id} onClick={()=>setSelectedOrg(prev=>({...prev,[u.id]:o.id}))}
                      style={{background:selectedOrg[u.id]===o.id?C.amber+'33':C.surface,border:`1.5px solid ${selectedOrg[u.id]===o.id?C.amber:C.border}`,borderRadius:6,padding:'6px 10px',color:selectedOrg[u.id]===o.id?C.amber:C.text,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer',transition:'all 0.15s'}}>
                      {o.name}
                    </button>
                  ))}
                </div>
                {orgs.length===0&&<div style={{fontSize:12,color:C.red}}>No hay empresas creadas. Crea una primero en la seccion Empresas.</div>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>approveUser(u.id)} disabled={!selectedOrg[u.id]||approving===u.id}
                  style={{flex:2,background:selectedOrg[u.id]&&approving!==u.id?C.green:C.border,color:selectedOrg[u.id]&&approving!==u.id?'#fff':C.muted,border:'none',borderRadius:6,padding:'10px',fontFamily:'IBM Plex Mono',fontSize:10,fontWeight:700,cursor:selectedOrg[u.id]?'pointer':'not-allowed',transition:'all 0.15s'}}>
                  {approving===u.id?'APROBANDO...':'APROBAR Y ASIGNAR'}
                </button>
                <button onClick={()=>rejectUser(u.id)}
                  style={{flex:1,background:'none',border:`1px solid ${C.red}44`,borderRadius:6,padding:'10px',fontFamily:'IBM Plex Mono',fontSize:10,color:C.red,cursor:'pointer'}}>
                  RECHAZAR
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function OrgsPanel(){
  const {user}=useAuth()
  const [orgs,setOrgs]=useState([])
  const [plants,setPlants]=useState([])
  const [loading,setLoading]=useState(true)
  const [showNew,setShowNew]=useState(false)
  const [name,setName]=useState('')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [selectedOrg,setSelectedOrg]=useState(null)
  const [orgPlants,setOrgPlants]=useState([])

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    setLoading(true)
    const [{data:o},{data:p}]=await Promise.all([
      supabase.from('organizations').select('*').order('name'),
      supabase.from('plants').select('id,name').order('name'),
    ])
    setOrgs(o||[])
    setPlants(p||[])
    setLoading(false)
  }

  async function fetchOrgPlants(orgId){
    const {data}=await supabase.from('plant_access').select('plant_id, plants(name)').eq('org_id',orgId)
    setOrgPlants(data||[])
  }

  async function createOrg(){
    if(!name){setError('El nombre es obligatorio');return}
    setSaving(true);setError('')
    const {error:e}=await supabase.from('organizations').insert({name,type:'owner',created_by:user.id})
    if(e){setError(e.message);setSaving(false);return}
    setName('');setShowNew(false)
    setSaving(false);fetchData()
  }

  async function grantAccess(orgId,plantId){
    await supabase.from('plant_access').insert({org_id:orgId,plant_id:plantId,granted_by:user.id})
    fetchOrgPlants(orgId)
  }

  async function revokeAccess(orgId,plantId){
    await supabase.from('plant_access').delete().eq('org_id',orgId).eq('plant_id',plantId)
    fetchOrgPlants(orgId)
  }

  async function toggleOrg(org){
    await supabase.from('organizations').update({active:!org.active}).eq('id',org.id)
    setOrgs(prev=>prev.map(o=>o.id===org.id?{...o,active:!org.active}:o))
  }

  if(loading)return<Spinner/>

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div className="mono" style={{fontSize:11,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>{orgs.length} empresas</div>
        <Btn small onClick={()=>setShowNew(!showNew)}>+ NUEVA</Btn>
      </div>

      {showNew&&(
        <div style={{background:C.surface2,border:`1px solid ${C.amber}44`,borderRadius:8,padding:14,marginBottom:14,animation:'slideUp 0.25s ease'}}>
          <div className="mono" style={{fontSize:11,color:C.amber,marginBottom:12,textTransform:'uppercase'}}>Nueva Empresa</div>
          {error&&<AlertBanner color={C.red} icon="!">{error}</AlertBanner>}
          <Input label="Nombre de la empresa" value={name} onChange={setName} placeholder="Ej: Ford Argentina" required/>
          <div style={{display:'flex',gap:8}}>
            <Btn outline onClick={()=>{setShowNew(false);setError('');setName('')}}>CANCELAR</Btn>
            <Btn onClick={createOrg} disabled={!name||saving}>{saving?'CREANDO...':'CREAR'}</Btn>
          </div>
        </div>
      )}

      {orgs.length===0&&!loading&&(
        <div style={{textAlign:'center',padding:'40px 0',color:C.muted}}>
          <div style={{fontSize:32,marginBottom:12}}>🏢</div>
          <div style={{fontSize:14}}>No hay empresas</div>
        </div>
      )}

      {orgs.map(org=>(
        <div key={org.id} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{org.name}</div>
              <Badge color={org.active?C.green:C.muted} small>{org.active?'ACTIVO':'INACTIVO'}</Badge>
            </div>
            <button onClick={()=>toggleOrg(org)} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>
              {org.active?'DESACTIVAR':'ACTIVAR'}
            </button>
          </div>
          <div style={{marginTop:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>Cubiertas con acceso</div>
              <button onClick={()=>{
                if(selectedOrg===org.id){setSelectedOrg(null)}
                else{setSelectedOrg(org.id);fetchOrgPlants(org.id)}
              }} style={{background:'none',border:'none',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>
                {selectedOrg===org.id?'CERRAR':'GESTIONAR'}
              </button>
            </div>
            {selectedOrg===org.id&&(
              <div style={{animation:'fadeIn 0.2s ease'}}>
                {orgPlants.length>0&&(
                  <div style={{marginBottom:8}}>
                    {orgPlants.map(ap=>(
                      <div key={ap.plant_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:12}}>{ap.plants?.name}</span>
                        <button onClick={()=>revokeAccess(org.id,ap.plant_id)} style={{background:'none',border:'none',color:C.red,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>REVOCAR</button>
                      </div>
                    ))}
                  </div>
                )}
                {orgPlants.length===0&&<div style={{fontSize:12,color:C.muted,marginBottom:8}}>Sin cubiertas asignadas</div>}
                <div className="mono" style={{fontSize:9,color:C.muted,marginBottom:6,textTransform:'uppercase'}}>Agregar cubierta:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {plants.filter(p=>!orgPlants.find(ap=>ap.plant_id===p.id)).map(p=>(
                    <button key={p.id} onClick={()=>grantAccess(org.id,p.id)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:'5px 10px',color:C.text,fontSize:11,cursor:'pointer'}}>
                      + {p.name}
                    </button>
                  ))}
                  {plants.filter(p=>!orgPlants.find(ap=>ap.plant_id===p.id)).length===0&&(
                    <span style={{fontSize:11,color:C.muted}}>Todas las cubiertas ya asignadas</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersPanel(){
  const [users,setUsers]=useState([])
  const [orgs,setOrgs]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [showNew,setShowNew]=useState(false)
  const [newName,setNewName]=useState('')
  const [newEmail,setNewEmail]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [newOrgId,setNewOrgId]=useState('')
  const [newRole,setNewRole]=useState('operario')
  const [creating,setCreating]=useState(false)
  const [createError,setCreateError]=useState('')

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    setLoading(true)
    const [{data:u},{data:o}]=await Promise.all([
      supabase.from('profiles').select('*, org_members(org_id, role, organizations(name))').eq('approved',true).order('full_name'),
      supabase.from('organizations').select('id,name').order('name'),
    ])
    setUsers(u||[])
    setOrgs(o||[])
    setLoading(false)
  }

  async function createUser(){
    if(!newName||!newEmail||!newPassword||!newOrgId){setCreateError('Todos los campos son obligatorios');return}
    if(newPassword.length<6){setCreateError('La contraseña debe tener al menos 6 caracteres');return}
    setCreating(true);setCreateError('')

    // 1. Crear usuario en Supabase Auth
    const {data:authData,error:authErr}=await supabase.auth.admin.createUser({
      email:newEmail,
      password:newPassword,
      email_confirm:true,
      user_metadata:{full_name:newName}
    })
    if(authErr){setCreateError(authErr.message);setCreating(false);return}

    const userId=authData.user?.id
    if(!userId){setCreateError('Error al crear el usuario');setCreating(false);return}

    // 2. Esperar que el trigger cree el profile
    await new Promise(r=>setTimeout(r,1000))

    // 3. Actualizar profile
    await supabase.from('profiles').update({
      full_name:newName,
      role:newRole,
      org_id:newOrgId,
      approved:true,
      onboarding_completed:true,
    }).eq('id',userId)

    // 4. Agregar a org_members
    await supabase.from('org_members').insert({user_id:userId,org_id:newOrgId,role:'org_member'})

    setNewName('');setNewEmail('');setNewPassword('');setNewOrgId('');setNewRole('operario')
    setShowNew(false);setCreating(false)
    fetchData()
  }

  async function changeRole(userId,role){
    await supabase.from('profiles').update({role}).eq('id',userId)
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,role}:u))
  }

  async function addToOrg(userId,orgId){
    const {error}=await supabase.from('org_members').insert({user_id:userId,org_id:orgId,role:'org_member'})
    if(error){alert('Error: '+error.message);return}
    fetchData()
  }

  async function removeFromOrg(userId,orgId){
    await supabase.from('org_members').delete().eq('user_id',userId).eq('org_id',orgId)
    fetchData()
  }

  async function revokeAccess(userId){
    if(!confirm('Revocar acceso a este usuario?'))return
    await supabase.from('profiles').update({approved:false,org_id:null}).eq('id',userId)
    fetchData()
  }

  if(loading)return<Spinner/>

  const filtered=search?users.filter(u=>u.full_name?.toLowerCase().includes(search.toLowerCase())):users

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <Input label="Buscar usuario" value={search} onChange={setSearch} placeholder="Nombre..."/>
        <button onClick={()=>setShowNew(!showNew)} style={{background:C.amber,color:C.bg,border:'none',borderRadius:8,padding:'10px 14px',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,marginLeft:8,whiteSpace:'nowrap',minHeight:44,marginTop:20}}>+ NUEVO</button>
      </div>

      {showNew&&(
        <div style={{background:C.surface2,border:`1px solid ${C.amber}44`,borderRadius:8,padding:14,marginBottom:16,animation:'slideUp 0.25s ease'}}>
          <div className="mono" style={{fontSize:11,color:C.amber,marginBottom:12,textTransform:'uppercase'}}>Crear usuario</div>
          {createError&&<AlertBanner color={C.red} icon="!">{createError}</AlertBanner>}
          <Input label="Nombre completo" value={newName} onChange={setNewName} placeholder="Juan Garcia" required/>
          <Input label="Email" type="email" value={newEmail} onChange={setNewEmail} placeholder="juan@empresa.com" required/>
          <Input label="Contraseña" type="password" value={newPassword} onChange={setNewPassword} placeholder="Minimo 6 caracteres" required/>
          <div style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Empresa</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {orgs.map(o=>(
                <button key={o.id} onClick={()=>setNewOrgId(o.id)}
                  style={{background:newOrgId===o.id?C.amber+'33':C.surface,border:`1.5px solid ${newOrgId===o.id?C.amber:C.border}`,borderRadius:6,padding:'6px 10px',color:newOrgId===o.id?C.amber:C.text,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer'}}>
                  {o.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Rol</div>
            <div style={{display:'flex',gap:6}}>
              {[['operario','CONTRATISTA'],['gerente','PROPIETARIO']].map(([val,label])=>(
                <button key={val} onClick={()=>setNewRole(val)}
                  style={{flex:1,background:newRole===val?C.amber+'33':C.surface,border:`1.5px solid ${newRole===val?C.amber:C.border}`,borderRadius:6,padding:'8px',color:newRole===val?C.amber:C.text,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer'}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Btn outline onClick={()=>{setShowNew(false);setCreateError('')}}>CANCELAR</Btn>
            <Btn onClick={createUser} disabled={!newName||!newEmail||!newPassword||!newOrgId||creating}>
              {creating?'CREANDO...':'CREAR USUARIO'}
            </Btn>
          </div>
        </div>
      )}
      {filtered.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:C.muted,fontSize:13}}>No hay usuarios aprobados</div>}
      {filtered.map(u=>(
        <div key={u.id} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{u.full_name||'Sin nombre'}</div>
              <div className="mono" style={{fontSize:9,color:C.muted}}>{u.id.slice(0,16)}...</div>
            </div>
            <select value={u.role||'operario'} onChange={e=>changeRole(u.id,e.target.value)}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:10,outline:'none'}}>
              <option value="operario">CONTRATISTA</option>
              <option value="gerente">PROPIETARIO</option>
              <option value="cover_admin">COVER ADMIN</option>
            </select>
          </div>
          {(u.org_members||[]).length>0&&(
            <div style={{marginBottom:10}}>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Empresa:</div>
              {(u.org_members||[]).map(om=>(
                <div key={om.org_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 8px',background:C.surface,borderRadius:6,marginBottom:4}}>
                  <span style={{fontSize:12,color:C.text}}>{om.organizations?.name}</span>
                  <button onClick={()=>removeFromOrg(u.id,om.org_id)} style={{background:'none',border:'none',color:C.red,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>QUITAR</button>
                </div>
              ))}
            </div>
          )}
          {orgs.filter(o=>!(u.org_members||[]).find(om=>om.org_id===o.id)).length>0&&(
            <div style={{marginBottom:10}}>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Agregar a empresa:</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {orgs.filter(o=>!(u.org_members||[]).find(om=>om.org_id===o.id)).map(o=>(
                  <button key={o.id} onClick={()=>addToOrg(u.id,o.id)}
                    style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 10px',color:C.text,fontFamily:'IBM Plex Mono',fontSize:10,cursor:'pointer',minHeight:36}}>
                    + {o.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={()=>revokeAccess(u.id)} style={{width:'100%',background:'none',border:`1px solid ${C.red}33`,borderRadius:6,padding:'6px',fontFamily:'IBM Plex Mono',fontSize:9,color:C.red,cursor:'pointer',marginTop:4}}>
            REVOCAR ACCESO
          </button>
        </div>
      ))}
    </div>
  )
}

function ConfigPanel(){
  const [configs,setConfigs]=useState([])
  const [loading,setLoading]=useState(true)
  const [activeCategory,setActiveCategory]=useState('membrane_types')
  const [editingId,setEditingId]=useState(null)
  const [editValue,setEditValue]=useState('')
  const [editLabel,setEditLabel]=useState('')
  const [newValue,setNewValue]=useState('')
  const [newLabel,setNewLabel]=useState('')
  const [saving,setSaving]=useState(false)

  useEffect(()=>{fetchConfig()},[])

  async function fetchConfig(){
    setLoading(true)
    const {data}=await supabase.from('platform_config').select('*').order('category').order('order_index')
    setConfigs(data||[])
    setLoading(false)
  }

  async function saveEdit(id){
    setSaving(true)
    await supabase.from('platform_config').update({value:editValue,label:editLabel}).eq('id',id)
    setEditingId(null);setSaving(false);fetchConfig()
  }

  async function toggleActive(item){
    await supabase.from('platform_config').update({active:!item.active}).eq('id',item.id)
    setConfigs(prev=>prev.map(c=>c.id===item.id?{...c,active:!item.active}:c))
  }

  async function addItem(){
    if(!newValue)return
    setSaving(true)
    const key=newValue.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')+'_'+Date.now()
    const maxOrder=configs.filter(c=>c.category===activeCategory).reduce((m,c)=>Math.max(m,c.order_index),0)
    await supabase.from('platform_config').insert({category:activeCategory,key,value:newValue,label:newLabel||newValue,order_index:maxOrder+1})
    setNewValue('');setNewLabel('');setSaving(false);fetchConfig()
  }

  if(loading)return<Spinner/>

  const categoryItems=configs.filter(c=>c.category===activeCategory)
  const isAlerts=activeCategory==='alerts'

  return(
    <div>
      <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:16,paddingBottom:4}}>
        {CONFIG_CATEGORIES.map(cat=>(
          <button key={cat.id} onClick={()=>setActiveCategory(cat.id)} style={{background:activeCategory===cat.id?C.amberDim:C.surface2,border:`1px solid ${activeCategory===cat.id?C.amber:C.border}`,borderRadius:6,padding:'6px 12px',cursor:'pointer',whiteSpace:'nowrap',fontFamily:'IBM Plex Mono',fontSize:9,color:activeCategory===cat.id?C.amber:C.muted,letterSpacing:'0.08em',transition:'all 0.15s'}}>
            {cat.label.toUpperCase()}
          </button>
        ))}
      </div>
      {categoryItems.length===0&&<div style={{textAlign:'center',padding:'20px 0',color:C.muted,fontSize:13}}>No hay items en esta categoria</div>}
      {categoryItems.map(item=>(
        <div key={item.id} style={{background:C.surface2,border:`1px solid ${item.active?C.border:C.border+'44'}`,borderRadius:8,padding:12,marginBottom:6,opacity:item.active?1:0.6}}>
          {editingId===item.id?(
            <div>
              <Input label="Valor" value={editValue} onChange={setEditValue}/>
              {!isAlerts&&<Input label="Etiqueta" value={editLabel} onChange={setEditLabel}/>}
              <div style={{display:'flex',gap:8}}>
                <Btn small onClick={()=>saveEdit(item.id)} disabled={saving}>{saving?'...':'GUARDAR'}</Btn>
                <Btn small outline onClick={()=>setEditingId(null)}>CANCELAR</Btn>
              </div>
            </div>
          ):(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{item.value}</div>
                {item.label&&item.label!==item.value&&<div style={{fontSize:11,color:C.muted}}>{item.label}</div>}
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>{setEditingId(item.id);setEditValue(item.value);setEditLabel(item.label||'')}}
                  style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>EDITAR</button>
                {!isAlerts&&<button onClick={()=>toggleActive(item)}
                  style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',color:item.active?C.muted:C.green,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>
                  {item.active?'OCULTAR':'MOSTRAR'}
                </button>}
              </div>
            </div>
          )}
        </div>
      ))}
      {!isAlerts&&(
        <div style={{background:C.surface2,border:`1.5px dashed ${C.border}`,borderRadius:8,padding:14,marginTop:12}}>
          <div className="mono" style={{fontSize:10,color:C.muted,textTransform:'uppercase',marginBottom:10}}>Agregar nuevo</div>
          <Input label="Valor" value={newValue} onChange={setNewValue} placeholder="Ej: Bituminosa"/>
          <Input label="Descripcion (opcional)" value={newLabel} onChange={setNewLabel} placeholder="Descripcion larga..."/>
          <Btn small onClick={addItem} disabled={!newValue||saving}>{saving?'...':'+ AGREGAR'}</Btn>
        </div>
      )}
    </div>
  )
}

export default function AdminScreen(){
  const {profile}=useAuth()
  const [section,setSection]=useState('pending')
  const [pendingCount,setPendingCount]=useState(0)

  useEffect(()=>{
    if(profile?.role==='cover_admin'||profile?.role==='admin'){
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('approved',false).neq('role','cover_admin').neq('role','admin')
        .then(({count})=>setPendingCount(count||0))
    }
  },[profile])

  if(!profile)return<Spinner/>

  if(profile?.role!=='cover_admin'&&profile?.role!=='admin'){
    return(
      <div style={{padding:24,textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>🔒</div>
        <div style={{fontSize:14,color:C.muted}}>Acceso restringido</div>
      </div>
    )
  }

  return(
    <div style={{padding:'0 0 80px',animation:'fadeIn 0.3s ease'}}>
      <div style={{padding:'16px 16px 0',marginBottom:14}}>
        <div className="mono" style={{fontSize:9,color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase'}}>PLATAFORMA</div>
        <div style={{fontSize:20,fontWeight:600,marginTop:2}}>Panel de Admin</div>
      </div>

      <div style={{display:'flex',gap:0,background:C.surface2,margin:'0 16px 16px',borderRadius:8,padding:4}}>
        {SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} style={{flex:1,background:section===s.id?C.amber:'transparent',color:section===s.id?C.bg:C.muted,border:'none',borderRadius:6,padding:'8px 4px',fontFamily:'IBM Plex Mono',fontSize:9,fontWeight:700,transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:3,position:'relative'}}>
            <span style={{fontSize:14}}>{s.icon}</span>
            {s.label.toUpperCase()}
            {s.id==='pending'&&pendingCount>0&&(
              <div style={{position:'absolute',top:4,right:4,background:C.red,color:'#fff',borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>
                {pendingCount}
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {section==='pending'&&<PendingPanel/>}
        {section==='orgs'&&<OrgsPanel/>}
        {section==='users'&&<UsersPanel/>}
        {section==='config'&&<ConfigPanel/>}
      </div>
    </div>
  )
}
