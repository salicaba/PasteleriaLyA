export const ROLES = {
    ADMIN: 'admin',
    GENERAL: 'empleado general',
    PASTELERIA: 'empleado pasteleria',
    CAFETERIA: 'empleado cafeteria'
};

// 2. AQUÍ ESTÁ LA "INTELIGENCIA" DE REDIRECCIÓN Y PERMISOS
const CONFIG_ROLES = {
    [ROLES.ADMIN]: {
        rutaInicio: '/admin', // <--- El Admin va a su área
        permisos: ['admin', 'pasteleria', 'cafeteria']
    },
    [ROLES.GENERAL]: {
        rutaInicio: '/pasteleria', // <--- ¡AQUÍ ESTÁ LO QUE PEDISTE! El General inicia en Pastelería
        permisos: ['pasteleria', 'cafeteria'] // Pero puede ver ambas
    },
    [ROLES.PASTELERIA]: {
        rutaInicio: '/pasteleria', // Solo Pastelería
        permisos: ['pasteleria']
    },
    [ROLES.CAFETERIA]: {
        rutaInicio: '/cafeteria', // Solo Cafetería
        permisos: ['cafeteria']
    }
};

/**
 * Función que usa el Login para saber a dónde mandar al usuario
 */
export const obtenerRutaInicial = (rolUsuario) => {
    // Si no tiene rol o es desconocido, lo mandamos al login o admin por defecto
    const rol = rolUsuario ? rolUsuario.toLowerCase() : ROLES.ADMIN;
    return CONFIG_ROLES[rol]?.rutaInicio || '/admin';
};

/**
 * Función para saber qué botones mostrar en el menú
 */
export const tienePermiso = (rolUsuario, area) => {
    const rol = rolUsuario ? rolUsuario.toLowerCase() : ROLES.ADMIN;
    const permisos = CONFIG_ROLES[rol]?.permisos || [];
    return permisos.includes(area);
};

/**
 * Para que se vea bonito en las notificaciones (ej: "EMPLEADO GENERAL")
 */
export const formatearRol = (rol) => {
    return rol ? rol.toUpperCase() : "ADMIN";
};