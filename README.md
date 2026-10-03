# Nuestra Casa

App web de la familia para repartir las tareas de la casa, sumar puntos con premio semanal y llevar la lista del mercado.

- **Tareas:** cada tarea dice en qué lugar de la casa es, a quién le toca, para cuándo y si se repite.
- **Puntos:** Fácil 5 · Media 10 · Difícil 20. Quien más sume de lunes a domingo gana el premio de la semana siguiente.
- **Mercado:** la categoría se pone sola y hay modo súper para cuando están comprando.

Se instala en el celular desde el navegador (Chrome en Android: menú ⋮ → Instalar app; Safari en iPhone: Compartir → Agregar a inicio).

Los datos viven en Supabase. Para entrar se necesita el código de la casa, que **no** está en este repositorio: se comparte solo por WhatsApp con la familia. La llave de Supabase que aparece en `index.html` es pública por diseño; sin el código no permite leer ni cambiar nada.
