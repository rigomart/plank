export interface ModelOption {
  value: string
  displayName: string
}

export const DEFAULT_MODEL = 'claude-opus-4-6'

export const MODELS: ModelOption[] = [
  { value: 'claude-opus-4-6', displayName: 'Opus 4.6' },
  { value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' },
  { value: 'claude-haiku-4-5', displayName: 'Haiku 4.5' }
]
