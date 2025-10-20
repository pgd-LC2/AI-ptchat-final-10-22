
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/sidebar/Sidebar';
import ChatView from './components/chat/ChatView';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import AuthGuard from './components/auth/AuthGuard';
import Particles from './components/ui/Particles';
import { ThemeProvider } from './lib/ThemeProvider';

const ChatApp: React.FC = () => {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-screen w-screen bg-dark-bg-end flex overflow-hidden"
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
  
