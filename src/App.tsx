
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
import { staggeredContainer, floatUpItem } from './components/ui/motion-presets';

const ChatApp: React.FC = () => {
  return (
    <main
      className="h-screen w-screen flex overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 10 }}
    >
      <Particles />
      <motion.div
        variants={staggeredContainer(0.14, 0.28)}
        initial="hidden"
        animate="show"
        className="relative flex w-full h-full"
        style={{ zIndex: 10 }}
      >
        <motion.div variants={floatUpItem} className="h-full">
          <Sidebar />
        </motion.div>
        <motion.div variants={floatUpItem} className="flex-1 h-full">
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
  
