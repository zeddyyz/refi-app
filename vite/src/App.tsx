import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import MainLayout from "./pages/main";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRecoilState } from "recoil";
import { appThemeAtom } from "@/atoms/ui.action";

import LoginPage from "./pages/main/login";

function App() {
  const [appTheme, setAppTheme] = useRecoilState(appThemeAtom);

  useEffect(() => {
    const handleThemeToggle = () => {
      setAppTheme(!appTheme);
    };

    // Listen for the custom event dispatched from the preload script
    window.addEventListener('toggle-theme', handleThemeToggle);

    return () => {
      window.removeEventListener('toggle-theme', handleThemeToggle);
    };
  }, [appTheme, setAppTheme]);

  return (
    <TooltipProvider>
      <Router>
        <Switch>
          <Route path={["/:projectId", "/:projectId/(.*)"]}>
            <MainLayout />
          </Route>
          <Route path="/">
            <LoginPage />
          </Route>
        </Switch>
      </Router>
    </TooltipProvider>
  );
}

export default App;
