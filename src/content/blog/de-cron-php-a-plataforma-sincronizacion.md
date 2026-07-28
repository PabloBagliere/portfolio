---
title: 'De un cron en PHP a una plataforma de sincronización'
description: 'Uno solo hablaba por API, del otro solo se podía leer la base de datos, y ninguno de los dos equipos iba a buscar nada. El MVP era un PHP con cron que tumbaba el servidor cada cuatro días. Así terminó siendo una plataforma con Node, BullMQ y Redis.'
pubDate: 2026-07-28
draft: false
tags: ['nodejs', 'typescript', 'bullmq', 'redis', 'integraciones']
---

## Dos sistemas, dos equipos, y nadie que busque nada

Un cliente de otra rama técnica vino con un problema: tenía dos sistemas que quería conectar. Cada sistema tenía sus datos y había que pasarlos de uno a otro. Hasta ahí, una integración más. El tema era el cómo:

- Un sistema funcionaba **solamente por API**: su equipo ponía los endpoints a disposición y nada más.
- El otro era **cerrado**: lo único que se podía tocar era la base de datos, y eso solo porque su administrador lo permitía.

Y ninguno de los dos equipos iba a mover un dedo por la integración. Cada uno dejaba que el otro viniera a buscar la información... y ninguno iba a buscar nada.

El cliente nos preguntó si podíamos hacerlo nosotros. La empresa aceptó, pero arrancando con un MVP para saber si era siquiera posible: claro, el de la API solo hablaba de su API y el de la base solo hablaba de sus tablas y su SQL.

## El MVP: un PHP, un cron y tres tablas

El MVP lo arrancó mi compañero: un script de PHP con un cron que, cada un minuto, leía tres tablas de la base y se las pasaba al otro sistema. La información viajaba en una sola vía.

Llegar a eso llevó su tiempo. El administrador de la base no quería darnos acceso directo a sus tablas: él armaba una vista, a su manera, y nosotros leíamos eso. Y el sistema de la API necesitaba información que esa vista no siempre tenía. Ejemplo concreto: la API necesitaba todas las categorías de artículos y la base solo nos daba los artículos. Para el MVP se hizo sin categorías y se siguió adelante.

De esas negociaciones salió el acuerdo que después gobernó todo el proyecto: **nosotros éramos solamente la ruta de la información**. No almacenamos ni editamos nada: ordenamos los datos para un lado y para el otro. Con eso en mente, aceptaron las tres partes: los dos equipos y el cliente.

## Cuando el MVP se quedó chico

Acá es donde entro yo: había que llevarlo a todo el mapa, unas veinte tablas contra unos quince endpoints. Y a primera vista ya se veían los problemas.

**El cron se pisaba a sí mismo.** La tabla de artículos eran treinta mil registros en una vista donde no se podía filtrar nada: no existía una columna que dijera "este artículo se modificó". Y la API necesitaba la información lo más cerca del tiempo real posible. Así que cada minuto el cron ejecutaba el PHP, que movía los treinta mil artículos en memoria y mataba la RAM y el procesador del servidor. Peor: había una condición de carrera. La consulta tardaba más de un minuto en ejecutarse, así que cuando una corrida no había terminado, empezaba la siguiente. Una escalada de recursos en cámara lenta: cada cuatro días, el servidor se quedaba sin nada.

La primera solución fue seguir en PHP pero pasarlo a un servicio de Linux con un timer: hasta que una ejecución no termina, no arranca la otra. Pisamiento resuelto.

**Después llegaron los ambientes.** Se decidió separar producción y desarrollo, para que el cliente ya pudiera ver los artículos con cambios de datos reales. Y no es lo mismo: en desarrollo el cambio era controlado —una o dos personas tocando información— mientras que en producción son veinte o veinticinco cambiando cosas al mismo tiempo. Hice los cambios para que corriera en los dos ambientes y apareció el error nuevo: el tiempo. Como PHP es síncrono, primero mandaba treinta mil artículos a producción y después treinta mil a desarrollo. Lo que tardaba unos dos minutos pasó a tardar cinco.

**Y encima creció el mapa.** Con todo esto, al cliente se le vendió también una app de ventas para los vendedores. Así que ya no era solo mandar de la base a la API: había que mandarle lo mismo a otra base más:

```
Base producción   →  API producción
                  →  Base ventas (producción)

Base desarrollo   →  API desarrollo
                  →  Base ventas (desarrollo)
```

Y atrás se veía venir lo siguiente: la empresa hermana del cliente quería implementar lo mismo —otros sistemas, otras bases— pero con la misma forma.

## Lo que necesitaba y PHP no me daba

Antes de escribir una línea me senté a listar qué tenía que poder hacer el sistema. No qué tecnología quería usar: qué tenía que poder hacer. Me quedó esto:

- **Que un error no se pierda.** Si el insert de un registro falla, quiero saber cuál falló, por qué, poder reintentarlo, y si después de varios intentos sigue fallando, que alguien se entere. No que quede enterrado en un log.
- **Que un error no arrastre al resto.** Si la API tarda 40 segundos en un pedido, los otros 3.000 registros no tienen por qué esperarlo.
- **Que agregar una tabla nueva sea barato.** En ese momento eran cuatro tablas. Iban a ser veinte, más la vuelta al revés: sacar de la API e insertar en las bases.
- **Que agregar un sistema nuevo también lo sea.** Ya tenía HTTP, SQL Server y MySQL. La otra empresa usa Postgres y Oracle. Si cada motor implicaba reescribir la lógica de sincronización, estaba perdido.
- **Que el tiempo deje de ser mi problema.** Treinta mil artículos por ciclo. El origen no me iba a dar una columna de "última modificación" y la API no iba a hacer magia. La única salida era dejar de mandar lo que no cambió.

Con esa lista, PHP sincrónico con un timer arriba no daba. Propuse reescribirlo en Node —asíncrono por defecto— con TypeScript, y me dijeron que sí.

## La forma del sistema

Todo el sistema es una sola idea repetida:

```
origen → transformar → ¿esto cambió? → cola → destino(s)
```

Cada paso es reemplazable y ninguno sabe del otro. El que lee una base no sabe que existe una API del otro lado; el que escribe en la API no sabe de dónde salió el dato. En el medio hay una cola, y la cola es lo que convierte "un proceso que sincroniza" en "un montón de envíos independientes que fallan por separado".

## Detectar qué cambió cuando nadie te ayuda

Este es el corazón y es más simple de lo que parece.

Por cada fila que leo, ordeno sus claves alfabéticamente, armo un string tipo `campo:valor|campo:valor|...` y le saco un MD5. Ese hash lo guardo en Redis con una clave `sync:hash:<flujo>:<clave-del-registro>`.

En el ciclo siguiente vuelvo a leer, vuelvo a hashear y comparo:

- no hay hash guardado → es nuevo, va;
- el hash es distinto → cambió, va;
- el hash es igual → lo tiro, no existió.

Lo de ordenar las claves no es cosmético: sin eso, la misma fila devuelta en otro orden de columnas da un hash distinto y terminás reenviando todo cada ciclo.

**Acá conviene ser honesto con lo que esto resuelve y lo que no.** Sigo leyendo las treinta mil filas cada minuto: la vista no tiene por dónde filtrar y eso no lo podía arreglar yo. Lo que desaparece son los treinta mil envíos. De 30.000 escrituras por ciclo a las tres o cuatro que de verdad cambiaron. El cuello de botella dejó de ser la red y el sistema de destino, y pasó a ser una consulta SQL que puedo medir.

**El arranque en frío.** Si Redis se reinicia y arranca vacío, el sistema considera que todo es nuevo y reencola treinta mil registros. Así que cada cinco minutos vuelco todo Redis a una tabla en MySQL, en lotes, y al levantar, si Redis está vacío, lo repuebla desde ahí. Los hashes son estado derivado: si se pierden, no perdí datos, reenvié de más. Esa distinción es la que me deja dormir tranquilo guardándolos en un caché.

**Las bajas.** Como guardo todas las claves que conozco, si un registro deja de aparecer en el origen puedo darme cuenta y encolar un borrado. Con una excepción que apareció con la sincronización inversa: hay flujos donde "desapareció del origen" significa *"ya lo sincronicé"*, no *"lo borraron"*. Para esos hay una marca que dice "conservá el hash igual", porque si el registro reaparece la semana que viene quiero saber que ya pasó por acá y no tratarlo como nuevo.

## Una fila que cambió es un trabajo, no un lote

Cada cambio detectado genera un trabajo por cada destino. Si un artículo cambia y va a la API y a la base de ventas, son dos trabajos independientes. Si el de la API falla, el de la base ya se guardó igual.

Eso lo maneja BullMQ —una cola sobre Redis—, y ahí se acomodaron solos varios de los problemas de la etapa anterior:

- **Reintentos:** cinco intentos con espera exponencial arrancando en cinco segundos. Los cortes de red y los timeouts de la API se resuelven solos y nadie se entera.
- **Prioridades:** artículos y pedidos van con prioridad alta; las tablas maestras que se sincronizan una vez por hora, con la más baja. Si entran diez mil registros de una tabla que no le importa a nadie, los pedidos siguen pasando primero.
- **Degradación en el reintento:** cuando un trabajo falla, su reintento baja de prioridad. Un registro roto que va a fallar cinco veces no se puede quedar con los workers adelante de los que funcionan.
- **Concurrencia y freno:** varios trabajos en paralelo, con un tope de envíos por segundo para no voltear la API del otro equipo. La cantidad se cambia con una variable de entorno.

Y el problema original, el de los ciclos pisándose: si el ciclo anterior de un flujo todavía está corriendo, el nuevo se saltea y deja un aviso en el log. Dos líneas de código contra lo que antes era el servidor quedándose sin recursos cada cuatro días.

## Adaptadores: el motor no sabe con quién habla

Hay una clase abstracta con cinco métodos: conectar, enviar, borrar, "¿soportás esta entidad?" y cerrar. Nada más. Cada tecnología la implementa a su manera: uno hace HTTP, otro arma SQL para SQL Server, otro para MySQL.

El motor de sincronización no sabe qué hay del otro lado. Le pide un adaptador al registro por nombre y le manda datos. Sumar Postgres mañana es implementar esa interfaz; no se toca ni una línea del que detecta cambios ni del que maneja la cola.

## La configuración es el producto

Esta es la parte que más cambió el día a día. Hay tres archivos que se tocan y nada más.

**Los orígenes** dicen de dónde sale el dato y cómo se llama cada campo puertas adentro:

```ts
articulos: {
  query: 'SELECT * FROM vista_articulos',
  primaryKey: ['codigo'],
  fields: {
    codigo:      'ART_CODIGO',
    descripcion: 'ART_DESCRIP',
    precio:      'ART_PRECIO',
  },
}
```

**Los destinos** dicen exactamente lo mismo al revés: cómo lo necesita el sistema que lo recibe.

```ts
articulos: {
  endpoint: 'articulos',
  keyField: 'sku',
  fields: {
    sku:    'codigo',
    nombre: 'descripcion',
    precio: (row) => Number(row.precio).toFixed(2),
  },
}
```

Un campo puede ser un nombre o una función, y con eso resolvés el noventa por ciento de las diferencias entre dos sistemas sin escribir código aparte.

**Y arriba de todo, el flujo**, que es el que ata las puntas:

```ts
{
  name: 'articulos',
  source: { adapter: 'erp' },
  destinations: ['api-externa', 'db-ventas'],
  pollInterval: 60 * 1000,
  priority: 'high',
  transform: 'agruparArticulos',
  alerts: {
    onJobFailed: [
      { type: 'email', to: ['quien-corresponda@ejemplo.com'], destinations: ['api-externa'] },
    ],
  },
}
```

Eso es una tabla nueva: un bloque en el origen, un bloque en cada destino, un flujo. Sin tocar el motor. Y como cada flujo tiene nombre, ese nombre me genera solo los endpoints de la API para forzarlo a mano.

## Transformadores

Cuando los datos no entran a martillazos con un mapeo de campos, hay transformadores: funciones puras que reciben un arreglo de filas y devuelven otro. Agrupar los renglones de un pedido bajo su cabecera, traducir códigos de provincia, descartar filas que vienen sin vendedor asignado.

Se pueden encadenar y se pueden poner de los dos lados: en el origen si la porquería viene de la base, en el destino si es un capricho del sistema que recibe. Y como son funciones puras, se testean sin base de datos, sin API y sin levantar nada. Toda la lógica sucia del negocio vive ahí adentro, y es justamente la parte que más se rompe cuando alguien cambia algo del otro lado.

## Los destinos SQL hacen más que un INSERT

Escribir en una base casi nunca es una tabla. Un pedido es una cabecera y N renglones, y a veces un update de estado.

Cada entidad de un destino SQL es un arreglo de consultas con marcadores `{{campo}}`, que se ejecutan **dentro de una transacción**. Una consulta puede tener una condición (ejecutame esto solo si el estado es tal) o iterar un arreglo del dato (una consulta por cada renglón). En MySQL además un campo puede resolverse con una subconsulta contra otra tabla en la misma transacción, para resolver una clave foránea que el origen no me da.

O sale todo, o no sale nada. Si algo revienta, el trabajo entero vuelve a la cola y se reintenta.

## Idempotencia, o cómo no duplicar todo

Cuando reintentás, todo tiene que poder ejecutarse dos veces sin romper nada. Y del otro lado hay una API ajena.

La solución terminó siendo bastante boba: mando `POST`; si me responde 409 —o un cuerpo que dice que ya está registrado— reintento con `PATCH` sobre la misma clave. Con eso, mandar el mismo registro cinco veces deja el mismo resultado que mandarlo una.

Sobre eso monté lo que más me gusta del sistema: **un destino puede disparar otro cuando termina bien**. El caso real es que después de que un documento se manda a la API, hay que marcarlo como exportado en la base de origen. Se declara en el flujo y se ejecuta después del envío exitoso.

Tiene un costo explícito que conviene decir: si esa marca falla, el trabajo entero se reintenta, **incluido el envío original**. Por eso el POST → 409 → PATCH no es un detalle: es lo que hace que ese encadenado sea seguro.

## Cuando algo falla de verdad

Cinco intentos fallidos es un problema real y ahí sí hay que molestar a alguien. Cada flujo declara sus canales de alerta —mail, webhook o Slack— y cada canal se puede limitar a ciertos destinos: si falla contra la API, avisale a estas dos personas; si falla contra la base de ventas, al DBA. Hay un endpoint para probar las alertas sin tener que romper nada a propósito.

## La botonera

Le puse un backend HTTP arriba con Fastify, y sinceramente es lo que más usa el cliente:

- forzar un flujo ahora mismo;
- reenviar todo un flujo desde cero, borrando los hashes;
- sincronizar **un solo registro** por su clave, o resetear solo ese;
- pausar y reanudar un flujo, con el estado guardado en Redis para que sobreviva a un reinicio;
- limitar un flujo a N corridas y que se pause solo —esto es exactamente lo que querés el día que subís algo nuevo a producción y preferís que corra tres veces y frene;
- un panel con el estado de cada flujo, los últimos errores y las métricas, más la interfaz de la cola para ver los trabajos uno por uno.

Cuando alguien dice "no me llegó el artículo tal", la respuesta es un endpoint, no un deploy.

## Ver qué pasa adentro

El sistema exporta trazas, métricas y logs por OpenTelemetry.

Una traza arranca en la lectura del origen, sigue en el encolado y continúa en el worker que hace el envío, con el número de intento, el adaptador y la clave del registro como atributos. Los logs llevan el identificador de traza, así que de un log saltás a la traza completa de ese registro. Y cada ciclo mide sus fases por separado: cuánto tardó la consulta, cuánto transformar, cuánto comparar hashes, cuánto encolar.

Suena a lujo y no lo es. Con dos equipos que no se hablan entre sí, poder decir en treinta segundos *"de los cuatro segundos, tres coma nueve son la consulta de ustedes"* vale más que cualquier optimización. Dejó de ser una discusión de opiniones.

## Un solo sistema, dos ambientes

Desarrollo y producción corren el mismo código. Lo único que cambia son los orígenes y destinos declarados y qué flujo apunta a cuál. Nada de ramas paralelas ni de "esto en producción es distinto": si funciona en desarrollo, es el mismo camino.

## El resultado

Cuando se puso en producción, les encantó: al cliente, y al equipo de la API, que empezó a recibir los cambios mucho más rápido. Pudimos implementar todas las tablas y los flujos inversos sin tanto lío.

Pero la prueba de fuego fue la empresa hermana: mismos problemas, otros sistemas, otras bases de datos. Con los adaptadores y las plantillas ya hechos, **en una semana estaba todo en funcionamiento**.

Y después pasó algo que no me esperaba: mis compañeros empezaron a usarlo en otros clientes para integraciones más chicas, justamente por lo fácil y rápido que es sumarle un flujo nuevo.

## Lo que esto no resuelve

Para no vender humo:

- **No es tiempo real.** Es un intervalo corto más el tiempo de cola. Puedo bajar el intervalo, no eliminarlo, mientras el origen no me avise cuando algo cambia.
- **Puede reenviar de más, nunca de menos.** Si el caché de hashes se pierde y el último volcado quedó cinco minutos atrás, el peor caso es mandar cosas que el destino ya tenía. Es tolerable justamente porque todo es idempotente.
- **No soy la fuente de verdad de nada.** No guardo ni edito datos de nadie: los ordeno y los muevo. Fue el acuerdo con el que arrancó todo, y terminó siendo también la razón por la que el sistema puede borrar todo su estado y reconstruirlo desde cero.
