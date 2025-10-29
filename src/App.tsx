
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/sidebar/Sidebar';
import ChatView from './components/chat/ChatView';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PricingPage from './components/pricing/PricingPage';
import AuthGuard from './components/auth/AuthGuard';
import { ThemeProvider } from './lib/ThemeProvider';
import RouteTransition from './components/ui/RouteTransition';
import { staggerContainer, slideInFromLeft, slideInFromRight } from './lib/motion';
import FlowImage from './components/ui/FlowImage';

const ChatApp: React.FC = () => {
  return (
    <main className="fixed inset-0 z-10 flex overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <FlowImage
          src="/666-2.webp"
          speed={0.42}
          intensity={0.012}
          scale={1.92}
          hueShift={0.06}
          className="absolute inset-0 h-full w-full"
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-[-12%] mix-blend-screen opacity-70"
          initial={{ backgroundPosition: '0% 0%' }}
          animate={{ backgroundPosition: ['0% 0%', '100% 50%', '0% 100%'] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage:
              'radial-gradient(35% 45% at 12% 18%, rgba(56, 189, 248, 0.22), transparent 60%), radial-gradient(48% 52% at 82% 20%, rgba(244, 114, 182, 0.24), transparent 65%), radial-gradient(60% 60% at 50% 82%, rgba(124, 58, 237, 0.22), transparent 70%)',
            backgroundSize: '120% 120%',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/25 to-slate-950/80" />
      </div>
      <motion.div
        variants={staggerContainer(0.16, 0.28)}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex h-full w-full"
        style={{ zIndex: 10 }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/10 bg-white/10 backdrop-blur-3xl shadow-[0_60px_160px_-60px_rgba(8,16,32,0.8)]"
          style={{ zIndex: 8 }}
        />
        <div
          className="relative flex h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_40px_120px_-50px_rgba(15,23,42,0.85)]"
          style={{ zIndex: 9 }}
        >
          <motion.div
            variants={slideInFromLeft}
            className="h-full"
          >
            <Sidebar />
          </motion.div>
          <motion.div variants={slideInFromRight} className="relative z-10 flex-1 h-full">
            <ChatView />
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<RouteTransition><LoginPage /></RouteTransition>} />
        <Route path="/register" element={<RouteTransition><RegisterPage /></RouteTransition>} />
        <Route
          path="/pricing"
          element={
            <AuthGuard>
              <RouteTransition>
                <PricingPage />
              </RouteTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <RouteTransition className="flex">
                <ChatApp />
              </RouteTransition>
            </AuthGuard>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AnimatedRoutes />
      </ThemeProvider>
    </Router>
  );
}

export default App;
  