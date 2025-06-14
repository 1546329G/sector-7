// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\middleware\authorizeRoles.js

/**
 * Middleware para autorizar el acceso basado en roles.
 * @param {Array<string>} roles - Un array de roles permitidos para acceder a la ruta.
 * @returns {Function} El middleware de Express.
 */
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        // Asegurarse de que req.user existe y tiene un rol (authenticateToken debe haber corrido antes)
        if (!req.user || !req.user.rol) {
            return res.status(403).json({ message: 'Acceso denegado. No se encontró información de rol en el token.' });
        }

        // Verificar si el rol del usuario está incluido en los roles permitidos
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.` });
        }
        next(); // El usuario tiene el rol permitido, continuar con la siguiente función
    };
};

export default authorizeRoles;