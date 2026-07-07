import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Brain, 
  MessageSquare, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  Award, 
  ShieldCheck, 
  Zap, 
  Star, 
  Mail, 
  Send,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactForm({ name: '', email: '', message: '' });
        setContactSubmitted(false);
      }, 4000);
    }
  };

  const features = [
    {
      icon: <Brain className="h-6 w-6 text-emerald-500" />,
      title: "Complex Paper Simplifier",
      desc: "Translates abstract logic, equations, and literature jargon into crystal clear explanations custom-tailored for your level."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-indigo-500" />,
      title: "Interactive AI Chatbot",
      desc: "Ask follow-up questions, request summaries of specific pages, or query terms. The AI uses the exact paper content for grounding."
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      title: "20+ Analytical Perspectives",
      desc: "Automatically extracts abstract, methodology, algorithms, result tables, future scope, research gaps, and even generates viva prep questions."
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-rose-500" />,
      title: "Smart MCQs & Quizzes",
      desc: "Self-assess your reading progress and comprehension with AI-generated interactive quizzes mapped directly to paper sections."
    },
    {
      icon: <Award className="h-6 w-6 text-teal-500" />,
      title: "PPT Deck Outline Planner",
      desc: "Instantly draft structured slides and outlines for lab presentations, journal club, defense, or student seminars."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-sky-500" />,
      title: "Secure Cloud Persistence",
      desc: "Keep your research library fully synchronized and organized in your profile across any device with secure Firestore storage."
    }
  ];

  const workflowSteps = [
    {
      num: "01",
      title: "Upload PDF",
      desc: "Drag and drop any research article or thesis PDF. Our parser reads and extracts the entire text securely."
    },
    {
      num: "02",
      title: "AI Analysis",
      desc: "Google Gemini AI runs multi-angle deep learning explanations on results, algorithms, methods, and formulas."
    },
    {
      num: "03",
      title: "Understand & Learn",
      desc: "Navigate through 20 tabs of sectioned analysis, chat interactively, take a quiz, and export notes."
    }
  ];

  const whyChooseUs = [
    { title: "Designed for Researchers", desc: "No generic AI summaries. We focus deeply on methodology, results analysis, datasets, and citation indexing." },
    { title: "Dual Dark/Light Theme", desc: "Read comfort and contrast at any hour of the night with eye-safe dark layouts designed for long hours." },
    { title: "Advanced Citation Builder", desc: "Instantly generate APA, MLA, or IEEE format citations for your papers in a single click." }
  ];

  const FAQs = [
    {
      q: "How does the AI explain the research papers?",
      a: "We utilize Google's state-of-the-art Gemini 3.5 Flash model. When you upload a PDF, we extract its text and prompt the AI to analyze different sections of the paper, keeping the explanation grounded strictly in the source text to prevent hallucinations."
    },
    {
      q: "Can I upload any PDF file size?",
      a: "Yes, you can upload research papers up to 50MB. The client-side PDF parser extracts text locally and handles papers containing hundreds of pages effortlessly."
    },
    {
      q: "Is my uploaded research data secure?",
      a: "Absolutely. We secure your research papers using zero-trust Firebase Security Rules. Your papers and chats are private to you and cannot be accessed by other users."
    },
    {
      q: "Can I generate a presentation from the paper?",
      a: "Yes! Our PPT Outline generator creates a slide-by-slide guide structured specifically for academic defense or journal club sessions, saving you hours of prep time."
    }
  ];

  const testimonials = [
    {
      quote: "This tool literally saved me weeks during my thesis literature review. The section-by-section analysis and citation generator are flawless.",
      author: "Elena Rostova",
      role: "PhD Candidate in Biotech, Stanford"
    },
    {
      quote: "As an undergraduate, reading IEEE papers was incredibly intimidating. Having the AI define equations and explain methodology step-by-step is a game-changer.",
      author: "Marcus Chen",
      role: "Computer Science Junior, MIT"
    }
  ];

  return (
    <div id="landing_page" className="min-h-screen bg-[#0a0a0c] text-slate-200 transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0a0a0c]/0 to-transparent pointer-events-none z-0" />
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f0f13]/85 border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-650 rounded-xl text-white shadow-md shadow-indigo-600/10">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight text-white">
              Paper<span className="text-indigo-400">Explainer</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-400 hover:text-indigo-400 text-sm font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-indigo-400 text-sm font-medium transition-colors">How It Works</a>
            <a href="#faq" className="text-slate-400 hover:text-indigo-400 text-sm font-medium transition-colors">FAQ</a>
            <a href="#contact" className="text-slate-400 hover:text-indigo-400 text-sm font-medium transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button 
              id="nav_login_btn"
              onClick={onLogin}
              className="text-slate-300 hover:text-indigo-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              Log In
            </button>
            <button 
              id="nav_get_started_btn"
              onClick={onGetStarted}
              className="bg-indigo-600 hover:bg-indigo-550 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-indigo-400 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-b border-slate-800 bg-[#0f0f13]/95 px-4 py-4 space-y-4"
            >
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-indigo-400 font-medium text-sm py-2"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-indigo-400 font-medium text-sm py-2"
              >
                How It Works
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-indigo-400 font-medium text-sm py-2"
              >
                FAQ
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-indigo-400 font-medium text-sm py-2"
              >
                Contact
              </a>
              <div className="pt-4 border-t border-slate-800 flex flex-col space-y-3">
                <button 
                  onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                  className="w-full text-center text-slate-300 hover:text-indigo-400 font-medium text-sm py-2"
                >
                  Log In
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-sm py-2.5 rounded-xl shadow-md transition-all"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-950/30 border border-indigo-500/10 text-indigo-400 text-xs px-3.5 py-1.5 rounded-full mb-8 font-medium">
            <Sparkles className="h-4 w-4 text-indigo-450 animate-pulse" />
            <span>AI-Powered Academic Explanation Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            Understand Complex Research Papers in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-sans font-normal leading-relaxed">
            Upload any academic PDF. Instantly analyze methodologies, unpack algorithms, test your knowledge with interactive quizzes, and ask questions directly to the AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5">
            <button 
              id="hero_cta_btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-550 text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-indigo-600/20 transition-all flex items-center justify-center space-x-3 group"
            >
              <span>Upload Your Research Paper</span>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 text-base font-semibold px-8 py-4 rounded-2xl border border-slate-800 shadow-md transition-all"
            >
              Explore Free Demo
            </button>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 pt-12 border-t border-slate-800 max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-white">10k+</p>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Papers Uploaded</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-white">99.2%</p>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Accuracy Rating</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-white">20x</p>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Reading Speedup</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 bg-[#0f0f13] border-y border-slate-850 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Supercharge Your Academic Workflows
            </h2>
            <p className="text-base text-slate-400">
              Stop getting bogged down by complicated mathematical equations, long literature references, and dense technical jargon. Let our specialized AI extract exactly what you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <div 
                key={index} 
                className="p-8 rounded-3xl border border-slate-800 bg-[#0a0a0c]/80 hover:bg-slate-900/60 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-600/[0.02] transition-all duration-300"
              >
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl inline-block shadow-sm mb-5 text-indigo-400">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-[#0a0a0c] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-base text-slate-400">
              Three simple steps to transform your research productivity and paper reading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-transparent -translate-y-12 z-0" />

            {workflowSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 group">
                <div className="text-5xl font-extrabold text-indigo-950 group-hover:text-indigo-900/60 transition-colors mb-4">{step.num}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-955 text-white rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-6 leading-tight">
                  Why academic leaders choose PaperExplainer
                </h2>
                <p className="text-slate-400 text-base mb-8 leading-relaxed">
                  Unlike generic PDF summaries or basic chat agents, we configure precise system guidance for academic documents, extracting deep structure including mathematical models, algorithms, dataset configurations, and bibliographies.
                </p>
                <button 
                  onClick={onGetStarted}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Create Free Account
                </button>
              </div>
              <div className="space-y-6">
                {whyChooseUs.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="mt-1 p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-[#0f0f13] border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Trusted by Scholars and Students
            </h2>
            <p className="text-base text-slate-450">
              See how our academic explanation engine helps users conquer complex literature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((test, index) => (
              <div key={index} className="bg-[#0a0a0c] border border-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                <div className="absolute top-6 left-6 text-indigo-950 text-6xl font-serif pointer-events-none">“</div>
                <p className="text-slate-300 italic relative z-10 leading-relaxed mb-6">
                  {test.quote}
                </p>
                <div className="flex items-center space-x-3 border-t border-slate-850 pt-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {test.author[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{test.author}</h4>
                    <p className="text-xs text-slate-500 font-medium">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[#0a0a0c] border-t border-slate-850">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-450">
              Everything you need to know about PaperExplainer.
            </p>
          </div>

          <div className="space-y-4">
            {FAQs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left bg-slate-900/40 hover:bg-slate-900/80 font-semibold text-white transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${faqOpen === index ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen === index && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="p-5 text-slate-400 text-sm leading-relaxed border-t border-slate-800">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-[#0f0f13] border-t border-slate-850">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Get in Touch
            </h2>
            <p className="text-sm text-slate-450">
              Have questions, feedback, or custom feature requests? Drop us a message!
            </p>
          </div>

          <div className="bg-[#0a0a0c] p-8 rounded-3xl border border-slate-800 shadow-md">
            {contactSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="inline-flex p-3 bg-indigo-950/40 text-indigo-450 rounded-full border border-indigo-500/10 animate-bounce">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Thank you!</h3>
                <p className="text-sm text-slate-400">Your message was received successfully. We will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-white" 
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Email</label>
                    <input 
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-white" 
                      placeholder="jane@university.edu"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Message</label>
                  <textarea 
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-white" 
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0c] text-slate-450 py-12 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-bold text-white tracking-tight">
              PaperExplainer
            </span>
          </div>
          <div className="flex space-x-6 text-sm mb-6 md:mb-0">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-xs text-slate-500 text-center md:text-right">
            <p>&copy; 2026 PaperExplainer. All rights reserved.</p>
            <p className="mt-1">Powered by Google Gemini 3.5 Flash</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
