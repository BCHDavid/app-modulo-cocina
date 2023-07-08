import LogIn from './pages/LogIn';
import Order from './pages/Orders';

import {
  BrowserRouter as Router,
  Route,
  Routes
} from 'react-router-dom';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path='/' exact element={<LogIn />} />
          <Route path='/pedidos' exact element={<Order />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
