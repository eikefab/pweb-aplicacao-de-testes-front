import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Calendar, FileText, Users, Plus } from 'lucide-react'
import { z } from 'zod'
import { api } from '../../lib/api'

export const Route = createFileRoute('/tests/$testId')({ component: TestDetail })

interface Test {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  createdAt?: string
}

interface Question {
  id: string
  question: string
  createdBy: string
  createdAt?: string
  options?: QuestionOption[]
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

const createQuestionSchema = z.object({
  question: z.string().min(1).max(1024),
})

const createOptionSchema = z.object({
  description: z.string().min(1).max(512),
  isCorrect: z.boolean(),
})

function TestDetail() {
  const { testId } = Route.useParams()
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [newOptionDescription, setNewOptionDescription] = useState('')
  const [newOptionIsCorrect, setNewOptionIsCorrect] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ['test', testId],
    queryFn: () => api.get(`/tests/${testId}`),
  })

  const { data: questions, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: ['questions', testId],
    queryFn: () => api.get(`/tests/${testId}/questions`),
  })

  const { data: assignees } = useQuery<Assignee[]>({
    queryKey: ['assignees', testId],
    queryFn: () => api.get(`/tests/${testId}/assignees`),
  })

  const createQuestionMutation = useMutation({
    mutationFn: async (data: { question: string }) => {
      return api.post(`/tests/${testId}/questions`, data)
    },
    onSuccess: () => {
      refetchQuestions()
      setNewQuestion('')
      setIsAddingQuestion(false)
      setValidationError(null)
    },
  })

  const createOptionMutation = useMutation({
    mutationFn: async (data: { questionId: string; description: string; isCorrect: boolean }) => {
      return api.post(`/questions/${data.questionId}/options`, {
        description: data.description,
        isCorrect: data.isCorrect,
      })
    },
    onSuccess: () => {
      refetchQuestions()
      setNewOptionDescription('')
      setNewOptionIsCorrect(false)
      setSelectedQuestionId(null)
      setValidationError(null)
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

  if (testLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Teste não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 h-full overflow-y-auto">
        {/* Test Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-cyan-500/20 rounded-full">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-4">{test.title}</h1>
              <p className="text-gray-300 text-lg mb-6">{test.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>Início: {new Date(test.startDate).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>Término: {new Date(test.endDate).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Questões</h2>
            <button
              onClick={() => setIsAddingQuestion(!isAddingQuestion)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus size={20} />
              Nova Questão
            </button>
          </div>

          {validationError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
              {validationError}
            </div>
          )}

          {isAddingQuestion && (
            <form onSubmit={handleCreateQuestion} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
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
                  {createQuestionMutation.isPending ? 'Criando...' : 'Criar Questão'}
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
                <h3 className="text-lg font-semibold text-white mb-4">
                  {index + 1}. {question.question}
                </h3>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {question.options?.map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border ${
                        option.isCorrect
                          ? 'bg-green-500/10 border-green-500/50'
                          : 'bg-slate-700/50 border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">{option.description}</span>
                        {option.isCorrect && (
                          <span className="text-xs text-green-400 font-semibold">Correta</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Option Form */}
                {selectedQuestionId === question.id ? (
                  <form onSubmit={(e) => handleCreateOption(e, question.id)} className="mt-4 p-4 bg-slate-700/30 rounded-lg">
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
                          onChange={(e) => setNewOptionIsCorrect(e.target.checked)}
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
                        {createOptionMutation.isPending ? 'Adicionando...' : 'Adicionar'}
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
                  <button
                    onClick={() => setSelectedQuestionId(question.id)}
                    className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    + Adicionar Alternativa
                  </button>
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

        {/* Assignees Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Participantes</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignees?.map((assignee) => (
              <div
                key={assignee.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-full">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{assignee.user?.name || 'Usuário'}</p>
                    <p className="text-gray-400 text-sm">{assignee.user?.email || assignee.userId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!assignees || assignees.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              Nenhum participante atribuído ainda
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
