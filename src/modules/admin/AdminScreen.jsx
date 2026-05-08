import { useState, useEffect } from 'react'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'
import { Spinner, Btn, Input, Select, AlertBanner, Badge } from '@/components/ui'

const SECTIONS=[
  {id:'orgs',label:'Organizaciones',icon:'🏢'},
  {id:'users',label:'Usuarios',icon:'👥'},
  {id:'config',label:'Configuracion',icon:'⚙️'},
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

function OrgsPanel(){
  const {user}=useAuth()
  const [orgs,setOrgs]=useState([])
  const [plants,setPlants]=useState([])
  const [loading,setLoading]=useState(true)
  const [showNew,setShowNew]=useState(false)
  const [name,setName]=useState('')
  const [type,setType]=useState('')
  const [email,setEmail]=useState('')
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
    if(!name||!type){setError('Nombre y tipo son obligatorios');return}
    setSaving(true);setError('')
    const {error:e}=await supabase.from('organizations').insert({name,type,email:email||null,created_by:user.id})
    if(e){setError(e.message);setSaving(false);return}
    setName('');setType('');setEmail('');setShowNew(false)
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
        <div className="mono" style={{fontSize:11,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>{orgs.length} organizaciones</div>
        <Btn small onClick={()=>setShowNew(!showNew)}>+ NUEVA</Btn>
      </div>

      {showNew&&(
        <div style={{background:C.surface2,border:`1px solid ${C.amber}44`,borderRadius:8,padding:14,marginBottom:14,animation:'slideUp 0.25s ease'}}>
          <div className="mono" style={{fontSize:11,color:C.amber,marginBottom:12,textTransform:'uppercase'}}>Nueva Organizacion</div>
          {error&&<AlertBanner color={C.red} icon="!">{error}</AlertBanner>}
          <Input label="Nombre" value={name} onChange={setName} placeholder="Ej: Industrial SA" required/>
          <Select label="Tipo" value={type} onChange={setType} options={[{value:'owner',label:'Propietario (dueno de edificios)'},{value:'contractor',label:'Contratista (hace trabajos)'}]} required/>
          <Input label="Email de contacto" type="email" value={email} onChange={setEmail} placeholder="contacto@empresa.com"/>
          <div style={{display:'flex',gap:8}}>
            <Btn outline onClick={()=>{setShowNew(false);setError('')}}>CANCELAR</Btn>
            <Btn onClick={createOrg} disabled={!name||!type||saving}>{saving?'CREANDO...':'CREAR'}</Btn>
          </div>
        </div>
      )}

      {orgs.length===0&&!loading&&(
        <div style={{textAlign:'center',padding:'40px 0',color:C.muted}}>
          <div style={{fontSize:32,marginBottom:12}}>🏢</div>
          <div style={{fontSize:14}}>No hay organizaciones</div>
        </div>
      )}

      {orgs.map(org=>(
        <div key={org.id} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{org.name}</div>
              <div style={{display:'flex',gap:6}}>
                <Badge color={org.type==='owner'?C.blue:C.amber} small>{org.type==='owner'?'PROPIETARIO':'CONTRATISTA'}</Badge>
                <Badge color={org.active?C.green:C.muted} small>{org.active?'ACTIVO':'INACTIVO'}</Badge>
              </div>
            </div>
            <button onClick={()=>toggleOrg(org)} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',color:C.muted,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>
              {org.active?'DESACTIVAR':'ACTIVAR'}
            </button>
          </div>
          {org.email&&<div style={{fontSize:11,color:C.muted,marginBottom:8}}>{org.email}</div>}

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

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    setLoading(true)
    const [{data:u},{data:o}]=await Promise.all([
      supabase.from('profiles').select('*, org_members(org_id, role, organizations(name,type))').order('full_name'),
      supabase.from('organizations').select('id,name,type').order('name'),
    ])
    setUsers(u||[])
    setOrgs(o||[])
    setLoading(false)
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

  if(loading)return<Spinner/>

  const filtered=search?users.filter(u=>u.full_name?.toLowerCase().includes(search.toLowerCase())):users

  return(
    <div>
      <Input label="Buscar usuario" value={search} onChange={setSearch} placeholder="Nombre..."/>
      {filtered.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:C.muted,fontSize:13}}>No hay usuarios</div>}
      {filtered.map(u=>(
        <div key={u.id} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{u.full_name||'Sin nombre'}</div>
              <div className="mono" style={{fontSize:9,color:C.muted}}>{u.id.slice(0,16)}...</div>
            </div>
            <select value={u.role||'operario'} onChange={e=>changeRole(u.id,e.target.value)}
              style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:'4px 8px',color:C.amber,fontFamily:'IBM Plex Mono',fontSize:10,outline:'none'}}>
              <option value="operario">OPERARIO</option>
              <option value="gerente">GERENTE</option>
              <option value="admin">ADMIN</option>
              <option value="cover_admin">COVER ADMIN</option>
            </select>
          </div>

          {/* Organizaciones actuales */}
          {(u.org_members||[]).length>0&&(
            <div style={{marginBottom:10}}>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Organizaciones actuales:</div>
              {(u.org_members||[]).map(om=>(
                <div key={om.org_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 8px',background:C.surface,borderRadius:6,marginBottom:4}}>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <span style={{fontSize:12,color:C.text}}>{om.organizations?.name}</span>
                    <Badge color={om.organizations?.type==='owner'?C.blue:C.amber} small>{om.organizations?.type==='owner'?'PROP':'CONT'}</Badge>
                  </div>
                  <button onClick={()=>removeFromOrg(u.id,om.org_id)} style={{background:'none',border:'none',color:C.red,fontFamily:'IBM Plex Mono',fontSize:9,cursor:'pointer'}}>QUITAR</button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar a organización */}
          {orgs.filter(o=>!(u.org_members||[]).find(om=>om.org_id===o.id)).length>0&&(
            <div>
              <div className="mono" style={{fontSize:9,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Agregar a organizacion:</div>
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
  const [section,setSection]=useState('orgs')

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
          <button key={s.id} onClick={()=>setSection(s.id)} style={{flex:1,background:section===s.id?C.amber:'transparent',color:section===s.id?C.bg:C.muted,border:'none',borderRadius:6,padding:'8px 4px',fontFamily:'IBM Plex Mono',fontSize:9,fontWeight:700,transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
            <span style={{fontSize:14}}>{s.icon}</span>
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {section==='orgs'&&<OrgsPanel/>}
        {section==='users'&&<UsersPanel/>}
        {section==='config'&&<ConfigPanel/>}
      </div>
    </div>
  )
}
