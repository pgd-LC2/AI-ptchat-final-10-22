
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
    <main
      className="relative flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-950/85 via-gray-900/80 to-gray-950/90 text-white"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 10 }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <FlowImage
          src="/666-2.webp"
          speed={0.28}
          intensity={0.006}
          scale={1.85}
          hueShift={0}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <motion.div
        variants={staggerContainer(0.16, 0.28)}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex h-full w-full items-stretch gap-6 px-4 py-6 sm:px-10 sm:py-12"
        style={{ zIndex: 10 }}
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
  
