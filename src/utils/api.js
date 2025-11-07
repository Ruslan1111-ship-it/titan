const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error.error || 'Ошибка запроса');
  }
  return response.json();
};

// Auth
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
};

// Clients
export const getClients = async () => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getClient = async (id) => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getClientByUuid = async (uuid) => {
  const response = await fetch(`${API_BASE_URL}/clients/uuid/${uuid}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createClient = async (clientData) => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(clientData),
  });
  return handleResponse(response);
};

export const updateClient = async (id, clientData) => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(clientData),
  });
  return handleResponse(response);
};

export const deleteClient = async (id) => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getClientQRCode = async (id) => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}/qrcode`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Trainers
export const getTrainers = async () => {
  const response = await fetch(`${API_BASE_URL}/trainers`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createTrainer = async (trainerData) => {
  const response = await fetch(`${API_BASE_URL}/trainers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(trainerData),
  });
  return handleResponse(response);
};

export const updateTrainer = async (id, trainerData) => {
  const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(trainerData),
  });
  return handleResponse(response);
};

export const deleteTrainer = async (id) => {
  const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Visits
export const getVisits = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/visits?${queryString}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const checkIn = async (uuid) => {
  const response = await fetch(`${API_BASE_URL}/visits/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid }),
  });
  return handleResponse(response);
};

export const getClientVisits = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/visits/client/${clientId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const deleteVisit = async (id) => {
  const response = await fetch(`${API_BASE_URL}/visits/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Analytics
export const getStats = async (period = 'month') => {
  const response = await fetch(`${API_BASE_URL}/analytics/stats?period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getTopClients = async (limit = 10, period = 'month') => {
  const response = await fetch(`${API_BASE_URL}/analytics/top-clients?limit=${limit}&period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getTrainerStats = async (period = 'month') => {
  const response = await fetch(`${API_BASE_URL}/analytics/trainer-stats?period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getVisitsChart = async (days = 30) => {
  const response = await fetch(`${API_BASE_URL}/analytics/visits-chart?days=${days}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getPeakHours = async (period = 'month') => {
  const response = await fetch(`${API_BASE_URL}/analytics/peak-hours?period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};
