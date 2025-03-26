'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Container } from '@mui/material';
import { MdCheckCircle } from 'react-icons/md';

const ConfirmationScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 15000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'green.100',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          bgcolor: 'white',
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <MdCheckCircle style={{ color: 'green', fontSize: '100px' }} />
        <Typography variant="h4" color="green" sx={{ mt: 2 }}>
          Muchas Gracias
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          G
        </Typography> THANK YOU FOR YOUR COOPERATION
        <Typography variant="body1" sx={{ mt: 2 }}>
          Your response has been succesfully saved. 
        </Typography>
      </Box>
    </Container>
  );
};

export default ConfirmationScreen;
