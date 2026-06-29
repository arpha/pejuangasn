import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CATState } from '@/types';

export const useExamStore = create<CATState>()(
  persist(
    (set, get) => ({
      attemptId: null,
      examId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: {},
      timeLeft: 0,
      isActive: false,

      startExam: (attemptId, examId, questions, durationMinutes) => {
        set({
          attemptId,
          examId,
          questions,
          currentQuestionIndex: 0,
          answers: {},
          flaggedQuestions: {},
          timeLeft: durationMinutes * 60,
          isActive: true,
        });
      },

      selectOption: (questionId, option) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: option,
          },
        }));
      },

      toggleFlag: (questionId) => {
        set((state) => ({
          flaggedQuestions: {
            ...state.flaggedQuestions,
            [questionId]: !state.flaggedQuestions[questionId],
          },
        }));
      },

      setCurrentQuestionIndex: (index) => {
        set({ currentQuestionIndex: index });
      },

      tick: () => {
        const { timeLeft, isActive } = get();
        if (timeLeft <= 1) {
          set({ timeLeft: 0, isActive: false });
        } else if (isActive) {
          set({ timeLeft: timeLeft - 1 });
        }
      },

      setTimeLeft: (time) => {
        set({ timeLeft: time });
      },

      resetExam: () => {
        set({
          attemptId: null,
          examId: null,
          questions: [],
          currentQuestionIndex: 0,
          answers: {},
          flaggedQuestions: {},
          timeLeft: 0,
          isActive: false,
        });
      },
    }),
    {
      name: 'pejuangasn-cat-session', // Local storage key
    }
  )
);
