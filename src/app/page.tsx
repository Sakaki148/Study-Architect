'use client';

import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  FileText,
  Layers,
  Sparkles,
  Zap,
  ChevronDown,
  TrendingUp,
  Users,
  GraduationCap,
  Target,
  Shield,
  Rocket,
  Star,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

/* ─── Scroll-triggered section wrapper ─── */
function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 80 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealItem({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealScale({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Custom Cursor ─── */
function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Outer ring spring for trailing effect
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Exact coordinates for inner dot without lag
  const exactX = useMotionValue(-100);
  const exactY = useMotionValue(-100);

  useEffect(() => {
    setMounted(true);
    
    // Global style to hide the OS cursor entirely, including over buttons
    const style = document.createElement('style');
    style.innerHTML = `
      * { cursor: none !important; }
    `;
    document.head.appendChild(style);
    
    const moveCursor = (e: MouseEvent) => {
      // 32px ring => offset -16
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      
      // 8px dot => offset -4
      exactX.set(e.clientX - 4);
      exactY.set(e.clientY - 4);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY, exactX, exactY]);

  if (!mounted) return null;

  return (
    <>
      {/* Outer Ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden md:block mix-blend-screen"
        style={{ x: cursorXSpring, y: cursorYSpring }}
        animate={{ scale: clicked ? 0.7 : 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <div className="w-8 h-8 rounded-full border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
      </motion.div>
      {/* Exact Inner Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden md:block mix-blend-screen"
        style={{ x: exactX, y: exactY }}
      >
        <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
      </motion.div>
    </>
  );
}

/* ─── Water Bubbles Background ─── */
function WaterBubbles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 20 + 5; // 5px to 25px
        return (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/20 bg-blue-300/[0.03] shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              bottom: '-5%',
            }}
            animate={{
              y: ['0vh', '-120vh'], // float up continuously
              x: [
                `${Math.random() * 20 - 10}px`, 
                `${Math.random() * 40 - 20}px`, 
                `${Math.random() * 20 - 10}px`
              ], // gentle horizontal sway
              opacity: [0, 0.6, 0],
            }}
            transition={{
              y: {
                duration: 8 + Math.random() * 12,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear',
              },
              x: {
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut'
              },
              opacity: {
                duration: 8 + Math.random() * 12,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear',
              }
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Animated counter ─── */
function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="inline-block"
    >
      {value}{suffix}
    </motion.span>
  );
}

/* ─── Data ─── */
const features = [
  {
    icon: FileText,
    title: 'Structured Notes',
    desc: 'AI transforms your raw materials into comprehensive, well-organized study notes with proper headings, key takeaways, and examples.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Clock,
    title: 'Smart Timeline',
    desc: 'Get an adaptive study schedule based on content difficulty, your available time, and built-in break intervals.',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    desc: 'Automatically generated flashcards with difficulty levels. Review with 3D flip animations and swipe gestures.',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    icon: Brain,
    title: 'Adaptive Quizzes',
    desc: 'Multiple choice, true/false, fill-in-the-blank, matching, and short answer — with adjustable difficulty.',
    gradient: 'from-emerald-500/20 to-green-500/20',
  },
  {
    icon: Sparkles,
    title: 'AI Explanations',
    desc: 'Select any text in your notes and get instant, in-depth AI-powered explanations without leaving the page.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: Zap,
    title: 'Instant Processing',
    desc: 'Upload PDFs, DOCX, PPTX, or plain text files. Everything is parsed and processed in seconds.',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
];

const steps = [
  {
    num: '01',
    title: 'Upload',
    desc: 'Drag and drop your study materials — PDFs, documents, presentations, or text files.',
    icon: Rocket,
  },
  {
    num: '02',
    title: 'Process',
    desc: 'AI analyzes your content and generates structured notes, flashcards, and a study timeline.',
    icon: Brain,
  },
  {
    num: '03',
    title: 'Study',
    desc: 'Review your notes, flip through flashcards, take quizzes, and ask the AI anything.',
    icon: GraduationCap,
  },
];

const stats = [
  { value: '10x', label: 'Faster than manual notes', icon: TrendingUp },
  { value: '95%', label: 'Content accuracy rate', icon: Target },
  { value: '5+', label: 'File formats supported', icon: FileText },
  { value: '∞', label: 'Study sessions possible', icon: Sparkles },
];

const benefits = [
  'AI-powered note generation in seconds',
  'Smart study schedules that adapt to you',
  'Flashcards with spaced repetition',
  'Quizzes that match your level',
  'Instant explanations for any concept',
  'Support for all major file formats',
];

const testimonials = [
  {
    quote: 'This completely changed how I prepare for exams. The AI-generated notes are incredibly well-structured.',
    author: 'Sarah K.',
    role: 'Medical Student',
    stars: 5,
  },
  {
    quote: 'The flashcards and adaptive quizzes are a game-changer. I study half the time with double the retention.',
    author: 'James M.',
    role: 'Engineering Major',
    stars: 5,
  },
  {
    quote: 'I upload my lecture slides and get a complete study guide in minutes. Absolutely incredible tool.',
    author: 'Emily R.',
    role: 'Law Student',
    stars: 5,
  },
];

/* ═══════════════════════════════════════════════════ */
/*  LANDING PAGE                                      */
/* ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <main className="landing-page">
      <CustomCursor />
      
      {/* ─── NAV ─── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-nav-logo">
              <BookOpen className="w-4 h-4 text-black" />
            </div>
            <span className="landing-nav-title">AI Study Architect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <span className="text-sm font-medium hover:text-black transition-colors text-[var(--text-secondary)]">Sign In</span>
            </Link>
            <Link href="/auth/signup">
              <motion.button
                className="btn-primary landing-nav-cta"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 1 — HERO (Full viewport)          */}
      {/* ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="landing-section landing-hero relative overflow-hidden">
        <WaterBubbles />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <motion.div
          className="hero-content"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Powered by Gemini AI</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Study smarter,
            <br />
            <span className="hero-title-fade">not harder.</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            Upload your study materials and get structured notes, smart timelines,
            flashcards, and adaptive quizzes — all generated by AI in seconds.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link href="/auth/signup">
              <motion.button
                className="btn-primary hero-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Studying
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <motion.button
              className="btn-secondary hero-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              How it Works
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="hero-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <span>Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 2 — STATS / SOCIAL PROOF          */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-section landing-stats-section">
        <div className="landing-section-inner">
          <RevealSection>
            <p className="section-label">Why Students Love Us</p>
            <h2 className="section-title">Built for serious learners</h2>
            <p className="section-subtitle">
              Join thousands of students who are already studying smarter with AI-powered tools.
            </p>
          </RevealSection>

          <div className="stats-grid">
            {stats.map((stat, i) => (
              <RevealScale key={stat.label} delay={i * 0.12}>
                <motion.div
                  className="stat-card"
                  whileHover={{ y: -6, borderColor: 'rgba(255,255,255,0.15)' }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="stat-icon-wrapper">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="stat-value">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <p className="stat-label">{stat.label}</p>
                </motion.div>
              </RevealScale>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 3 — HOW IT WORKS                  */}
      {/* ═══════════════════════════════════════════ */}
      <section id="how" className="landing-section landing-how-section">
        <div className="landing-section-inner">
          <RevealSection>
            <p className="section-label">How it works</p>
            <h2 className="section-title">Three simple steps</h2>
            <p className="section-subtitle">
              Go from raw materials to a complete study toolkit in under a minute.
            </p>
          </RevealSection>

          <div className="steps-container">
            {/* Connecting line */}
            <div className="steps-line" />

            {steps.map((step, i) => (
              <RevealItem key={step.num} delay={i * 0.2}>
                <motion.div
                  className="step-card"
                  whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.12)' }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="step-number-ring">
                    <span className="step-number">{step.num}</span>
                  </div>
                  <div className="step-icon-wrapper">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </motion.div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 4 — FEATURES                      */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-section landing-features-section">
        <div className="landing-section-inner">
          <RevealSection>
            <p className="section-label">Features</p>
            <h2 className="section-title">Everything you need to study smarter</h2>
            <p className="section-subtitle">
              From AI-generated notes to adaptive quizzes, every tool is designed to help you learn
              efficiently.
            </p>
          </RevealSection>

          <div className="features-grid">
            {features.map((f, i) => (
              <RevealItem key={f.title} delay={i * 0.1}>
                <motion.div
                  className="feature-card"
                  whileHover={{ y: -6, borderColor: 'rgba(255,255,255,0.15)' }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`feature-icon-wrapper bg-gradient-to-br ${f.gradient}`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </motion.div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 5 — BENEFITS / WHY CHOOSE US      */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-section landing-benefits-section">
        <div className="landing-section-inner">
          <div className="benefits-layout">
            <RevealSection className="benefits-text">
              <p className="section-label" style={{ textAlign: 'left' }}>Why Choose Us</p>
              <h2 className="section-title" style={{ textAlign: 'left', maxWidth: '500px' }}>
                The smarter way to ace your exams
              </h2>
              <p className="section-subtitle" style={{ textAlign: 'left', maxWidth: '460px' }}>
                Stop wasting hours on manual note-taking. Let AI do the heavy lifting so you can
                focus on actually learning.
              </p>

              <Link href="/auth/signup">
                <motion.button
                  className="btn-primary hero-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ marginTop: '1.5rem' }}
                >
                  Try it Free
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </RevealSection>

            <div className="benefits-list">
              {benefits.map((b, i) => (
                <RevealItem key={i} delay={i * 0.08}>
                  <div className="benefit-item">
                    <div className="benefit-check">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span>{b}</span>
                  </div>
                </RevealItem>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 6 — TESTIMONIALS                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-section landing-testimonials-section">
        <div className="landing-section-inner">
          <RevealSection>
            <p className="section-label">Testimonials</p>
            <h2 className="section-title">What students are saying</h2>
            <p className="section-subtitle">
              Hear from learners who transformed their study habits.
            </p>
          </RevealSection>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <RevealItem key={i} delay={i * 0.15}>
                <motion.div
                  className="testimonial-card"
                  whileHover={{ y: -6, borderColor: 'rgba(255,255,255,0.15)' }}
                  transition={{ duration: 0.25 }}
                >
                  <Quote className="testimonial-quote-icon" />
                  <p className="testimonial-text">{t.quote}</p>
                  <div className="testimonial-stars">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="testimonial-name">{t.author}</p>
                      <p className="testimonial-role">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 7 — SUPPORTED FORMATS             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-section landing-formats-section">
        <div className="landing-section-inner">
          <RevealSection>
            <p className="section-label">Supported Formats</p>
            <h2 className="section-title">Upload anything</h2>
            <p className="section-subtitle">
              We support all major document formats. Just drag, drop, and let AI handle the rest.
            </p>
          </RevealSection>

          <div className="formats-grid">
            {[
              { ext: '.PDF', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
              { ext: '.DOCX', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
              { ext: '.PPTX', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
              { ext: '.TXT', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
              { ext: '.MD', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
            ].map((fmt, i) => (
              <RevealScale key={fmt.ext} delay={i * 0.1}>
                <motion.div
                  className="format-card"
                  style={{ borderColor: `${fmt.color}22` }}
                  whileHover={{
                    y: -8,
                    scale: 1.05,
                    borderColor: `${fmt.color}44`,
                    backgroundColor: fmt.bg,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <FileText className="w-8 h-8 mb-3" style={{ color: fmt.color }} />
                  <span className="format-ext" style={{ color: fmt.color }}>
                    {fmt.ext}
                  </span>
                </motion.div>
              </RevealScale>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 8 — FINAL CTA                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-section landing-cta-section">
        <div className="cta-glow" />
        <RevealScale className="landing-section-inner">
          <div className="cta-card">
            <Shield className="cta-shield-icon" />
            <h2 className="cta-title">Ready to transform your studying?</h2>
            <p className="cta-subtitle">
              Upload your materials, let AI structure everything, and start studying in minutes.
            </p>
            <Link href="/auth/signup">
              <motion.button
                className="btn-primary cta-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Studying — It&apos;s Free
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </RevealScale>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-nav-logo">
              <BookOpen className="w-4 h-4 text-black" />
            </div>
            <span>AI Study Architect</span>
          </div>
          <p className="landing-footer-copy">
            &copy; {new Date().getFullYear()} AI Study Architect. Built with ❤️ and Gemini AI.
          </p>
        </div>
      </footer>
    </main>
  );
}
