import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  CheckCircle2,
  Trash2,
  HelpCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  GraduationCap,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Department, AcademicYear } from '../../types';
import { useAcademic } from '../../context/AcademicContext';

interface AskEuroAiProps {
  selectedProgramming: Department;
  selectedYear: AcademicYear | 'All';
  selectedSubjectId: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Which students improved the most between UT1 and UT2?',
  'Show students who scored below 15 in tests.',
  'Who are the top 5 performing students in this programming?',
  'Which students need immediate academic attention and remedial help?',
  'Give me a comparison summary between Unit Test 1 and Unit Test 2.',
  'How should I structure tutorial classes for students who failed UT2?',
  'Explain the continuous evaluation marking rubrics under MSBTE.',
];

export const AskEuroAi: React.FC<AskEuroAiProps> = ({
  selectedProgramming,
  selectedYear,
  selectedSubjectId,
}) => {
  const { students, subjects, marks, allSummaries } = useAcademic();

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am **EURO AI**, your dedicated academic & continuous evaluation assistant. You can ask me anything about student scores, improvement rates, toppers, students needing remedial attention, or MSBTE engineering pedagogy for **${selectedProgramming}** (${selectedYear === 'All' ? 'All Years' : selectedYear}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Aggregate database context strictly for the selected department & year
  const databaseContext = React.useMemo(() => {
    const progSummaries = allSummaries.filter((s) => {
      const matchDept = s.student.department === selectedProgramming || (s.student as any).programming_name === selectedProgramming;
      if (!matchDept) return false;
      if (selectedYear !== 'All' && s.student.year !== selectedYear) return false;
      return true;
    });

    const activeCourse = subjects.find((s) => s.id === selectedSubjectId);
    const courseTitle = activeCourse?.course_title || activeCourse?.subject_name || 'All Courses';

    const evaluatedCount = progSummaries.length;
    let avgU1 = 0;
    let avgU2 = 0;
    let overallAvg = 0;

    if (evaluatedCount > 0) {
      avgU1 = Number((progSummaries.reduce((a, b) => a + b.overallUnit1Marks, 0) / evaluatedCount).toFixed(1));
      avgU2 = Number((progSummaries.reduce((a, b) => a + b.overallUnit2Marks, 0) / evaluatedCount).toFixed(1));
      overallAvg = Number((progSummaries.reduce((a, b) => a + b.overallAverageMarks, 0) / evaluatedCount).toFixed(1));
    }

    const studentList = progSummaries.map((s) => ({
      name: s.student.student_name || s.student.name,
      enrollmentNo: s.student.enrollment_number || s.student.enrollmentNo,
      year: s.student.year,
      u1: s.overallUnit1Marks,
      u2: s.overallUnit2Marks,
      avg: s.overallAverageMarks,
      avgPct: s.overallAveragePercentage,
      rating: s.overallRating,
      trend: s.overallTrend,
      delta: s.overallImprovementDelta,
      deltaPct: s.overallImprovementPercentage,
    }));

    return {
      department: selectedProgramming,
      year: selectedYear,
      courseTitle,
      evaluatedCount,
      avgU1,
      avgU2,
      overallAvg,
      students: studentList,
    };
  }, [allSummaries, subjects, selectedProgramming, selectedYear, selectedSubjectId]);

  const handleAskQuestion = async (queryText?: string) => {
    const question = (queryText || inputQuestion).trim();
    if (!question) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Prepare conversation history for Gemini multi-turn
    const conversationHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/ask-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          programming: selectedProgramming,
          year: selectedYear,
          course: databaseContext.courseTitle,
          contextData: databaseContext,
          conversationHistory,
        }),
      });

      const json = await res.json();
      const aiText = json.answer || 'I could not retrieve an answer for this query.';

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `Unable to process query: ${err.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Conversation cleared. Ask me any question regarding student performance, continuous evaluation, or teaching recommendations in **${selectedProgramming}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col h-[650px] overflow-hidden" id="ask-euro-ai-container">
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-[#082B5C] text-white flex items-center justify-between border-b border-[#00D9FF]/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/20 border border-[#00D9FF]/40 text-[#00D9FF] flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#00D9FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Ask EURO AI</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">
                Ground Truth Database
              </span>
            </div>
            <p className="text-xs text-[#CFFAFE]/80 mt-0.5">
              Continuous evaluation analytics &amp; academic queries for <strong className="text-white">{selectedProgramming}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="p-3 bg-[#F8FAFC] border-b border-[#D7E3EA] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
          Suggestions:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleAskQuestion(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#ECFEFF] hover:border-[#00D9FF] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] transition-all whitespace-nowrap cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F5F9FC]">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-lg bg-[#082B5C] text-[#00D9FF] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4 text-[#00D9FF]" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm shadow-xs relative group ${
                  isAi
                    ? 'bg-white text-[#1E293B] border border-[#D7E3EA]'
                    : 'bg-[#082B5C] text-white border border-[#00D9FF]/30'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] font-bold opacity-75">
                  <span>{isAi ? 'EURO AI' : 'You'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Content formatted with line breaks & markdown bold */}
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text.split('\n').map((line, lIdx) => {
                    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return (
                      <div
                        key={lIdx}
                        dangerouslySetInnerHTML={{ __html: formattedLine }}
                        className={line.startsWith('#') ? 'font-bold text-[#082B5C] mt-2 mb-1' : ''}
                      />
                    );
                  })}
                </div>

                {/* Copy button for AI messages */}
                {isAi && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-lg bg-[#00D9FF] text-[#082B5C] flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold text-xs">
                  <User className="w-4 h-4 text-[#082B5C]" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-[#082B5C] text-[#00D9FF] flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 text-[#00D9FF]" />
            </div>
            <div className="bg-white rounded-2xl p-4 text-xs text-[#64748B] border border-[#D7E3EA] shadow-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#00D9FF]" />
              <span>Analyzing continuous evaluation database records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#D7E3EA] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={`Ask about ${selectedProgramming} marks, toppers, improvements, or teaching strategies...`}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D7E3EA] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all bg-[#F8FAFC] text-[#172B4D]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="px-4 py-2.5 bg-[#082B5C] hover:bg-[#123B78] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-[#082B5C]/20 disabled:opacity-50 cursor-pointer border border-[#00D9FF]/30"
          >
            <Send className="w-4 h-4 text-[#00D9FF]" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>

    </div>
  );
};
