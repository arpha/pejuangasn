'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Clock, 
  Flag, 
  HelpCircle, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useExamStore } from '@/store/useExamStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MathText from '@/components/MathText';

export default function CATExamPage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params.packageId as string;

  const {
    attemptId,
    examId,
    questions,
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    timeLeft,
    isActive,
    selectOption,
    toggleFlag,
    setCurrentQuestionIndex,
    tick,
    resetExam,
  } = useExamStore();

  const [, setTabWarnings] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Helper to calculate scores
  const calculateScores = useCallback(() => {
    let scoreTwk = 0;
    let scoreTiu = 0;
    let scoreTkp = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return; // Answered nothing (0 pts)

      if (q.category === 'TWK') {
        if (userAnswer === q.correct_option) scoreTwk += 5;
      } else if (q.category === 'TIU') {
        if (userAnswer === q.correct_option) scoreTiu += 5;
      } else if (q.category === 'TKP') {
        if (q.scale_points) {
          scoreTkp += q.scale_points[userAnswer] || 0;
        }
      }
    });

    const scoreTotal = scoreTwk + scoreTiu + scoreTkp;

    // Passing Grade Criteria:
    // TWK >= 65, TIU >= 80, TKP >= 166
    const isPassed = scoreTwk >= 65 && scoreTiu >= 80 && scoreTkp >= 166;

    return { scoreTwk, scoreTiu, scoreTkp, scoreTotal, isPassed };
  }, [questions, answers]);

  // Submit Exam Mutation
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error('Attempt ID tidak ditemukan');

      const scores = calculateScores();

      // Update exam attempt in database
      const { data, error } = await supabase
        .from('exam_attempts')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          score_twk: scores.scoreTwk,
          score_tiu: scores.scoreTiu,
          score_tkp: scores.scoreTkp,
          score_total: scores.scoreTotal,
          is_passed: scores.isPassed,
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      isSubmittedRef.current = true;
      setIsSubmitted(true);
      toast.success('Ujian berhasil diserahkan!');
      resetExam();
      router.push(`/tryout/${packageId}/result?attemptId=${data.id}`);
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(error.message || 'Gagal menyerahkan ujian');
    },
  });

  const handleAutoSubmit = useCallback(() => {
    setIsAutoSubmitting(true);
    submitExamMutation.mutate();
  }, [submitExamMutation]);

  // 1. Redirect if exam is not active or belongs to another package
  useEffect(() => {
    if (isSubmitted) return;

    if (!isActive || examId !== packageId) {
      toast.error('Tidak ada sesi ujian aktif untuk paket ini.');
      router.push('/tryout');
    }
  }, [isActive, examId, packageId, router, isSubmitted]);

  // 2. Timer Tick Effect
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, tick]);

  // 3. Auto-Submit when Time Expires
  useEffect(() => {
    if (isActive && timeLeft <= 0) {
      toast.warning('Waktu habis! Menyerahkan ujian Anda secara otomatis...');
      handleAutoSubmit();
    }
  }, [timeLeft, isActive, handleAutoSubmit]);

  // 4. Cheat Protection (Tab switching detection)
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarnings((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error('Peringatan terakhir dilanggar! Menyerahkan ujian secara otomatis.');
            handleAutoSubmit();
          } else {
            toast.warning(`Deteksi perpindahan tab/layar! Peringatan ${next}/3. Ujian akan otomatis disubmit jika melanggar lagi.`);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, handleAutoSubmit]);

  // 5. Prevent accidental browser tab close and warn user
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && !isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = 'Apakah Anda yakin ingin meninggalkan ujian? Sesi ujian akan diakhiri secara otomatis dan tidak dapat dilanjutkan.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive]);

  // 6. Terminate session and save current answers to KELUAR on page exit (unmount)
  useEffect(() => {
    return () => {
      // Check if we are actually navigating away from the exam page (to avoid React Strict Mode double-mount reset)
      const isNavigatingAway = typeof window !== 'undefined' && window.location.pathname !== `/tryout/${packageId}/exam`;

      if (isNavigatingAway && !isSubmittedRef.current && attemptId) {
        const scores = calculateScores();

        // Mark attempt as completed on database (exited status)
        supabase
          .from('exam_attempts')
          .update({
            status: 'KELUAR',
            completed_at: new Date().toISOString(),
            score_twk: scores.scoreTwk,
            score_tiu: scores.scoreTiu,
            score_tkp: scores.scoreTkp,
            score_total: scores.scoreTotal,
            is_passed: scores.isPassed,
          })
          .eq('id', attemptId)
          .then(({ error }) => {
            if (error) {
              console.error('Gagal menyelesaikan ujian pada saat keluar:', error);
            }
          });

        resetExam();
      }
    };
  }, [attemptId, calculateScores, resetExam, packageId]);

  // 5. Save Answer to Database (Debounced)
  const saveAnswerToDb = async (qId: string, option: string) => {
    if (!attemptId) return;

    try {
      // Find question to calculate points (mostly for TKP, TWK/TIU will be calculated on submit)
      const currentQuestion = questions.find((q) => q.id === qId);
      let points = 0;

      if (currentQuestion?.category === 'TKP' && currentQuestion.scale_points) {
        points = currentQuestion.scale_points[option] || 0;
      } else if (currentQuestion && currentQuestion.correct_option === option) {
        points = 5;
      }

      await supabase.from('user_answers').upsert(
        {
          attempt_id: attemptId,
          question_id: qId,
          selected_option: option,
          points_earned: points,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id,question_id' }
      );
    } catch (err) {
      console.error('Error saving answer to database:', err);
    }
  };

  const handleSelectOption = (qId: string, option: string) => {
    selectOption(qId, option);

    // Debounce database sync to avoid throttling
    if (saveTimeoutRef.current[qId]) {
      clearTimeout(saveTimeoutRef.current[qId]);
    }

    saveTimeoutRef.current[qId] = setTimeout(() => {
      saveAnswerToDb(qId, option);
    }, 1000);
  };

  if (!isActive || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm">Menyiapkan lembar jawaban...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = answers[currentQuestion.id] || null;
  const isFlagged = flaggedQuestions[currentQuestion.id] || false;

  // Format Time Left
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 60 * 5; // Less than 5 minutes

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      
      {/* Sticky Mobile Header for Timer & Info */}
      <div className="lg:hidden sticky top-16 z-30 bg-card border-b border-border p-4 flex items-center justify-between -mx-6 mb-2 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Soal {currentQuestionIndex + 1} dari {questions.length}</span>
          <span className={`text-xs font-bold ${
            currentQuestion.category === 'TWK' 
              ? 'text-red-600 dark:text-red-400' 
              : currentQuestion.category === 'TIU' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>Kategori: {currentQuestion.category} {currentQuestion.sub_category && `| Sub: ${currentQuestion.sub_category}`}</span>
        </div>
        <div className={`text-xl font-black font-mono tracking-wider flex items-center gap-1.5 ${
          isLowTime ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
        }`}>
          <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Question Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                currentQuestion.category === 'TWK' 
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                  : currentQuestion.category === 'TIU' 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                  : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
              }`}>
                Kategori: {currentQuestion.category}
              </span>
              {currentQuestion.sub_category && (
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
                  Sub: {currentQuestion.sub_category}
                </span>
              )}
              {currentQuestion.difficulty && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  currentQuestion.difficulty === 'MUDAH'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : currentQuestion.difficulty === 'SULIT'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              Soal {currentQuestionIndex + 1} dari {questions.length}
            </span>
          </div>

          {/* Question Panel */}
          <Card className="bg-card border-border shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-between">
            <CardHeader className="border-b border-border/60 pb-6">
              <div className="text-foreground text-base sm:text-lg leading-relaxed">
                <MathText text={currentQuestion.question_text} />
              </div>
              {currentQuestion.image_url && (
                <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-80 w-full bg-muted flex items-center justify-center p-2">
                  <img src={currentQuestion.image_url} alt="Soal Bergambar" className="max-h-72 object-contain rounded-lg" />
                </div>
              )}
            </CardHeader>

            <CardContent className="py-6 space-y-3">
              {/* Options List */}
              {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                const optionKey = `option_${opt.toLowerCase()}` as keyof typeof currentQuestion;
                const optionText = currentQuestion[optionKey] as string;
                const imageKey = `option_${opt.toLowerCase()}_image_url` as keyof typeof currentQuestion;
                const optionImageUrl = currentQuestion[imageKey] as string | undefined | null;
                const isChecked = selectedOption === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(currentQuestion.id, opt)}
                    className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      isChecked
                        ? 'bg-indigo-500/10 border-indigo-600 dark:border-indigo-400 text-indigo-900 dark:text-indigo-200 font-semibold shadow-sm'
                        : 'bg-muted/10 border-border text-foreground hover:bg-muted/30 hover:text-foreground'
                    }`}
                  >
                    <span className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center border font-bold text-xs ${
                      isChecked
                        ? 'bg-indigo-600 border-transparent text-white'
                        : 'border-border text-muted-foreground bg-background'
                    }`}>
                      {opt}
                    </span>
                    <span className="flex-1 flex flex-col gap-2">
                      <span className="text-sm sm:text-base leading-snug"><MathText text={optionText} /></span>
                      {optionImageUrl && (
                        <span className="border border-border rounded-lg overflow-hidden max-h-48 w-fit bg-muted flex items-center justify-center p-1">
                          <img src={optionImageUrl} alt={`Pilihan ${opt}`} className="max-h-40 object-contain rounded" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </CardContent>

            {/* Navigation Actions Footer */}
            <CardFooter className="border-t border-border/60 p-6 flex justify-between items-center bg-muted/20">
              <Button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted px-5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Sebelumnya
              </Button>

              <Button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`font-semibold transition-all ${
                  isFlagged
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                    : 'bg-card border border-border text-amber-600 dark:text-amber-500 hover:bg-muted'
                }`}
              >
                <Flag className={`h-4 w-4 mr-2 ${isFlagged ? 'fill-current' : ''}`} />
                {isFlagged ? 'Ragu-Ragu (Aktif)' : 'Ragu-Ragu'}
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5"
                >
                  Berikutnya <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">
                        Selesai Ujian <Check className="h-4 w-4 ml-2" />
                      </Button>
                    }
                  />
                  <DialogContent className="bg-card border border-border shadow-lg">
                    <DialogHeader>
                      <DialogTitle className="text-foreground text-lg font-bold">Kumpulkan Lembar Jawaban?</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Anda masih memiliki waktu sisa. Pastikan semua jawaban telah terisi dengan benar.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                      <Button variant="ghost" onClick={() => setIsSubmitDialogOpen(false)} className="text-muted-foreground hover:bg-muted">
                        Batal
                      </Button>
                      <Button
                        onClick={() => {
                          setIsSubmitDialogOpen(false);
                          handleAutoSubmit();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        Kumpulkan Sekarang
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Timer & Grid Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Timer Card */}
          <Card className="bg-card border-border shadow-sm p-6 hidden lg:flex flex-col items-center">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Sisa Waktu</p>
            <div className={`text-3xl font-black font-mono tracking-wider mt-2 flex items-center gap-2 ${
              isLowTime ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
            }`}>
              <Clock className="h-7 w-7" /> {formatTime(timeLeft)}
            </div>
          </Card>

          {/* Question Grid Panel */}
          <Card className="bg-card border-border shadow-sm p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wider">
              <HelpCircle className="h-4 w-4" /> Navigasi Soal
            </h4>
            
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isQFlagged = flaggedQuestions[q.id] || false;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center border transition-all ${
                      isCurrent
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-600 text-white ring-2 ring-indigo-500/20'
                        : isQFlagged
                        ? 'bg-amber-500 text-slate-950 border-transparent font-black'
                        : isAnswered
                        ? 'bg-emerald-600 text-white border-transparent'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border text-xs font-medium text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded bg-emerald-600 shrink-0" />
                <span>Sudah dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded bg-amber-500 shrink-0" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded bg-muted/40 border border-border shrink-0" />
                <span>Belum dikerjakan</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Auto submit overlay loader */}
      {isAutoSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-foreground font-bold mt-4">Menyerahkan Lembar Ujian...</p>
          <p className="text-muted-foreground text-sm mt-2">Mohon tunggu, skor Anda sedang dikalkulasikan.</p>
        </div>
      )}
    </div>
  );
}
