# Usa PHP 8.1.10 con Apache
FROM php:8.1.10-apache

# Establece el directorio de trabajo
WORKDIR /var/www/html

# Copia todos los archivos del proyecto al contenedor
COPY . .

# Habilita mod_rewrite para rutas amigables (opcional pero útil)
RUN a2enmod rewrite

# Asegura que las carpetas necesarias existan y tengan permisos de escritura
RUN mkdir -p /var/www/html/uploads \
    /var/www/html/samples \
    /var/www/html/samplescsv \
  && touch /var/www/html/fake_db.json \
    /var/www/html/signed_docs.json \
    /var/www/html/firmas.json \
  && chmod -R 777 /var/www/html/uploads \
    /var/www/html/samples \
    /var/www/html/samplescsv \
  && chmod 666 /var/www/html/fake_db.json \
    /var/www/html/signed_docs.json \
    /var/www/html/firmas.json
# Expón el puerto por defecto de Apache
EXPOSE 80
