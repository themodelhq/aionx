import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Image,
  Video,
  Mic,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Play,
  Star,
  Check
} from 'lucide-react';

const features = [
  {
    icon: Image,
    title: 'Image Generation',
    description: 'Create stunning visuals from text descriptions with advanced AI models',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Video,
    title: 'Video Creation',
    description: 'Transform images into dynamic videos or generate from text prompts',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Mic,
    title: 'Text-to-Speech',
    description: 'Convert text to natural-sounding audio with multiple voice options',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sparkles,
    title: 'AI Chat',
    description: 'Creative conversations with AI that understands your vision',
    color: 'from-emerald-500 to-teal-500',
  },
];

const benefits = [
  'Unlimited image generations for Pro users',
  'Fast processing with priority queue',
  'Multiple style presets and customization',
  'High-resolution exports',
  'Commercial usage rights',
  '24/7 support',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-secondary/20 rounded-full blur-[120px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 text-white"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-display font-bold gradient-text">AionX</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link to="/register" className="btn-primary flex items-center gap-2">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Star className="w-4 h-4 text-warning" />
            <span className="text-sm text-text-secondary">Powered by Advanced AI</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
            Create{' '}
            <span className="gradient-text">Without</span>
            <br />
            Limits
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Generate stunning images, videos, and audio with AI that understands your vision.
            No design skills required — just describe what you want.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
              Start Creating Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="flex items-center gap-2 px-6 py-4 text-text-secondary hover:text-white transition-colors">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16 pt-8 border-t border-white/5">
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">1M+</p>
              <p className="text-sm text-text-muted">Creations</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">50K+</p>
              <p className="text-sm text-text-muted">Artists</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">4.9</p>
              <p className="text-sm text-text-muted">Rating</p>
            </div>
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative mt-20"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-bg-secondary/50 backdrop-blur-xl p-8 shadow-2xl">
            {/* Decorative grid */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />

            {/* Mock interface */}
            <div className="relative grid grid-cols-3 gap-4">
              {[
                { label: 'Image', color: 'bg-pink-500/20 border-pink-500/30', icon: Image },
                { label: 'Video', color: 'bg-violet-500/20 border-violet-500/30', icon: Video },
                { label: 'Audio', color: 'bg-cyan-500/20 border-cyan-500/30', icon: Mic },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className={`aspect-square rounded-2xl border ${item.color} p-6 flex flex-col items-center justify-center gap-4`}
                >
                  <ItemIcon className="w-12 h-12" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
                );
              })}
            </div>
          </div>

          {/* Floating elements */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-4 top-1/4 w-16 h-16 rounded-xl bg-gradient-primary opacity-60 blur-xl"
          />
          <motion.div
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-4 top-1/3 w-20 h-20 rounded-full bg-accent-secondary opacity-40 blur-xl"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Powerful AI tools combined in one seamless platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-bg-secondary/50 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                  <FeatureIcon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Why Choose{' '}
                <span className="gradient-text">AionX</span>?
              </h2>
              <p className="text-xl text-text-secondary mb-8">
                Join thousands of creators who trust AionX for their AI-powered creative needs.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Feature card */}
              <div className="relative rounded-2xl bg-bg-secondary/80 border border-white/10 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Lightning Fast</h3>
                    <p className="text-sm text-text-secondary">Generation in seconds</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Image Generation</span>
                    <span className="text-success">~5s</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-primary border-2 border-bg-secondary"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary">
                    Joined today
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -inset-4 bg-gradient-primary/20 rounded-3xl blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-primary p-12 overflow-hidden"
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
            />

            <div className="relative">
              <Clock className="w-12 h-12 mx-auto mb-6 text-white/80" />
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white">
                Ready to Create?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Start with 100 free credits. No credit card required.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-bg-primary font-semibold rounded-xl hover:bg-white/90 transition-colors"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-white"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-display font-bold">AionX</span>
            </div>

            <p className="text-text-muted text-sm">
              &copy; {new Date().getFullYear()} AionX. Create without limits.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
