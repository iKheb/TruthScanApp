import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import AppFooter from "./components/AppFooter";
import ProtectedRoute from "./components/ProtectedRoute";
import Analyze from "./pages/Analyze";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PersonalityTest from "./pages/PersonalityTest";
import Privacy from "./pages/Privacy";
import RelationshipCheck from "./pages/RelationshipCheck";
import Result from "./pages/Result";
import SavedPeople from "./pages/SavedPeople";
import SavedPersonDetail from "./pages/SavedPersonDetail";

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.32, ease: "easeOut" },
};

function App() {
  const location = useLocation();

  return (
    <div className="safe-bottom min-h-[100dvh] text-white">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div {...pageTransition}>
                <Home />
              </motion.div>
            }
          />
          <Route
            path="/analyze"
            element={
              <motion.div {...pageTransition}>
                <Analyze />
              </motion.div>
            }
          />
          <Route
            path="/result/:id"
            element={
              <motion.div {...pageTransition}>
                <Result />
              </motion.div>
            }
          />
          <Route
            path="/privacy"
            element={
              <motion.div {...pageTransition}>
                <Privacy />
              </motion.div>
            }
          />
          <Route
            path="/relationship-check"
            element={
              <motion.div {...pageTransition}>
                <RelationshipCheck />
              </motion.div>
            }
          />
          <Route
            path="/personality-test"
            element={
              <motion.div {...pageTransition}>
                <PersonalityTest />
              </motion.div>
            }
          />
          <Route
            path="/login"
            element={
              <motion.div {...pageTransition}>
                <Login />
              </motion.div>
            }
          />
          <Route
            path="/saved"
            element={
              <motion.div {...pageTransition}>
                <ProtectedRoute>
                  <SavedPeople />
                </ProtectedRoute>
              </motion.div>
            }
          />
          <Route
            path="/saved/:personId"
            element={
              <motion.div {...pageTransition}>
                <ProtectedRoute>
                  <SavedPersonDetail />
                </ProtectedRoute>
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
      <AppFooter />
    </div>
  );
}

export default App;
