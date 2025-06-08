export type Periodo  = {
  value: string;
  label: string;
};
export type Semana = {
  inicio: string;
  fin: string;
  label: string;
};
export type Professor = {
  id: string;
  nombre: string;
  idNumber: string;
  contractHours: number;
};
export type DailyHours = {
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
};
export type ProfessorWeeklyAttendance = {
  weekId: string; 
  weekLabel: string;
  semanaInfo: Semana; 
  days: DailyHours;
};
export type AllProfessorsWeeklyEntry = {
  profesorId: string;
  profesorNombre: string;
  days: DailyHours;
};


