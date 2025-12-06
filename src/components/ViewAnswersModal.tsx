import { useMemo } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface Question {
  id: string
  question: string
  options?: QuestionOption[]
  answers?: Answer[]
}

interface QuestionOption {
  id: string
  description: string
  isCorrect: boolean
}

interface Answer {
  id: string
  testQuestionId: string
  testQuestionOptionId: string
  userId: string
}

interface ViewAnswersModalProps {
  isOpen: boolean
  onClose: () => void
  testId: string
  userId: string
  userName: string
  questions?: Question[]
}

export function ViewAnswersModal({
  isOpen,
  onClose,
  userId,
  userName,
  questions,
}: ViewAnswersModalProps) {
  const userAnswers = useMemo(() => {
    if (!questions) return []
    const answers: Answer[] = []
    questions.forEach((question) => {
      if (question.answers) {
        const userAnswer = question.answers.find((a) => a.userId === userId)
        if (userAnswer) {
          answers.push(userAnswer)
        }
      }
    })
    return answers
  }, [questions, userId])

  if (!isOpen) return null

  const getAnswerForQuestion = (questionId: string) => {
    return userAnswers?.find((a) => a.testQuestionId === questionId)
  }

  const getOptionById = (question: Question, optionId: string) => {
    return question.options?.find((o) => o.id === optionId)
  }

  const calculateScore = () => {
    if (!questions || !userAnswers) return 0
    let correct = 0
    questions.forEach((question) => {
      const answer = getAnswerForQuestion(question.id)
      if (answer) {
        const option = getOptionById(question, answer.testQuestionOptionId)
        if (option?.isCorrect) {
          correct++
        }
      }
    })
    return Math.round((correct / questions.length) * 100)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Respostas de {userName}</h2>
            {userAnswers && questions && (
              <p className="text-gray-400 mt-1">
                Pontuação: <span className="text-white font-semibold">{calculateScore()}%</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!userAnswers || userAnswers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Este participante ainda não respondeu ao teste.
            </div>
          ) : (
            <div className="space-y-6">
              {questions?.map((question, index) => {
                const answer = getAnswerForQuestion(question.id)
                const selectedOption = answer
                  ? getOptionById(question, answer.testQuestionOptionId)
                  : null

                return (
                  <div
                    key={question.id}
                    className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
                  >
                    <h3 className="text-white font-semibold mb-3">
                      {index + 1}. {question.question}
                    </h3>

                    <div className="space-y-2">
                      {question.options?.map((option) => {
                        const isSelected = selectedOption?.id === option.id
                        const isCorrect = option.isCorrect

                        return (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border ${
                              isSelected && isCorrect
                                ? 'bg-green-500/20 border-green-500'
                                : isSelected && !isCorrect
                                ? 'bg-red-500/20 border-red-500'
                                : isCorrect
                                ? 'bg-green-500/10 border-green-500/50'
                                : 'bg-slate-700/50 border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300 flex-1">
                                {option.description}
                              </span>
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <span className="text-xs font-semibold text-white">
                                    Selecionada
                                  </span>
                                )}
                                {isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : isSelected ? (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {!answer && (
                      <p className="text-yellow-400 text-sm mt-2">
                        Questão não respondida
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
