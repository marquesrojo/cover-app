export const C = {
  bg:'#07090f', surface:'#0d1117', surface2:'#111827', border:'#1e2533',
  amber:'#f5a623', amberDim:'#f5a62322',
  red:'#ef4444', green:'#22c55e', yellow:'#eab308', orange:'#f97316', blue:'#3b82f6',
  text:'#e2e8f0', muted:'#64748b', mutedLight:'#94a3b8',
}
export const rciColor  = v => v>=70?C.green:v>=50?C.yellow:v>=30?C.orange:C.red
export const rciLabel  = v => v>=70?'EXCELENTE':v>=50?'REGULAR':v>=30?'POBRE':'CRÍTICO'
export const rciRec    = v => v>=70?'Continuar programa semestral. Sin intervención estructural.':v>=50?'Reparaciones correctivas: masillas y microparches.':v>=30?'Presupuestar restauración con recubrimiento elastomérico.':'Suspender rutinario. Iniciar planificación de reemplazo total.'
