
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/sidebar/Sidebar';
import ChatView from './components/chat/ChatView';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PricingPage from './components/pricing/PricingPage';
import AuthGuard from './components/auth/AuthGuard';
import Particles from './components/ui/Particles';
import { ThemeProvider } from './lib/ThemeProvider';

const ChatApp: React.FC = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-screen w-screen flex overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 2 }}
    >
      <Particles />
      <div className="relative flex w-full h-full">
        <Sidebar />
        <ChatView />
      </div>
    </motion.main>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/pricing"
            element={
              <AuthGuard>
                <PricingPage />
              </AuthGuard>
            }
          />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <ChatApp />
              </AuthGuard>
            }
          />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
  
