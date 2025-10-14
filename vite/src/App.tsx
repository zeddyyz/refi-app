import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import MainLayout from "./pages/main";
import { TooltipProvider } from "@/components/ui/tooltip";

import LoginPage from "./pages/main/login";

function App() {
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
