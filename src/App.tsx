import React from "react";
import AppRoutes from "./routes";
import SessionReplacedModal from "./components/common/Modal/SessionReplacedModal";

const App: React.FC = () => {
  return (
    <>
      <AppRoutes />
      <SessionReplacedModal />
    </>
  );
};

export default App;
