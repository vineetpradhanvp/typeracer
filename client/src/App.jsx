import React from "react";
import { Route, Routes } from "react-router-dom";

import Header from "./components/header";
import Home from "./pages/home";
import Practice from "./pages/practice";
import PageNotFound from "./pages/pageNotFound.jsx";

import "./index.css";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}
