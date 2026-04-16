// Parent kampos (provinces / districts)
export const KAMPOS = [
  { id: 'davao_del_sur', name: 'Davao del Sur' },
  { id: 'davao_de_oro',  name: 'Davao de Oro'  },
  { id: 'paquibato',     name: 'Paquibato'      },
]

// Ekklesias (congregations) — the actual attendance scope
export const EKKLESIAS = [
  { id: 'shiloh_1',   name: 'Shiloh 1',   kampoId: 'davao_del_sur' },
  { id: 'shiloh_2',   name: 'Shiloh 2',   kampoId: 'davao_del_sur' },
  { id: 'tagum_city', name: 'Tagum City',  kampoId: 'davao_del_sur' },
  { id: 'samuag',     name: 'Samuag',      kampoId: 'davao_de_oro'  },
  { id: 'rizal',      name: 'Rizal',       kampoId: 'davao_de_oro'  },
  { id: 'mapula',     name: 'Mapula',      kampoId: 'paquibato'     },
  { id: 'salapawan',  name: 'Salapawan',   kampoId: 'paquibato'     },
]

// Quick lookup helpers
export const KAMPO_BY_ID = KAMPOS.reduce((acc, k) => {
  acc[k.id] = k
  return acc
}, {})

export const EKKLESIA_BY_ID = EKKLESIAS.reduce((acc, e) => {
  acc[e.id] = e
  return acc
}, {})

// Return all ekklesias that belong to a given parent kampo id
export function ekklesiasForKampo(kampoId) {
  return EKKLESIAS.filter(e => e.kampoId === kampoId)
}

// Given an ekklesia id, return the parent kampo name (for display)
export function parentKampoName(ekklesiaId) {
  const ekk = EKKLESIA_BY_ID[ekklesiaId]
  if (!ekk) return ''
  return KAMPO_BY_ID[ekk.kampoId]?.name || ''
}

// Given an ekklesia id, return the parent kampo id
export function parentKampoId(ekklesiaId) {
  return EKKLESIA_BY_ID[ekklesiaId]?.kampoId || ''
}
