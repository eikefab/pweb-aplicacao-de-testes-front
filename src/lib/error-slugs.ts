/**
 * Mapeamento de error slugs da API para mensagens em português
 * Baseado nos error slugs documentados em ENDPOINTS.md
 */

export const errorSlugTranslations: Record<string, string> = {
  // Authentication errors
  'unauthorized/missing-token': 'Token de autenticação não fornecido',
  'unauthorized/bearer-token-missing-or-invalid':
    'Token de autenticação inválido ou mal formatado',
  'unauthorized/user-not-found':
    'Usuário não encontrado (token válido mas usuário foi deletado)',
  'unauthorized/invalid-credentials':
    'Credenciais inválidas. Verifique seu e-mail e senha',

  // User errors
  'users/not-found': 'Usuário não encontrado',
  'users/email-conflict': 'Este e-mail já está cadastrado',

  // Test errors
  'tests/not-found': 'Teste não encontrado',
  'tests/invalid-date-range':
    'A data de início não pode ser posterior à data de término',

  // Question errors
  'tests/questions/not-found': 'Questão não encontrada',

  // Option errors
  'tests/questions/options/not-found': 'Opção não encontrada',

  // Assignee errors
  'tests/assignees/not-found': 'Atribuição não encontrada',
  'tests/assignees/already-exists':
    'Este usuário já está atribuído a este teste',

  // Validation errors
  'bad-request/validation-failed': 'Erro de validação nos dados enviados',

  // Server errors
  'internal-server-error/unhandled-exception':
    'Erro interno do servidor. Tente novamente mais tarde',
}

/**
 * Traduz um error slug para mensagem em português
 * @param slug - Error slug retornado pela API
 * @param fallbackMessage - Mensagem a ser usada se o slug não estiver mapeado
 * @returns Mensagem traduzida em português
 */
export function translateErrorSlug(
  slug: string | undefined,
  fallbackMessage: string,
): string {
  if (!slug) {
    return fallbackMessage
  }

  return errorSlugTranslations[slug] || fallbackMessage
}

/**
 * Verifica se um error slug é de validação (details contém array de erros)
 * @param slug - Error slug retornado pela API
 * @returns true se for erro de validação
 */
export function isValidationError(slug: string | undefined): boolean {
  return slug === 'bad-request/validation-failed'
}
