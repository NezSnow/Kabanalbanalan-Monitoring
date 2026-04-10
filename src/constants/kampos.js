export const KAMPOS = [
  { id: 'shiloh', name: 'Shiloh', sub: 'Agdao, Davao City' },
  { id: 'tagum', name: 'Tagum City', sub: '' },
  { id: 'paquibato', name: 'Paquibato District', sub: '' },
  { id: 'monkayo', name: 'Monkayo', sub: 'Davao de Oro' },
]

export const KAMPO_BY_NAME = KAMPOS.reduce((acc, k) => {
  acc[k.name.toLowerCase()] = k
  return acc
}, {})
