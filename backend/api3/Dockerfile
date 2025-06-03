# Puedes verificar la versi�n de Node.js que usas localmente con "node -v" 
FROM node:18-alpine 
 
# Establece el directorio de trabajo dentro del contenedor 
WORKDIR /app 
 
# Copia los archivos de definici�n de dependencias y los instala 
# Esto se hace primero para aprovechar el cache de Docker si las dependencias no cambian 
COPY package.json package-lock.json ./ 
 
# Instala las dependencias de producci�n. 
RUN npm ci --production 
 
# Copia el resto del c�digo fuente de tu aplicaci�n al directorio de trabajo 
COPY . . 
 
# Define las variables de entorno que tu aplicaci�n usar� para la conexi�n a la base de datos 
# y otros ajustes. Los valores REALES se pasar�n al desplegar en Cloud Run. 
ENV NODE_ENV production 
ENV DB_CLIENT "mysql" 
ENV DB_NAME "sector7" 
ENV DB_USER "root" 
ENV DB_PORT "3306" 
 
# El DB_HOST para Cloud Run es especial: usa el nombre de conexi�n de tu instancia de Cloud SQL. 
# Lo estableceremos con el prefijo /cloudsql/ para MySQL en Cloud Run. 
# ENV DB_HOST "/cloudsql/southern-scene-460623-t8:us-central1:sector7" 
# ENV DB_PASSWORD "TU_CONTRASE�A_DE_ROOT_DE_CLOUD_SQL" 
 
# Exponer el puerto en el que escucha tu aplicaci�n. 
# Tu server.js est� configurado para escuchar en process.env.PORT o 5009. 
EXPOSE 5009 
 
# Comando para iniciar tu aplicaci�n cuando el contenedor se ejecute 
# Tu archivo principal se llama server.js. 
CMD ["node", "server.js"] 











