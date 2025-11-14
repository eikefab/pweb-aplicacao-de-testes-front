import { ApiError } from '@/lib/api'
import { translateErrorSlug, isValidationError } from '@/lib/error-slugs'

interface ErrorDisplayProps {
  error: Error | ApiError | null | undefined
  fallbackMessage?: string
}

interface ValidationErrorDetail {
  code: string
  path: (string | number)[]
  message: string
  [key: string]: any
}

/**
 * Componente reutilizável para exibir erros da API
 * - Traduz error slugs para português
 * - Exibe erros de validação como lista com bullets
 * - Mantém estilo visual consistente
 */
export function ErrorDisplay({
  error,
  fallbackMessage = 'Ocorreu um erro. Tente novamente.',
}: ErrorDisplayProps) {
  if (!error) {
    return null
  }

  const isApiError = error instanceof ApiError
  const errorSlug = isApiError ? error.data?.error : undefined
  const isValidation = isValidationError(errorSlug)

  // Para erros de validação, extrair array de details
  const validationErrors: ValidationErrorDetail[] | undefined =
    isValidation && isApiError && Array.isArray(error.data?.details)
      ? error.data.details
      : undefined

  // Determinar mensagem a ser exibida
  let displayMessage: string

  if (isValidation && validationErrors && validationErrors.length > 0) {
    // Para erros de validação, usar mensagem padrão (a lista será exibida abaixo)
    displayMessage = 'Corrija os seguintes erros:'
  } else if (isApiError && errorSlug) {
    // Traduzir error slug ou usar mensagem da API como fallback
    displayMessage = translateErrorSlug(errorSlug, error.message)
  } else if (isApiError) {
    // ApiError sem slug
    displayMessage = error.message || fallbackMessage
  } else {
    // Error genérico
    displayMessage = error.message || fallbackMessage
  }

  return (
    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
      <p className="font-medium">{displayMessage}</p>

      {/* Exibir lista de erros de validação */}
      {validationErrors && validationErrors.length > 0 && (
        <ul className="mt-2 space-y-1 ml-4">
          {validationErrors.map((validationError, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-300 mt-0.5">•</span>
              <span>{validationError.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
