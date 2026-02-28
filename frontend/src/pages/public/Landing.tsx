import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Heart, Gamepad2, Shield, MessageCircle, Activity, Star,
  MapPin, Video,
} from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useRef, useEffect, useState } from 'react';

// ── Feature cards ────────────────────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    title: 'Cognitive Monitoring',
    desc: 'AI assessments that detect early cognitive decline patterns.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
  },
  {
    icon: MessageCircle,
    title: 'AI Companion',
    desc: 'A voice-first digital grandchild that listens and connects daily.',
    image: 'https://images.unsplash.com/photo-1576765975298-5f4c9b90b2b8?w=400&h=300&fit=crop',
  },
  {
    icon: Heart,
    title: 'Health Passport',
    desc: 'Emergency-ready QR health access for caregivers and doctors.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
  },
  {
    icon: Gamepad2,
    title: 'Brain Games',
    desc: 'Scientifically designed exercises for memory and focus.',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=300&fit=crop',
  },
  {
    icon: Shield,
    title: 'Emergency Alerts',
    desc: 'Instant caregiver notifications with panic support.',
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=300&fit=crop',
  },
  {
    icon: MapPin,
    title: 'Location Tracking',
    desc: 'GPS geofencing with real-time safe-zone monitoring.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  },
  {
    icon: Activity,
    title: 'Mood Tracking',
    desc: 'Loneliness and emotional health monitoring via AI.',
    image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
  },
  {
    icon: Video,
    title: 'Video Calling',
    desc: 'One-tap HD video calls between patients and caregivers.',
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop',
  },
];

// ── Stats ────────────────────────────────────────────────────────────────────

const stats = [
  { number: '55M+', label: 'People Living with Dementia' },
  { number: '1 in 6', label: 'Elderly Face Isolation' },
  { number: '70%', label: 'Cases Undetected Early' },
  { number: '#1', label: 'AI Companion for Seniors' },
];

// ── Horizontal-scroll images ─────────────────────────────────────────────────

const storyImages = [
  { url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=600&h=400&fit=crop', alt: 'Elderly woman smiling' },
  { url: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=600&h=400&fit=crop', alt: 'Family gathering' },
  { url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=400&fit=crop', alt: 'Senior using tablet' },
  { url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&h=400&fit=crop', alt: 'Grandmother with grandchild' },
  { url: 'https://images.unsplash.com/photo-1447005497901-b3e9ee359928?w=600&h=400&fit=crop', alt: 'Elderly couple in park' },
];

// ── Landing component ────────────────────────────────────────────────────────

const Landing = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Smooth horizontal auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let raf: number;
    let start: number | null = null;
    const speed = el.scrollWidth / 30; // px per second

    const tick = (ts: number) => {
      if (!start) start = ts;
      if (!isPaused) {
        el.scrollLeft = ((ts - start) / 1000 * speed) % el.scrollWidth;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Brain className="text-primary" size={32} />
          <span className="text-2xl font-display font-bold text-primary">MindBridge</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="btn-secondary text-sm">Log In</Link>
          <Link to="/signup" className="btn-primary text-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* ── Hero with Video ──────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground pt-20 pb-28 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left content */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="text-yellow-300 fill-yellow-300" size={18} />
                ))}
                <span className="text-sm opacity-90 ml-2">Trusted by 10,000+ families</span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight"
              >
                Changing how India
                <br />
                <span className="italic font-light opacity-90">cares for its elders.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-lg max-w-xl opacity-90"
              >
                MindBridge combines emotional AI companionship with intelligent
                cognitive monitoring — supporting elderly individuals with
                dignity, safety, and connection.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-white text-primary rounded-full font-semibold hover:scale-105 transition shadow-lg"
                >
                  Get Matched Free
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border border-white/60 rounded-full hover:bg-white/10 transition"
                >
                  Caregiver Login
                </Link>
              </motion.div>
            </div>

            {/* Right — hero video */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-1 w-full"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <video autoPlay loop muted playsInline className="w-full h-auto rounded-2xl">
                  <source src="/hero.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats (overlapping) ──────────────────────────────────────── */}
      <section className="relative -mt-14 px-8 max-w-6xl mx-auto z-10">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="glass-card-elevated p-7 text-center"
            >
              <h3 className="text-3xl font-bold text-primary mb-1">{s.number}</h3>
              <p className="text-muted-foreground text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features with images ──────────────────────────────────────── */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-display font-bold text-center text-foreground mb-16"
        >
          Empowering Care with <span className="text-gradient">AI Technology</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden hover:shadow-lg transition group"
            >
              <div className="h-40 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <div className="p-5">
                <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center mb-4 -mt-10 border-4 border-background shadow-lg">
                  <f.icon className="text-primary-foreground" size={20} />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Photo slideshow ──────────────────────────────────────────── */}
      <section className="bg-muted/50 py-20 px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-foreground mb-10 text-center">
            Real Moments. Real Impact.
          </h2>

          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              style={{ scrollBehavior: 'auto' }}
            >
              {[...storyImages, ...storyImages].map((img, idx) => (
                <motion.div
                  key={idx}
                  className="flex-shrink-0 w-72 h-56 rounded-2xl overflow-hidden shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <img src={img.url} alt={img.alt} loading="lazy" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
            <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-muted/50 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-muted/50 to-transparent pointer-events-none" />
          </div>

          <p className="text-center text-muted-foreground mt-5 text-sm">
            {isPaused ? 'Hover off to resume' : 'Hover to pause'}
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-8 text-center gradient-primary text-primary-foreground">
        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
          Because Care Should Feel Human.
        </h2>
        <p className="opacity-90 mb-8 max-w-xl mx-auto">
          Join families using MindBridge to provide companionship and intelligent cognitive monitoring.
        </p>
        <Link
          to="/signup"
          className="px-10 py-4 bg-white text-primary rounded-full font-semibold hover:scale-105 transition inline-block shadow-lg"
        >
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6 text-center text-muted-foreground text-sm">
        © 2026 MindBridge. Compassionate AI for Dementia Care.
      </footer>
    </div>
  );
};

export default Landing;
