import { useState, useEffect, useRef } from 'react';
import {
  Star, MessageSquare, ChevronDown, ChevronUp, HelpCircle,
  Send, Maximize2, Minimize2, Volume2, VolumeX, Headphones,
} from 'lucide-react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── FAQ data ─────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: 'How do I start a video call with my caregiver?',
    answer:
      'Go to your dashboard and tap "Start Video Call". Your caregiver will receive a notification and can join instantly.',
  },
  {
    question: 'What if my internet connection is slow?',
    answer:
      'Our platform is optimized for low bandwidth. If video quality drops you can switch to audio-only mode or use the chat feature.',
  },
  {
    question: 'How do I upload my medical reports?',
    answer:
      'Navigate to the Health Passport section and tap "Upload Report". You can upload PDF, JPG or PNG files up to 10 MB.',
  },
  {
    question: 'Is my health data secure?',
    answer:
      'Yes — we use end-to-end encryption and follow HIPAA guidelines to keep all health data private and secure.',
  },
  {
    question: 'How does the AI companion work?',
    answer:
      'MindBridge\'s AI companion listens to you, remembers your conversations, and provides friendly daily check-ins. It can also remind you about medications and appointments.',
  },
  {
    question: 'How do the brain games help me?',
    answer:
      'Our games are scientifically designed to exercise memory, pattern recognition and focus. Playing regularly helps maintain cognitive sharpness.',
  },
];

// ── API ──────────────────────────────────────────────────────────────────────

const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`;

// ── Component ────────────────────────────────────────────────────────────────

const Support = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const heygenContainerRef = useRef<HTMLDivElement>(null);

  // ── HeyGen streaming avatar embed ──────────────────────────────────────────

  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `!function(window){const host="https://labs.heygen.com",url=host+"/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJEZXh0ZXJfRG9jdG9yX1NpdHRpbmcyX3B1%0D%0AYmxpYyIsInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzL2Y4%0D%0AM2ZmZmM0NWZhYTQzNjhiNmRiOTU5N2U2YjMyM2NhXzQ1NTkwL3ByZXZpZXdfdGFsa18zLndlYnAi%0D%0ALCJuZWVkUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImY0ZGQ1ZWYw%0D%0AYmU1OTQ5YzRiNjk1M2ZiYTIyYTllZDQyIiwidXNlcm5hbWUiOiJiNWM0MTdiZWQzN2I0ZDYzYjBj%0D%0AOTRiNjkwMTZiZmQ2NyJ9&inIFrame=1",clientWidth=document.body.clientWidth,wrapDiv=document.createElement("div");wrapDiv.id="heygen-streaming-embed";const container=document.createElement("div");container.id="heygen-streaming-container";const stylesheet=document.createElement("style");stylesheet.innerHTML=\`\\n  #heygen-streaming-embed {\\n    z-index: 9999;\\n    position: relative;\\n    width: 100%;\\n    height: 100%;\\n    border-radius: 8px;\\n    border: 2px solid #0c9651;\\n    box-shadow: 0px 8px 24px 0px rgba(0, 205, 102, 0.3);\\n    transition: all linear 0.1s;\\n    overflow: hidden;\\n    opacity: 1;\\n    visibility: visible;\\n  }\\n  #heygen-streaming-embed.expand {\\n    position: fixed;\\n    top: 50%;\\n    left: 50%;\\n    transform: translate(-50%, -50%);\\n    width: 80vw;\\n    height: 80vh;\\n    z-index: 10000;\\n    border-radius: 12px;\\n  }\\n  #heygen-streaming-container {\\n    width: 100%;\\n    height: 100%;\\n  }\\n  #heygen-streaming-container iframe {\\n    width: 100%;\\n    height: 100%;\\n    border: 0;\\n  }\\n  \`;const iframe=document.createElement("iframe");iframe.allowFullscreen=!1,iframe.title="Streaming Embed",iframe.role="dialog",iframe.allow="microphone",iframe.src=url;let visible=!1,initial=!1;window.addEventListener("message",(e=>{e.origin===host&&e.data&&e.data.type&&"streaming-embed"===e.data.type&&("init"===e.data.action?(initial=!0,wrapDiv.classList.toggle("show",initial)):"show"===e.data.action?(visible=!0,wrapDiv.classList.toggle("expand",visible)):"hide"===e.data.action&&(visible=!1,wrapDiv.classList.toggle("expand",visible)))})),container.appendChild(iframe),wrapDiv.appendChild(stylesheet),wrapDiv.appendChild(container),document.getElementById("heygen-container")?.appendChild(wrapDiv)}(globalThis);`;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      const embed = document.getElementById('heygen-streaming-embed');
      if (embed?.parentNode) embed.parentNode.removeChild(embed);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      const embed = document.getElementById('heygen-streaming-embed');
      if (embed) embed.classList.toggle('expand', next);
      return next;
    });
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message: feedback }),
      });
      if (res.ok) {
        setFeedback('');
        setRating(0);
        setFeedbackSent(true);
        setTimeout(() => setFeedbackSent(false), 4000);
      }
    } catch {
      // silently ignore — could add toast later
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3"
          >
            <Headphones className="text-primary" size={32} />
            Feedback &amp; Support
          </motion.h1>
          <p className="text-muted-foreground mt-2">
            We value your feedback and are here to help
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Left Column: Feedback + FAQ ───────────────────────────── */}
          <div className="space-y-6">
            {/* Rate Experience */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h2 className="font-display font-semibold text-xl text-foreground mb-4">
                Rate Your Experience
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-125 active:scale-95"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          (hoveredRating || rating) >= star
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground/40',
                        )}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {rating}/5
                  </span>
                )}
              </div>
            </motion.div>

            {/* Feedback Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="font-display font-semibold text-xl text-foreground mb-4">
                Share Your Feedback
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">Your Message</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Tell us about your experience or any suggestions..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="bg-background/50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedback.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </Button>
                  <AnimatePresence>
                    {feedbackSent && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-emerald-500 font-medium"
                      >
                        Thank you for your feedback!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display font-semibold text-xl text-foreground">
                    Frequently Asked Questions
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                {faqs.map((faq, index) => (
                  <div key={index} className="px-6 py-4">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors pr-4">
                        {faq.question}
                      </span>
                      {openFaq === index ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right Column: AI Avatar Assistant ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card overflow-hidden flex flex-col min-h-[600px] sticky top-8"
          >
            <div className="p-5 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-lg text-foreground">
                      AI Support Assistant
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs text-muted-foreground">
                        Virtual assistant — speak or type
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 bg-background/50">
              <div
                ref={heygenContainerRef}
                className="h-full min-h-[450px] rounded-lg overflow-hidden relative border border-border"
              >
                <div id="heygen-container" className="w-full h-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Support;
