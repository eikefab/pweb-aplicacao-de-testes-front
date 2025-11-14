import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { X } from 'lucide-react'
import { z } from 'zod'
import { api } from '../lib/api'
import { ErrorDisplay } from './ErrorDisplay'

const createTestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(1024),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
})

type CreateTestInput = z.infer<typeof createTestSchema>

interface TestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function TestModal({
  isOpen,
  onClose,
  onSuccess,
}: TestModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const createTestMutation = useMutation({
    mutationFn: async (data: CreateTestInput) => {
      return api.post('/tests', data)
    },
    onSuccess: () => {
      onClose()
      onSuccess?.()
      // Reset form
      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setValidationError(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const data = { title, description, startDate, endDate }

    const result = createTestSchema.safeParse(data)
    if (!result.success) {
      setValidationError(result.error.issues[0].message)
      return
    }

    createTestMutation.mutate(result.data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-slate-800/95 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Criar Teste</h2>
          <p className="text-gray-400 text-sm">
            Preencha os dados do novo teste
          </p>
        </div>

        {validationError && (
          <ErrorDisplay
            error={new Error(validationError)}
            fallbackMessage="Erro de validação"
          />
        )}

        <ErrorDisplay
          error={createTestMutation.error}
          fallbackMessage="Falha ao criar teste. Tente novamente."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Digite o título do teste"
              required
              disabled={createTestMutation.isPending}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
              placeholder="Descreva o teste"
              required
              disabled={createTestMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Data de Início
              </label>
              <input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={createTestMutation.isPending}
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Data de Término
              </label>
              <input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={createTestMutation.isPending}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createTestMutation.isPending}
            className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {createTestMutation.isPending ? 'Criando...' : 'Criar Teste'}
          </button>
        </form>
      </div>
    </div>
  )
}
