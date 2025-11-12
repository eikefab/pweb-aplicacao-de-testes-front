import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Calendar, FileText } from 'lucide-react'
import { api } from '../../lib/api'
import TestModal from '../../components/TestModal'

export const Route = createFileRoute('/tests/')({ component: Tests })

interface Test {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  createdAt?: string
}

function Tests() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: tests, isLoading, refetch } = useQuery<Test[]>({
    queryKey: ['tests'],
    queryFn: () => api.get('/tests'),
  })

  return (
    <div className="min-h-screen max-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Testes</h1>
            <p className="text-gray-300">Gerencie os testes do sistema</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus size={20} />
            Novo Teste
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Carregando...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests?.map((test) => (
              <Link
                key={test.id}
                to="/tests/$testId"
                params={{ testId: test.id }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-full">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {test.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {test.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Calendar size={14} />
                        <span>
                          Início: {new Date(test.startDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Calendar size={14} />
                        <span>
                          Término: {new Date(test.endDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && (!tests || tests.length === 0) && (
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg mb-4">Nenhum teste encontrado</div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Criar o primeiro teste
            </button>
          </div>
        )}
      </div>

      <TestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
