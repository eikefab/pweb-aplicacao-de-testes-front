import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { Calendar, FileText, Users, Plus, Wrench, Edit, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import { ErrorDisplay } from '../../components/ErrorDisplay'
import { AddParticipantsModal } from '../../components/AddParticipantsModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ViewAnswersModal } from '../../components/ViewAnswersModal'

export const Route = createFileRoute('/tests/$testId')({
  component: TestDetail,
})

interface User {
  id: string
  email: string
  name: string
}

interface Test {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  creator: {
    id: string
    name: string
    email: string
  }
  createdAt?: string
  questions?: Question[]
  assignees?: Assignee[]
  results?: Result[]
}

interface Question {
  id: string
  question: string
  createdBy: string
  createdAt?: string
  options?: QuestionOption[]
  answers?: Answer[]
}

interface QuestionOption {
  id: string
  description: string
  isCorrect: boolean
}

interface Assignee {
  id: string
  userId: string
  user?: {
    name: string
    email: string
  }
}

interface Result {
  user: User
  score: number
}

interface Answer {
  id: string
  testQuestionId: string
  testQuestionOptionId: string
  userId: string
}

const createQuestionSchema = z.object({
  question: z.string().min(1).max(1024),
})

const createOptionSchema = z.object({
  description: z.string().min(1).max(512),
  isCorrect: z.boolean(),
})

function TestDetail() {
  const { testId } = Route.useParams()
  const queryClient = useQueryClient()
  const currentUserId = auth.getUserId()
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  )
  const [newOptionDescription, setNewOptionDescription] = useState('')
  const [newOptionIsCorrect, setNewOptionIsCorrect] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAddParticipantsOpen, setIsAddParticipantsOpen] = useState(false)

  // View answers state
  const [viewAnswersUser, setViewAnswersUser] = useState<{
    userId: string
    userName: string
  } | null>(null)

  // Answer mode state
  const [isAnsweringMode, setIsAnsweringMode] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Edit question state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')

  // Edit option state
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [editOptionDescription, setEditOptionDescription] = useState('')
  const [editOptionIsCorrect, setEditOptionIsCorrect] = useState(false)

  // Delete confirmation state
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<{
    questionId: string
    questionText: string
  } | null>(null)
  const [deleteConfirmOption, setDeleteConfirmOption] = useState<{
    optionId: string
    optionDescription: string
    questionId: string
  } | null>(null)

  const {
    data: test,
    isLoading: testLoading,
    error: testError,
  } = useQuery<Test>({
    queryKey: ['test', testId],
    queryFn: () => api.get(`/tests/${testId}`),
  })

  const questions = test?.questions
  const assignees = test?.assignees

  // Extract all answers from questions
  const existingAnswers = useMemo(() => {
    if (!questions) return []
    const allAnswers: Answer[] = []
    questions.forEach((question) => {
      if (question.answers) {
        allAnswers.push(...question.answers)
      }
    })
    return allAnswers
  }, [questions])

  // Helper to check if a user has answered
  const hasUserAnswered = (userId: string) => {
    return existingAnswers?.some((answer) => answer.userId === userId) || false
  }

  const createQuestionMutation = useMutation({
    mutationFn: async (data: { question: string }) => {
      return api.post(`/tests/${testId}/questions`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setNewQuestion('')
      setIsAddingQuestion(false)
      setValidationError(null)
    },
  })

  const createOptionMutation = useMutation({
    mutationFn: async (data: {
      questionId: string
      description: string
      isCorrect: boolean
    }) => {
      return api.post(`/tests/${testId}/questions/${data.questionId}/options`, {
        description: data.description,
        isCorrect: data.isCorrect,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setNewOptionDescription('')
      setNewOptionIsCorrect(false)
      setSelectedQuestionId(null)
      setValidationError(null)
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: { questionId: string; question: string }) => {
      return api.patch(`/tests/${testId}/questions/${data.questionId}`, {
        question: data.question,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setEditingQuestionId(null)
      setEditQuestionText('')
      setValidationError(null)
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return api.delete(`/tests/${testId}/questions/${questionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setDeleteConfirmQuestion(null)
    },
  })

  const updateOptionMutation = useMutation({
    mutationFn: async (data: {
      questionId: string
      optionId: string
      description: string
      isCorrect: boolean
    }) => {
      return api.patch(
        `/tests/${testId}/questions/${data.questionId}/options/${data.optionId}`,
        {
          description: data.description,
          isCorrect: data.isCorrect,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setEditingOptionId(null)
      setEditOptionDescription('')
      setEditOptionIsCorrect(false)
      setValidationError(null)
    },
  })

  const deleteOptionMutation = useMutation({
    mutationFn: async (data: { questionId: string; optionId: string }) => {
      return api.delete(
        `/tests/${testId}/questions/${data.questionId}/options/${data.optionId}`,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setDeleteConfirmOption(null)
    },
  })

  const submitAnswersMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      const promises = Object.entries(answers).map(async ([questionId, optionId]) => {
        // Check if user already has an answer for this question
        const existingAnswer = existingAnswers.find(
          (a) => a.testQuestionId === questionId && a.userId === currentUserId
        )

        if (existingAnswer) {
          // Update existing answer
          return api.patch(
            `/tests/${testId}/questions/${questionId}/answers/${existingAnswer.id}`,
            { testQuestionOptionId: optionId }
          )
        } else {
          // Create new answer
          return api.post(`/tests/${testId}/questions/${questionId}/answers`, {
            testQuestionOptionId: optionId,
          })
        }
      })
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] })
      setHasSubmitted(true)
      setIsAnsweringMode(false)
    },
  })

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const result = createQuestionSchema.safeParse({ question: newQuestion })
    if (!result.success) {
      setValidationError(result.error.issues[0].message)
      return
    }

    createQuestionMutation.mutate(result.data)
  }

  const handleCreateOption = (e: React.FormEvent, questionId: string) => {
    e.preventDefault()
    setValidationError(null)

    const result = createOptionSchema.safeParse({
      description: newOptionDescription,
      isCorrect: newOptionIsCorrect,
    })
    if (!result.success) {
      setValidationError(result.error.issues[0].message)
      return
    }

    createOptionMutation.mutate({
      questionId,
      ...result.data,
    })
  }

  // Edit question handlers
  const handleEditQuestion = (questionId: string, questionText: string) => {
    setEditingQuestionId(questionId)
    setEditQuestionText(questionText)
    setValidationError(null)
  }

  const handleUpdateQuestion = (e: React.FormEvent, questionId: string) => {
    e.preventDefault()
    setValidationError(null)

    const result = createQuestionSchema.safeParse({
      question: editQuestionText,
    })
    if (!result.success) {
      setValidationError(result.error.issues[0].message)
      return
    }

    updateQuestionMutation.mutate({
      questionId,
      question: result.data.question,
    })
  }

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null)
    setEditQuestionText('')
    setValidationError(null)
  }

  // Delete question handlers
  const handleDeleteQuestion = (questionId: string, questionText: string) => {
    setDeleteConfirmQuestion({ questionId, questionText })
  }

  const confirmDeleteQuestion = () => {
    if (deleteConfirmQuestion) {
      deleteQuestionMutation.mutate(deleteConfirmQuestion.questionId)
    }
  }

  // Edit option handlers
  const handleEditOption = (
    optionId: string,
    description: string,
    isCorrect: boolean,
  ) => {
    setEditingOptionId(optionId)
    setEditOptionDescription(description)
    setEditOptionIsCorrect(isCorrect)
    setValidationError(null)
  }

  const handleUpdateOption = (
    e: React.FormEvent,
    questionId: string,
    optionId: string,
  ) => {
    e.preventDefault()
    setValidationError(null)

    const result = createOptionSchema.safeParse({
      description: editOptionDescription,
      isCorrect: editOptionIsCorrect,
    })
    if (!result.success) {
      setValidationError(result.error.issues[0].message)
      return
    }

    updateOptionMutation.mutate({
      questionId,
      optionId,
      ...result.data,
    })
  }

  const handleCancelEditOption = () => {
    setEditingOptionId(null)
    setEditOptionDescription('')
    setEditOptionIsCorrect(false)
    setValidationError(null)
  }

  // Delete option handlers
  const handleDeleteOption = (
    questionId: string,
    optionId: string,
    optionDescription: string,
  ) => {
    setDeleteConfirmOption({ questionId, optionId, optionDescription })
  }

  const confirmDeleteOption = () => {
    if (deleteConfirmOption) {
      deleteOptionMutation.mutate({
        questionId: deleteConfirmOption.questionId,
        optionId: deleteConfirmOption.optionId,
      })
    }
  }

  // Answer handlers
  const handleStartAnswering = () => {
    // Initialize with existing answers if any
    if (existingAnswers && currentUserId) {
      const answersMap: Record<string, string> = {}
      existingAnswers
        .filter((answer) => answer.userId === currentUserId)
        .forEach((answer) => {
          answersMap[answer.testQuestionId] = answer.testQuestionOptionId
        })
      setSelectedAnswers(answersMap)
    }
    setIsAnsweringMode(true)
    setHasSubmitted(false)
  }

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  const handleSubmitAnswers = () => {
    submitAnswersMutation.mutate(selectedAnswers)
  }

  const handleCancelAnswering = () => {
    setIsAnsweringMode(false)
    setSelectedAnswers({})
  }

  // Define columns for results table
  const columns = useMemo<ColumnDef<Result>[]>(
    () => [
      {
        accessorKey: 'user.name',
        header: 'Participante',
        cell: (info) => {
          const result = info.row.original
          return (
            <div>
              <p className="font-medium text-white">{result.user.name}</p>
              <p className="text-sm text-gray-400">{result.user.email}</p>
            </div>
          )
        },
      },
      {
        accessorKey: 'score',
        header: 'Resultado',
        cell: (info) => {
          const score = info.getValue() as number
          return (
            <div className="flex items-center gap-2">
              <div className="font-semibold text-white text-lg">{score}%</div>
              {score >= 70 ? (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Aprovado
                </span>
              ) : (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                  Reprovado
                </span>
              )}
            </div>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: test?.results || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isCreator = test?.creator?.id === currentUserId
  const isAssignee = assignees?.some((a) => a.userId === currentUserId)
  const hasAnswered = existingAnswers && existingAnswers.length > 0
  const now = new Date()
  const testStartDate = test ? new Date(test.startDate) : null
  const testEndDate = test ? new Date(test.endDate) : null
  const isTestActive = testStartDate && testEndDate && now >= testStartDate && now <= testEndDate
  const canAnswer = !isCreator && isAssignee && isTestActive
  const isTestNotStarted = testStartDate && now < testStartDate
  const isTestEnded = testEndDate && now > testEndDate

  if (testLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Teste não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 h-full overflow-y-auto">
        {/* Test Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-cyan-500/20 rounded-full">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-4">
                {test.title}
              </h1>
              <p className="text-gray-300 text-lg mb-6">{test.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>
                    Início: {new Date(test.startDate).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>
                    Término: {new Date(test.endDate).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ErrorDisplay
          error={testError}
          fallbackMessage="Falha ao carregar detalhes do teste. Tente novamente."
        />

        {/* Questions Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Questões</h2>
            <div className="flex gap-2">
              {canAnswer && !isAnsweringMode && (
                <button
                  onClick={handleStartAnswering}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <FileText size={20} />
                  {hasAnswered ? 'Editar Respostas' : 'Responder Teste'}
                </button>
              )}
              {isCreator && !isAnsweringMode && (
                <button
                  onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Nova Questão
                </button>
              )}
            </div>
          </div>

          {!isCreator && isAssignee && isTestNotStarted && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-semibold">
                  Este teste ainda não iniciou. Ele estará disponível a partir de {testStartDate?.toLocaleString('pt-BR')}.
                </p>
              </div>
            </div>
          )}

          {!isCreator && isAssignee && isTestEnded && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-semibold">
                  Este teste já encerrou em {testEndDate?.toLocaleString('pt-BR')}. Não é mais possível responder.
                </p>
              </div>
            </div>
          )}

          {validationError && (
            <ErrorDisplay
              error={new Error(validationError)}
              fallbackMessage="Erro de validação"
            />
          )}

          <ErrorDisplay
            error={createQuestionMutation.error}
            fallbackMessage="Falha ao criar questão. Tente novamente."
          />

          <ErrorDisplay
            error={createOptionMutation.error}
            fallbackMessage="Falha ao criar alternativa. Tente novamente."
          />

          <ErrorDisplay
            error={submitAnswersMutation.error}
            fallbackMessage="Falha ao enviar respostas. Tente novamente."
          />

          {hasSubmitted && (
            <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-semibold">
                  Respostas enviadas com sucesso!
                </p>
              </div>
            </div>
          )}

          {isAnsweringMode && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-blue-400 font-semibold">
                  Modo de resposta ativo - Selecione uma alternativa para cada questão
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitAnswers}
                    disabled={submitAnswersMutation.isPending || Object.keys(selectedAnswers).length !== questions?.length}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitAnswersMutation.isPending ? 'Enviando...' : 'Enviar Respostas'}
                  </button>
                  <button
                    onClick={handleCancelAnswering}
                    disabled={submitAnswersMutation.isPending}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              {questions && Object.keys(selectedAnswers).length < questions.length && (
                <p className="text-blue-300 text-sm mt-2">
                  {Object.keys(selectedAnswers).length} de {questions.length} questões respondidas
                </p>
              )}
            </div>
          )}

          {isAddingQuestion && (
            <form
              onSubmit={handleCreateQuestion}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6"
            >
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
                placeholder="Digite a questão..."
                rows={3}
                required
                disabled={createQuestionMutation.isPending}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createQuestionMutation.isPending}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {createQuestionMutation.isPending
                    ? 'Criando...'
                    : 'Criar Questão'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingQuestion(false)
                    setNewQuestion('')
                    setValidationError(null)
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {questions?.map((question, index) => (
              <div
                key={question.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
              >
                {editingQuestionId === question.id ? (
                  /* Edit Question Form */
                  <form
                    onSubmit={(e) => handleUpdateQuestion(e, question.id)}
                    className="mb-4"
                  >
                    <textarea
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                      placeholder="Digite a questão..."
                      rows={3}
                      required
                      disabled={updateQuestionMutation.isPending}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateQuestionMutation.isPending}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updateQuestionMutation.isPending
                          ? 'Salvando...'
                          : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditQuestion}
                        disabled={updateQuestionMutation.isPending}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Question Title with Actions */
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex-1">
                      {index + 1}. {question.question}
                    </h3>
                    {isCreator && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() =>
                            handleEditQuestion(question.id, question.question)
                          }
                          className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                          title="Editar questão"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteQuestion(question.id, question.question)
                          }
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Excluir questão"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {question.options?.map((option) => (
                    <div key={option.id}>
                      {editingOptionId === option.id && isCreator ? (
                        /* Edit Option Form */
                        <form
                          onSubmit={(e) =>
                            handleUpdateOption(e, question.id, option.id)
                          }
                          className="p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                        >
                          <input
                            value={editOptionDescription}
                            onChange={(e) =>
                              setEditOptionDescription(e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                            placeholder="Descrição da alternativa..."
                            required
                            disabled={updateOptionMutation.isPending}
                          />
                          <div className="flex items-center gap-4 mb-3">
                            <label className="flex items-center gap-2 text-gray-300">
                              <input
                                type="checkbox"
                                checked={editOptionIsCorrect}
                                onChange={(e) =>
                                  setEditOptionIsCorrect(e.target.checked)
                                }
                                className="w-4 h-4"
                                disabled={updateOptionMutation.isPending}
                              />
                              Alternativa correta
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={updateOptionMutation.isPending}
                              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50"
                            >
                              {updateOptionMutation.isPending
                                ? 'Salvando...'
                                : 'Salvar'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditOption}
                              disabled={updateOptionMutation.isPending}
                              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Option Display */
                        <div
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isAnsweringMode
                              ? selectedAnswers[question.id] === option.id
                                ? 'bg-cyan-500/20 border-cyan-500'
                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                              : option.isCorrect && isCreator
                              ? 'bg-green-500/10 border-green-500/50'
                              : 'bg-slate-700/50 border-slate-600'
                          }`}
                          onClick={() =>
                            isAnsweringMode &&
                            handleSelectAnswer(question.id, option.id)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {isAnsweringMode && (
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  checked={selectedAnswers[question.id] === option.id}
                                  onChange={() => handleSelectAnswer(question.id, option.id)}
                                  className="w-4 h-4 text-cyan-500"
                                />
                              )}
                              <span className="text-gray-300 flex-1">
                                {option.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isAnsweringMode && option.isCorrect && isCreator && (
                                <span className="text-xs text-green-400 font-semibold">
                                  Correta
                                </span>
                              )}
                              {isCreator && !isAnsweringMode && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditOption(
                                        option.id,
                                        option.description,
                                        option.isCorrect,
                                      )
                                    }}
                                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                                    title="Editar alternativa"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteOption(
                                        question.id,
                                        option.id,
                                        option.description,
                                      )
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                    title="Excluir alternativa"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Option Form */}
                {isCreator && selectedQuestionId === question.id ? (
                  <form
                    onSubmit={(e) => handleCreateOption(e, question.id)}
                    className="mt-4 p-4 bg-slate-700/30 rounded-lg"
                  >
                    <input
                      value={newOptionDescription}
                      onChange={(e) => setNewOptionDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                      placeholder="Descrição da alternativa..."
                      required
                      disabled={createOptionMutation.isPending}
                    />
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center gap-2 text-gray-300">
                        <input
                          type="checkbox"
                          checked={newOptionIsCorrect}
                          onChange={(e) =>
                            setNewOptionIsCorrect(e.target.checked)
                          }
                          className="w-4 h-4"
                          disabled={createOptionMutation.isPending}
                        />
                        Alternativa correta
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={createOptionMutation.isPending}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {createOptionMutation.isPending
                          ? 'Adicionando...'
                          : 'Adicionar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestionId(null)
                          setNewOptionDescription('')
                          setNewOptionIsCorrect(false)
                          setValidationError(null)
                        }}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  isCreator && (
                    <button
                      onClick={() => setSelectedQuestionId(question.id)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                    >
                      + Adicionar Alternativa
                    </button>
                  )
                )}
              </div>
            ))}
          </div>

          {(!questions || questions.length === 0) && !isAddingQuestion && (
            <div className="text-center py-12 text-gray-400">
              Nenhuma questão adicionada ainda
            </div>
          )}
        </div>

        {/* Assignees Section - Only visible to creator */}
        {isCreator && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Participantes</h2>
              <button
                onClick={() => setIsAddParticipantsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Wrench size={20} />
                Gerenciar participantes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignees?.map((assignee) => {
                const hasAnswered = hasUserAnswered(assignee.userId)
                return (
                  <div
                    key={assignee.id}
                    onClick={() =>
                      setViewAnswersUser({
                        userId: assignee.userId,
                        userName: assignee.user?.name || 'Usuário',
                      })
                    }
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-full">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {assignee.user?.name || 'Usuário'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {assignee.user?.email || assignee.userId}
                        </p>
                      </div>
                      {hasAnswered ? (
                        <div className="flex items-center gap-1 text-green-400" title="Respondeu">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500" title="Não respondeu">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {(!assignees || assignees.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                Nenhum participante atribuído ainda
              </div>
            )}
          </div>
        )}

        {test?.results && test.results.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Resultados</h2>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-slate-700"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left px-6 py-4 text-sm font-semibold text-gray-300 bg-slate-800/70"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-700 last:border-0 hover:bg-slate-700/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AddParticipantsModal
          isOpen={isAddParticipantsOpen}
          onClose={() => setIsAddParticipantsOpen(false)}
          testId={testId}
          createdBy={test?.creator?.id}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['test', testId] })}
        />

        {/* View Answers Modal */}
        <ViewAnswersModal
          isOpen={viewAnswersUser !== null}
          onClose={() => setViewAnswersUser(null)}
          testId={testId}
          userId={viewAnswersUser?.userId || ''}
          userName={viewAnswersUser?.userName || ''}
          questions={questions}
        />

        {/* Delete Question Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmQuestion !== null}
          onClose={() => setDeleteConfirmQuestion(null)}
          onConfirm={confirmDeleteQuestion}
          title="Excluir Questão"
          description={`Tem certeza que deseja excluir a questão "${deleteConfirmQuestion?.questionText}"? Esta ação não pode ser desfeita e todas as alternativas serão removidas.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          isLoading={deleteQuestionMutation.isPending}
        />

        {/* Delete Option Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmOption !== null}
          onClose={() => setDeleteConfirmOption(null)}
          onConfirm={confirmDeleteOption}
          title="Excluir Alternativa"
          description={`Tem certeza que deseja excluir a alternativa "${deleteConfirmOption?.optionDescription}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          isLoading={deleteOptionMutation.isPending}
        />
      </div>
    </div>
  )
}
