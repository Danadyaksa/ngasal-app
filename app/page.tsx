"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { Question } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const parseAndCleanQuestion = (q: Question): Question => {
  let questionText = q.question || "";
  let correctAnswer = q.correctAnswer || "";
  let acceptableAnswers: string[] = [];

  // Match metadata pattern using case-insensitive and flexible regex
  const metadataRegex = /📝\s*Soal\s*(Isian\s*Singkat|Pilihan\s*Ganda|Essay|Isian)[\s\S]*/i;
  
  const match = questionText.match(metadataRegex);
  if (match) {
    const metadataBlock = match[0];
    
    // Slice off the metadata from the question text
    questionText = questionText.replace(metadataBlock, "").trim();

    // If correctAnswer is empty or null, try to extract it from the metadata block
    if (!correctAnswer) {
      const answerRegex = /✅\s*Jawaban:\s*([^\(\n]+)/i;
      const answerMatch = metadataBlock.match(answerRegex);
      if (answerMatch) {
        correctAnswer = answerMatch[1].trim();
        
        // Remove trailing Grade metadata if captured
        const gradeIdx = correctAnswer.indexOf("(Grade:");
        if (gradeIdx !== -1) {
          correctAnswer = correctAnswer.substring(0, gradeIdx).trim();
        }
        
        // Remove trailing Alternatives metadata if captured
        const altIdx = correctAnswer.toLowerCase().indexOf("alternatif:");
        if (altIdx !== -1) {
          correctAnswer = correctAnswer.substring(0, altIdx).trim();
        }
      }
    }
    
    // Extract alternative answers
    const altRegex = /Alternatif:\s*([^\n]+)/i;
    const altMatch = metadataBlock.match(altRegex);
    if (altMatch) {
      const altText = altMatch[1].trim();
      const alts = altText.split(/[,;]/).map(a => a.trim()).filter(Boolean);
      acceptableAnswers.push(...alts);
    }
  }

  // Double-check clean any leftover emojis or answer keys
  const cleanPatterns = [
    /📝\s*Soal\s*(Isian\s*Singkat|Pilihan\s*Ganda|Essay|Isian)/i,
    /✅\s*Jawaban:/i,
    /\(Grade:\s*\d+%\)/i
  ];

  for (const pat of cleanPatterns) {
    const m = questionText.match(pat);
    if (m && m.index !== undefined) {
      questionText = questionText.substring(0, m.index).trim();
    }
  }

  // Ensure correctAnswer is in acceptableAnswers list
  if (correctAnswer) {
    acceptableAnswers.push(correctAnswer);
  }

  const uniqueAcceptable = Array.from(new Set(acceptableAnswers.map(a => a.trim()))).filter(Boolean);

  return {
    ...q,
    question: questionText.trim(),
    correctAnswer: correctAnswer || "",
    acceptableAnswers: uniqueAcceptable.length > 0 ? uniqueAcceptable : undefined
  };
};

export default function Home() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [isRandomOptionsMode, setIsRandomOptionsMode] = useState(false);
  const [essayInput, setEssayInput] = useState("");
  
  const { theme, setTheme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- Tarik memori pas web pertama kali dimuat ---
  useEffect(() => {
    const savedQuestions = localStorage.getItem("ngasal_questions");
    const savedAnswers = localStorage.getItem("ngasal_answers");
    const savedIndex = localStorage.getItem("ngasal_currentIndex");
    const savedFinished = localStorage.getItem("ngasal_isFinished");

    if (savedQuestions) {
      const parsed = JSON.parse(savedQuestions) as Question[];
      setQuestions(parsed.map(parseAndCleanQuestion));
    }
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
    if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
    if (savedFinished) setIsFinished(JSON.parse(savedFinished));
  }, []);

  // --- Simpan memori otomatis tiap ada aktivitas ---
  useEffect(() => {
    if (questions) {
      localStorage.setItem("ngasal_questions", JSON.stringify(questions));
      localStorage.setItem("ngasal_answers", JSON.stringify(answers));
      localStorage.setItem("ngasal_currentIndex", currentIndex.toString());
      localStorage.setItem("ngasal_isFinished", JSON.stringify(isFinished));
    } else {
      // Bersihkan memori kalau tombol "Kembali ke Beranda" ditekan
      localStorage.removeItem("ngasal_questions");
      localStorage.removeItem("ngasal_answers");
      localStorage.removeItem("ngasal_currentIndex");
      localStorage.removeItem("ngasal_isFinished");
    }
  }, [questions, answers, currentIndex, isFinished]);

  useEffect(() => {
    setEssayInput(answers[currentIndex] || "");
  }, [currentIndex, answers]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData: Question[] = JSON.parse(content);
        
        if (parsedData.length > 0 && parsedData[0].question) {
          let finalQuestions = parsedData.map(parseAndCleanQuestion);
          if (isRandomMode) {
            finalQuestions.sort(() => Math.random() - 0.5);
          }
          if (isRandomOptionsMode) {
            finalQuestions = finalQuestions.map((q) => ({
              ...q,
              options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : [],
            }));
          }

          setQuestions(finalQuestions);
          setCurrentIndex(0);
          setAnswers({});
          setIsFinished(false);
        } else {
          alert("Format JSON tidak sesuai!");
        }
      } catch (error) {
        alert("Gagal membaca file JSON. Pastikan formatnya benar.");
      }
    };
    reader.readAsText(file);
  };

  const handleAnswerSelect = (option: string) => {
    setAnswers((prev) => {
      if (prev[currentIndex] === option) {
        const newAnswers = { ...prev };
        delete newAnswers[currentIndex];
        return newAnswers;
      }
      return { ...prev, [currentIndex]: option };
    });
  };

  const handleEssaySubmit = () => {
    if (!essayInput.trim()) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: essayInput.trim(),
    }));
  };

  const handleEssayReset = () => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentIndex];
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRetake = () => {
    if (questions) {
      let reshuffled = questions.map(parseAndCleanQuestion);
      if (isRandomMode) {
        reshuffled.sort(() => Math.random() - 0.5);
      }
      if (isRandomOptionsMode) {
        reshuffled = reshuffled.map((q) => ({
          ...q,
          options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : [],
        }));
      }
      setQuestions(reshuffled);
    }
    setCurrentIndex(0);
    setAnswers({});
    setIsFinished(false);
  };

  const handleReset = () => {
    setQuestions(null);
    setCurrentIndex(0);
    setAnswers({});
    setIsFinished(false);
    
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFinalSubmit = () => {
    setIsDialogOpen(false);
    setIsFinished(true);
  };

  const attemptSubmit = () => {
    const totalAnswered = Object.keys(answers).length;
    if (questions && totalAnswered < questions.length) {
      setIsDialogOpen(true); 
    } else {
      handleFinalSubmit(); 
    }
  };

  const score = useMemo(() => {
    if (!questions) return 0;
    let total = 0;
    questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      if (userAnswer === undefined) return;
      
      const isEssay = !q.options || q.options.length === 0;
      if (isEssay) {
        if (q.acceptableAnswers && q.acceptableAnswers.length > 0) {
          const matched = q.acceptableAnswers.some(
            (ans) => ans.trim().toLowerCase() === userAnswer.trim().toLowerCase()
          );
          if (matched) total++;
        } else {
          if (userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            total++;
          }
        }
      } else {
        if (userAnswer === q.correctAnswer) {
          total++;
        }
      }
    });
    return total;
  }, [answers, questions]);

  const progressPercentage = useMemo(() => {
    if (!questions) return 0;
    const totalAnswered = Object.keys(answers).length;
    return (totalAnswered / questions.length) * 100;
  }, [answers, questions]);

  const ThemeToggle = ({ className = "absolute top-4 right-4" }: { className?: string }) => (
    <Button 
      variant="outline" 
      size="icon" 
      className={`${className} rounded-full z-50 bg-background/80 backdrop-blur-sm`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      )}
    </Button>
  );

  // --- TAMPILAN 1: FORM UPLOAD ---
  if (!questions) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background relative">
        <ThemeToggle />
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">Ngasal App</h1>
            <p className="text-lg text-muted-foreground font-medium">(Ngerjain Soal)</p>
          </div>
          <Card className="w-full shadow-lg border-2">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Upload Soal Kuis</CardTitle>
              <CardDescription>Format file wajib .json</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-3 w-full">
                <span className="text-sm font-medium text-center text-muted-foreground">Pilih Mode Soal:</span>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button variant={!isRandomMode ? "default" : "outline"} onClick={() => setIsRandomMode(false)} className="w-full">Urut</Button>
                  <Button variant={isRandomMode ? "default" : "outline"} onClick={() => setIsRandomMode(true)} className="w-full">Acak</Button>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <span className="text-sm font-medium text-center text-muted-foreground">Acak Pilihan Jawaban:</span>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button variant={!isRandomOptionsMode ? "default" : "outline"} onClick={() => setIsRandomOptionsMode(false)} className="w-full">Tidak</Button>
                  <Button variant={isRandomOptionsMode ? "default" : "outline"} onClick={() => setIsRandomOptionsMode(true)} className="w-full">Ya</Button>
                </div>
              </div>
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-primary/25 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-primary/5 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Klik untuk unggah</span></p>
                  <p className="text-xs text-muted-foreground">soal.json</p>
                </div>
                <input id="dropzone-file" type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              </label>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // --- TAMPILAN 2: HASIL KUIS ---
  if (isFinished) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background relative">
        <ThemeToggle />
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Kuis Selesai!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg md:text-xl mb-2">Skor Kamu:</p>
            <p className="text-5xl font-bold text-primary mb-8">{score} / {questions.length}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleRetake} className="w-full" size="lg" variant="default">Kerjakan Ulang</Button>
              <Button onClick={handleReset} className="w-full" size="lg" variant="outline">Kembali ke Beranda</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // --- TAMPILAN 3: KUIS INTERAKTIF ---
  const currentQ = questions[currentIndex];
  const hasAnsweredCurrent = answers[currentIndex] !== undefined;
  const unansweredCount = questions.length - Object.keys(answers).length;

  return (
    <main className="min-h-screen flex flex-col items-center py-6 px-4 md:py-12 md:px-8 bg-background relative">
      {/* <ThemeToggle /> YANG AWALNYA DI SINI (ABSOLUTE) DIHAPUS */}
      
      {/* HEADER & PROGRESS BAR */}
      {/* Hapus mt-12 karena sekarang sudah tidak nabrak tombol di kanan atas */}
      <div className="w-full max-w-3xl mb-4 space-y-3">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="font-medium text-sm md:text-base">Soal {currentIndex + 1} dari {questions.length}</span>
          
          {/* LETAKKAN DI SINI: className="" akan mematikan efek posisi "absolute" */}
          <ThemeToggle className="" />

          <span className="font-medium text-sm md:text-base">Skor Sementara: {score}</span>
        </div>
        <Progress value={progressPercentage} className="h-2 w-full" />
      </div>

      <Card className="w-full max-w-3xl shadow-lg mb-4">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl leading-relaxed">
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!currentQ.options || currentQ.options.length === 0 ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={essayInput}
                onChange={(e) => setEssayInput(e.target.value)}
                disabled={hasAnsweredCurrent}
                placeholder="Ketik jawaban singkat kamu di sini..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-80 transition-all text-sm md:text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !hasAnsweredCurrent) {
                    handleEssaySubmit();
                  }
                }}
              />
              
              {!hasAnsweredCurrent ? (
                <Button 
                  onClick={handleEssaySubmit} 
                  disabled={!essayInput.trim()} 
                  className="w-full md:w-auto self-end font-semibold"
                >
                  Kunci Jawaban
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const isCorrect = currentQ.acceptableAnswers && currentQ.acceptableAnswers.length > 0
                      ? currentQ.acceptableAnswers.some(ans => ans.trim().toLowerCase() === essayInput.trim().toLowerCase())
                      : essayInput.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

                    return isCorrect ? (
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex flex-col gap-1 text-sm md:text-base">
                        <span className="font-bold flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                          Jawaban Kamu Benar!
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex flex-col gap-2 text-sm md:text-base">
                        <span className="font-bold flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Jawaban Kamu Kurang Tepat.
                        </span>
                        <p className="text-muted-foreground text-xs md:text-sm">
                          Jawaban yang benar: <strong className="text-foreground font-semibold">
                            {currentQ.acceptableAnswers ? currentQ.acceptableAnswers.join(" atau ") : currentQ.correctAnswer}
                          </strong>
                        </p>
                      </div>
                    );
                  })()}
                  <Button 
                    variant="outline" 
                    onClick={handleEssayReset} 
                    className="w-full md:w-auto self-end"
                  >
                    Ubah Jawaban
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {currentQ.options.map((option, index) => {
                const isSelected = answers[currentIndex] === option;
                const isCorrect = option === currentQ.correctAnswer;
                
                let customClass = "justify-start text-left text-sm md:text-base p-4 min-h-[1.5rem] h-auto whitespace-normal transition-colors w-full";
                
                if (hasAnsweredCurrent) {
                  if (isCorrect) {
                    customClass += " bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700";
                  } else if (isSelected) {
                    customClass += " bg-red-500 hover:bg-red-600 text-white border-red-500 dark:bg-red-600 dark:hover:bg-red-700";
                  }
                }

                return (
                  <Button key={index} variant="outline" className={customClass} onClick={() => handleAnswerSelect(option)}>
                    {option}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4 border-t mt-2">
          <Button onClick={handlePrev} disabled={currentIndex === 0} variant="secondary">Sebelumnya</Button>
          
          {currentIndex === questions.length - 1 ? (
            <Button onClick={attemptSubmit} variant="default">Kumpulkan</Button>
          ) : (
            <Button onClick={handleNext}>Selanjutnya</Button>
          )}
        </CardFooter>
      </Card>

      {/* --- FITUR BARU: NAVIGASI NOMOR + TOMBOL KUMPULKAN LANGSUNG --- */}
      <div className="w-full max-w-3xl bg-card border rounded-xl shadow-sm p-3 md:p-4">
        
        {/* EDIT DI SINI: Flexbox untuk menyusun judul dan tombol berjejer */}
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <h3 className="text-xs md:text-sm font-semibold text-muted-foreground">Lompat ke Soal:</h3>
          
          {/* Tombol Kumpulkan Langsung (Kecil & Rapi) */}
          <Button 
            onClick={attemptSubmit} 
            variant="outline" 
            size="sm" 
            className="h-7 px-3 text-[11px] md:h-8 md:px-4 md:text-xs font-semibold border-primary/20 hover:bg-primary/5 text-primary"
          >
            Kumpulkan Langsung
          </Button>
        </div>
        
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-40 md:max-h-48 overflow-y-auto pr-2 pb-2">
          {questions.map((_, idx) => {
            const isCurrent = currentIndex === idx;
            const isAnswered = answers[idx] !== undefined;
            return (
              <Button
                key={idx}
                variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                className={`h-10 w-10 p-0 rounded-md shrink-0 ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ALERT DIALOG (POP-UP KONFIRMASI) */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin ingin mengumpulkan?</AlertDialogTitle>
            <AlertDialogDescription>
              Masih ada <strong className="text-foreground">{unansweredCount} soal</strong> yang belum kamu jawab. Jika sudah dikumpulkan, kuis tidak bisa diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cek Lagi</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Tetap Kumpulkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </main>
  );
}