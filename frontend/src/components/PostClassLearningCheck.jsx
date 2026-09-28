import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  BookOpen, 
  User, 
  Check, 
  RefreshCw, 
  LayoutDashboard,
  Award
} from 'lucide-react';
import { api } from '../services/api.js';

export default function PostClassLearningCheck({
  bookingId,
  booking,
  onFinish,
  onBackToDashboard
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Load questions or existing result from backend
  useEffect(() => {
    let isMounted = true;

    async function loadQuiz() {
      if (!bookingId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await api.getLearningCheck(bookingId);
        if (!isMounted) return;

        if (res.success && res.data) {
          if (res.completed && res.data.review) {
            // Already completed: display result directly
            setResult(res.data);
          } else {
            setQuizData(res.data);
          }
        } else {
          throw new Error('Unable to load quiz data.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load learning check:', err);
        setError(err.message || 'Could not load learning check questions.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadQuiz();
    return () => { isMounted = false; };
  }, [bookingId]);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNext = () => {
    if (quizData && currentIndex < quizData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitLearningCheck(bookingId, answers);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        throw new Error('Failed to submit learning check.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Unable to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else if (onFinish) {
      onFinish();
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div style={{
        maxWidth: '680px',
        margin: '2rem auto',
        padding: '3rem 2rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center'
      }}>
        <RefreshCw size={32} className="spin" color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
          Preparing your learning check...
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)' }}>
          Retrieving topic questions tailored for today's session.
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error && !result) {
    return (
      <div style={{
        maxWidth: '680px',
        margin: '2rem auto',
        padding: '2.5rem 2rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C53030', marginBottom: '0.5rem' }}>
          Unable to Load Learning Check
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)', marginBottom: '1.5rem' }}>
          {error}
        </p>
        <button onClick={handleDashboard} className="btn btn-secondary">
          <LayoutDashboard size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  // 3. Result Screen (After Submission or if Previously Completed)
  if (result) {
    const courseTitle = result.courseTitle || booking?.subjectTitle || booking?.subject?.title || 'Trial Class';
    const score = result.score ?? 0;
    const total = result.totalQuestions ?? 5;
    const percentage = result.percentage ?? Math.round((score / total) * 100);

    return (
      <div className="learning-check-card" style={{
        maxWidth: '680px',
        margin: '2rem auto',
        padding: '2.5rem 2rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--color-border)',
        boxShadow: '0 12px 36px rgba(23, 59, 70, 0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(49, 95, 97, 0.12)'
          }}>
            <Award size={40} />
          </div>

          <div style={{ marginBottom: '0.45rem' }}>
            <span className="badge badge-teal" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Learning Check Complete
            </span>
          </div>

          <h2 className="heading-lg" style={{ color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
            Trial Session Assessment
          </h2>

          <div style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)' }}>
            Course: <strong>{courseTitle}</strong>
          </div>
        </div>

        {/* Score Card */}
        <div style={{
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.75rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted-text)', marginBottom: '0.35rem' }}>
            YOUR SCORE
          </div>
          <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1.1 }}>
            {score} <span style={{ fontSize: '1.6rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>/ {total}</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark-teal)', marginTop: '0.25rem' }}>
            {percentage}%
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-dark-text)', maxWidth: '480px', margin: '0.85rem auto 0', lineHeight: 1.5, fontWeight: 500 }}>
            {result.feedback}
          </p>
        </div>

        {/* Answer Review Section */}
        {result.review && result.review.length > 0 && (
          <div style={{ marginBottom: '2.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '1rem' }}>
              Question Review
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {result.review.map((item, idx) => (
                <div key={item.id || idx} style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  border: item.isCorrect ? '1.5px solid #A3E5CB' : '1.5px solid #FCD34D',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted-text)' }}>
                      Question {idx + 1}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: item.isCorrect ? '#15803D' : '#B45309',
                      backgroundColor: item.isCorrect ? '#DCFCE7' : '#FEF3C7',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {item.isCorrect ? (
                        <>
                          <Check size={13} strokeWidth={2.6} />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span>Needs another look</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.75rem' }}>
                    {item.question}
                  </div>

                  {/* Options display with student choice and correct indicator */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    {item.options.map((opt, optIdx) => {
                      const isSelected = item.selectedAnswer === optIdx;
                      const isCorrectAnswer = item.correctAnswer === optIdx;

                      let optBg = 'var(--color-surface-hover)';
                      let optBorder = '1px solid var(--color-border)';
                      let optColor = 'var(--color-dark-text)';

                      if (isCorrectAnswer) {
                        optBg = '#F0FDF4';
                        optBorder = '1.5px solid #86EFAC';
                        optColor = '#166534';
                      } else if (isSelected && !item.isCorrect) {
                        optBg = '#FEF2F2';
                        optBorder = '1.5px solid #FCA5A5';
                        optColor = '#991B1B';
                      }

                      return (
                        <div key={optIdx} style={{
                          padding: '0.55rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: optBg,
                          border: optBorder,
                          fontSize: '0.86rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          color: optColor,
                          fontWeight: (isSelected || isCorrectAnswer) ? 600 : 400
                        }}>
                          <span>{opt}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {isSelected && isCorrectAnswer && '✓ Your Answer'}
                            {isSelected && !isCorrectAnswer && '✕ Your Answer'}
                            {!isSelected && isCorrectAnswer && '✓ Correct'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {item.explanation && (
                    <div style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-dark-teal)',
                      backgroundColor: 'var(--color-primary-light)',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      lineHeight: 1.45
                    }}>
                      <strong>Takeaway:</strong> {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Dashboard Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            id="btn-quiz-dashboard"
            onClick={handleDashboard}
            className="btn btn-primary"
            style={{
              padding: '0.85rem 2.2rem',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(255, 200, 61, 0.4)'
            }}
          >
            <LayoutDashboard size={18} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. In-Progress Quiz State
  const questions = quizData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="learning-check-card" style={{
      maxWidth: '680px',
      margin: '2rem auto',
      padding: '2.5rem 2rem',
      backgroundColor: '#FFFFFF',
      borderRadius: 'var(--radius-xl)',
      border: '1.5px solid var(--color-border)',
      boxShadow: '0 12px 36px rgba(23, 59, 70, 0.08)'
    }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ marginBottom: '0.45rem' }}>
          <span className="badge badge-teal" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={14} color="var(--color-orange)" />
            <span>Trial Class Complete</span>
          </span>
        </div>

        <h2 className="heading-lg" style={{ color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
          Nice work!
        </h2>

        <p className="text-body" style={{ fontSize: '0.94rem', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
          Let's do a quick 3-minute learning check based on today's class.
        </p>

        {/* Course & Mentor Info Bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1.25rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '0.6rem 1.25rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          fontSize: '0.84rem'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)', fontWeight: 700 }}>
            <BookOpen size={14} />
            <span>Course: {quizData?.courseTitle}</span>
          </span>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-dark-text)', fontWeight: 600 }}>
            <User size={14} />
            <span>Mentor: {quizData?.mentorName}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted-text)', marginBottom: '0.4rem' }}>
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div style={{
          height: '6px',
          width: '100%',
          backgroundColor: '#E2E8F0',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: 'var(--color-primary)',
            transition: 'width 0.25s ease'
          }} />
        </div>
      </div>

      {/* Active Question Box */}
      {currentQuestion && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--color-dark-text)',
            lineHeight: 1.45,
            marginBottom: '1.25rem'
          }}>
            {currentQuestion.question}
          </h3>

          {/* Multiple Choice Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedAnswer === optIdx;

              return (
                <div
                  key={optIdx}
                  className="quiz-option-card"
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(49, 95, 97, 0.08)' : 'none'
                  }}
                >
                  {/* Radio circle */}
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--color-primary)' : '2px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    flexShrink: 0,
                    transition: 'border-color 0.15s ease'
                  }} />

                  <span style={{
                    fontSize: '0.94rem',
                    color: isSelected ? 'var(--color-dark-teal)' : 'var(--color-dark-text)',
                    fontWeight: isSelected ? 700 : 500,
                    lineHeight: 1.4
                  }}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation & Submission Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--color-border)'
      }}>
        <button
          type="button"
          id="btn-quiz-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0 || submitting}
          className="btn btn-secondary"
          style={{
            visibility: currentIndex === 0 ? 'hidden' : 'visible',
            padding: '0.65rem 1.2rem',
            fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            id="btn-quiz-submit"
            onClick={handleSubmit}
            disabled={selectedAnswer === undefined || submitting}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.8rem',
              fontSize: '0.96rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(255, 200, 61, 0.4)'
            }}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Grading Answers...</span>
              </>
            ) : (
              <>
                <span>Submit Learning Check</span>
                <CheckCircle2 size={16} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            id="btn-quiz-next"
            onClick={handleNext}
            disabled={selectedAnswer === undefined}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 700
            }}
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
