import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Calendar, FileText, ClipboardList } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorDisplay } from '../components/ErrorDisplay'

export const Route = createFileRoute('/assigned-tests')({
  component: AssignedTests,
})

interface Test {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  createdAt?: string
}

function AssignedTests() {
  const {
    data: tests,
    isLoading,
    error,
  } = useQuery<Test[]>({
    queryKey: ['assigned-tests'],
    queryFn: () => api.get('/tests/assigned'),
  })

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 h-full overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-full">
              <ClipboardList className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Meus Testes</h1>
          </div>
          <p className="text-xl text-gray-300">
            Testes atribuídos a você
          </p>
        </div>

        <ErrorDisplay
          error={error}
          fallbackMessage="Falha ao carregar testes. Tente novamente."
        />

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
                          Início:{' '}
                          {new Date(test.startDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Calendar size={14} />
                        <span>
                          Término:{' '}
                          {new Date(test.endDate).toLocaleDateString('pt-BR')}
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
            <div className="text-gray-400 text-lg">
              Nenhum teste atribuído a você
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
