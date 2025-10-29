
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/sidebar/Sidebar';
import ChatView from './components/chat/ChatView';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PricingPage from './components/pricing/PricingPage';
import AuthGuard from './components/auth/AuthGuard';
import Particles from './components/ui/Particles';
import { ThemeProvider } from './lib/ThemeProvider';
import RouteTransition from './components/ui/RouteTransition';
import { staggerContainer, slideInFromLeft, slideInFromRight } from './lib/motion';

const ChatApp: React.FC = () => {
  return (
    <main
      className="relative flex h-screen w-screen overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 10 }}
    >
      <Particles />
      <motion.div
        variants={staggerContainer(0.16, 0.28)}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex h-full w-full px-4 py-6 sm:px-8 sm:py-10"
        style={{ zIndex: 10 }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/10 bg-white/10 backdrop-blur-3xl shadow-[0_60px_160px_-60px_rgba(8,16,32,0.8)] sm:inset-6"
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
          <motion.div
            variants={slideInFromRight}
            className="flex-1 h-full"
          >
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
  
