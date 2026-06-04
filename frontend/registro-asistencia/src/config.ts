// Configuración centralizada de APIs
// Las variables VITE_ se cargan desde frontend/registro-asistencia/.env
// que debe coincidir con los puertos definidos en el .env raíz del proyecto

export const API1_URL = import.meta.env.VITE_API1_URL || 'http://localhost:5009';
export const API2_URL = import.meta.env.VITE_API2_URL || 'http://localhost:5011';
export const API3_URL = import.meta.env.VITE_API3_URL || 'http://localhost:5010';
export const MAIN_URL = import.meta.env.VITE_MAIN_URL || 'http://localhost:3000';
