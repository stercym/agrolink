import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import ProductDetails from "./components/ProductDetails";

function App() {
  const [refresh, setRefresh] = useState(false);
  const handleAdded = () => setRefresh(!refresh);

  return (
    <Router>
      <div>
        <h1>Welcome to Agrolink</h1>
        <p>Empowering farmers and you to achieve more!</p>

        <nav>
          <Link to="/">Home</Link> | <Link to="/products">Products</Link>
        </nav>

        <Routes>
          
          <Route
            path="/"
            element={
              <div>
                <h2>Welcome to Agrolink Marketplace</h2>
                <p>Discover fresh produce directly from local farmers.</p>
              </div>
            }
          />

          
          <Route
            path="/products"
            element={<ProductList key={refresh} />}
          />

          
          <Route
            path="/products/new"
            element={<ProductForm onAdded={handleAdded} />}
          />

          
          <Route path="/products/:id" element={<ProductDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;



