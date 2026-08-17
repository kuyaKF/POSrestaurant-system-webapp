import { Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { BottomNav } from "./components/layout/BottomNav";
import { OrderBoardPage } from "./pages/OrderBoardPage";
import { NewOrderPage } from "./pages/NewOrderPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { KitchenViewPage } from "./pages/KitchenViewPage";
import { InventoryDashboardPage } from "./pages/InventoryDashboardPage";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<OrderBoardPage />} />
          <Route path="/new-order" element={<NewOrderPage />} />
          <Route path="/kitchen" element={<KitchenViewPage />} />
          <Route path="/inventory" element={<InventoryDashboardPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
