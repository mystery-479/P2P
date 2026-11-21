import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="app">
      <Sidebar />

      <div className="main-wrapper" style={{ marginLeft: "260px" }}>
        <Header />
        <main className="container main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
