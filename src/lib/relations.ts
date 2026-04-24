type RelationValue = null | string | { id?: string | null } | undefined

export function relationToId(value: RelationValue): string | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  return value.id || null
}

export function relationsToIds(values: RelationValue[] | null | undefined): string[] {
  if (!values) {
    return []
  }

  return values
    .map((value) => relationToId(value))
    .filter((value): value is string => Boolean(value))
}
