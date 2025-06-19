# Usa PHP 8.1.10 con Apache
FROM php:8.1.10-apache

# Copia todos tus archivos a la carpeta pública del servidor Apache
WORKDIR /var/www/html
COPY . .

# Opcional: habilita mod_rewrite (si lo necesitas para rutas amigables)
RUN a2enmod rewrite

RUN mkdir -p /var/www/html/uploads && chown -R www-data:www-data /var/www/html/uploads

# Expón el puerto 80 para acceder desde el navegador
EXPOSE 80
