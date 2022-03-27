import { Button, ButtonBase, Typography } from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';
import React from 'react';
import './App.css';

function App() {
  const navigate = useNavigate()
  return (
    <div className="App">
      <ButtonBase onClick={() => { navigate('/') }} sx={{
        border: 10,
        borderRadius: '50%',
        height: '40px',
        width: '40px',
        borderColor: 'primary.main',
        position: 'absolute',
        top: 28,
        left: 32
      }}></ButtonBase>
      <Outlet />
    </div>
  );
}

export default App;
