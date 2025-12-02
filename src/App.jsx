// src/App.jsx
import React from "react";
import HojaRegistroHoras from "./components/HojaRegistroHoras";

function App() {
  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center">
      {/* Podés poner acá un fondo general de la app */}
      <HojaRegistroHoras />
    </div>
  );
}

export default App;
