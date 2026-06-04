const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            return res.status(403).json({ message: 'Acceso denegado. No se encontró información de rol en el token.' });
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.` });
        }
        next();
    };
};

export default authorizeRoles;
