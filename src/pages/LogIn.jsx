import '../Styles/LoginForm.css';
import React, { useState } from 'react';
import { getUser } from '../commons/ApiMethods';
import { useNavigate } from "react-router-dom";

function LogIn() {

  const navigate = useNavigate();
  const [inputUser, setInputUser] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const handleChange = (name, event) => {
    const value = event.target.value;
    setInputUser({ ...inputUser, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((inputUser.email && inputUser.password) === '') {
      setErrorMessage('Los campos son obligatorios');
      setShowError(true);
    } else {
      const response = await getUser(inputUser.email);
      if (response.error) {
        setErrorMessage('Debe de ser inscrito en el modulo de administracion');
        setShowError(true);
      } else {
        navigate('/pedidos');
      };
    };
  };

  const errorModalStyles = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    backgroundColor: 'rgb(255, 249, 249)',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    padding: '20px',
    textAlign: 'center',
    zIndex: '9999',
  };

  const errorModalPStyles = {
    margin: '0 0 10px',
    fontWeight: 'bold',
    color: 'red',
  };

  const errorModalButtonStyles = {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    padding: '10px 20px',
    cursor: 'pointer',
  };

  return (
    <section className='login-form-container'>
      <form className="login-form">
        <h2 className="login-title">Log In</h2>
        <div className="form-group">
          <label htmlFor="email">Correo</label>
          <input value={inputUser.email} onChange={(text) => handleChange("email", text)} type="email" id="email" placeholder="Ingrese su correo" />
        </div>
        {showError && (
          <div className="error-modal" style={errorModalStyles}>
            <p style={errorModalPStyles}>{errorMessage}</p>
            <button onClick={() => setShowError(false)} style={errorModalButtonStyles}>Cerrar</button>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input value={inputUser.password} onChange={(text) => handleChange("password", text)} type="password" id="password" placeholder="Ingrese su contraseña" />
        </div>
        <div className="form-group">
          <button onClick={handleSubmit} className="login-button">Log In</button>
        </div>
      </form>
    </section >
  );
}

export default LogIn;
