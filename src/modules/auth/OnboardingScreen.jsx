import { useState } from 'react'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/store/AuthContext'
import { C } from '@/styles/tokens'
import { Btn, Input, Select, AlertBanner } from '@/components/ui'

export default function OnboardingScreen({ onComplete }) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('owner')
  const [orgEmail, setOrgEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const createOrg = async () => {
    if (!orgName) { setError('El nombre de la empresa es obligatorio'); return }
    setSaving(true); setError('')

    // 1. Crear la organización
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: orgName, type: orgType, email: orgEmail || null, created_by: user.id, active: true })
      .select().single()

    if (orgErr) { setError(orgErr.message); setSaving(false); return }

    // 2. Agregar al usuario como org_admin
    await supabase.from('org_members').insert({
      org_id: org.id, user_id: user.id, role: 'org_admin'
    })

    // 3. Marcar onboarding como completado y guardar org_id en profile
    await supabase.from('profiles').update({
      onboarding_completed: true,
      org_id: org.id
    }).eq('id', user.id)

    setSaving(false)
    onComplete()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 28, fontWeight: 700, color: C.amber, letterSpacing: '-0.04em', marginBottom: 6 }}>COVER</div>
          <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: '0.15em' }}>GRUPO AISLAR</div>
        </div>

        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Bienvenido a Cover</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                Para empezar, necesitamos crear tu empresa. Esto te permitirá gestionar tus cubiertas e inspecciones.
              </div>
            </div>
            <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
              {[
                ['🏢', 'Crear tu empresa', 'Registramos el nombre y tipo de tu organización'],
                ['🏗', 'Agregar cubiertas', 'Cargás las cubiertas que querés gestionar'],
                ['✓', 'Empezar a operar', 'Inspecciones, tickets y seguimiento de obras'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Btn full onClick={() => setStep(2)}>EMPEZAR →</Btn>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: 24 }}>
              <div className="mono" style={{ fontSize: 10, color: C.amber, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>PASO 1 DE 1</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Crear tu empresa</div>
              <div style={{ fontSize: 13, color: C.muted }}>Esta información identifica tu organización en la plataforma.</div>
            </div>

            {error && <AlertBanner color={C.red} icon="!">{error}</AlertBanner>}

            <Input label="Nombre de la empresa" value={orgName} onChange={setOrgName} placeholder="Ej: Industrial Norte SA" required />

            <div style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Tipo de empresa</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  ['owner', '🏭', 'Propietario', 'Dueño de los edificios'],
                  ['contractor', '🔨', 'Contratista', 'Empresa de mantenimiento'],
                ].map(([val, icon, label, desc]) => (
                  <button key={val} onClick={() => setOrgType(val)} style={{
                    flex: 1, background: orgType === val ? C.amber + '22' : C.surface2,
                    border: `1.5px solid ${orgType === val ? C.amber : C.border}`,
                    borderRadius: 8, padding: '12px 8px', cursor: 'pointer', transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: orgType === val ? C.amber : C.text, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Input label="Email de contacto (opcional)" type="email" value={orgEmail} onChange={setOrgEmail} placeholder="contacto@empresa.com" />

            <Btn full onClick={createOrg} disabled={!orgName || saving}>
              {saving ? 'CREANDO...' : 'CREAR EMPRESA Y ENTRAR →'}
            </Btn>

            <button onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', color: C.muted, fontFamily: 'IBM Plex Mono', fontSize: 10, marginTop: 12, cursor: 'pointer', padding: 8 }}>
              ← VOLVER
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
