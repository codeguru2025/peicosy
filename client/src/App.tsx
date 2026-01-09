import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/Shop"; // Reusing Shop for now as list, separate detail if needed later
import Cart from "@/pages/Checkout"; // Checkout page
import Orders from "@/pages/Orders";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/shop" component={Shop} />
      <Route path="/checkout" component={Cart} />
      <Route path="/orders" component={Orders} />
      <Route path="/admin" component={AdminDashboard} />
      {/* Product detail route would go here, usually /product/:id */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
