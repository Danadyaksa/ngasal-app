"use client";

import { useState, useMemo } from "react";
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

export default function Home() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData: Question[] = JSON.parse(content);
        
        if (parsedData.length > 0 && parsedData[0].question) {
          let finalQuestions = [...parsedData];
          if (isRandomMode) {
            finalQuestions.sort(() => Math.random() - 0.5);
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
    if (questions && isRandomMode) {
      const reshuffled = [...questions].sort(() => Math.random() - 0.5);
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
      if (answers[idx] === q.correctAnswer) total++;
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
          <CardTitle className="text-lg md:text-xl leading-relaxed">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {currentQ.options.map((option, index) => {
            const isSelected = answers[currentIndex] === option;
            const isCorrect = option === currentQ.correctAnswer;
            
            let customClass = "justify-start text-left text-sm md:text-base p-4 min-h-[1.5rem] h-auto whitespace-normal transition-colors";
            
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

      {/* --- FITUR BARU: NAVIGASI NOMOR DENGAN SCROLL SENDIRI --- */}
      <div className="w-full max-w-3xl bg-card border rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center md:text-left">Lompat ke Soal:</h3>
        {/* max-h-48 bikin tingginya dibatasi, overflow-y-auto bikin scrollbar muncul otomatis kalau isinya berlebih */}
        <div className="flex flex-wrap justify-center md:justify-start gap-2 max-h-48 overflow-y-auto pr-2 pb-2">
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