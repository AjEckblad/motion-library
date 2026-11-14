// Spanish text for each animation: { id: { title, trick, notes } }. Missing ids fall back to English (js/i18n.js).
export const ES = {
 "snowflake": {
  "title": "Copo de nieve",
  "trick": "El hielo despliega seis brazos ramificados y luego empieza otro cristal",
  "notes": [
   "El vapor se difunde en una red hexagonal; un borde se congela cuando su capa líquida es gruesa, y las puntas superan a las caras y se ramifican.",
   "Cada vuelta crece un cristal distinto de cuatro juegos de parámetros; size acerca el microscopio y speed fija la velocidad de crecimiento."
  ]
 },
 "meadow": {
  "title": "Prado",
  "trick": "Ráfagas barren la hierba soleada; mueve el puntero para girar el viento",
  "notes": [
   "Una ladera de hierba alta a la hora dorada: las ráfagas la recorren en olas que puedes seguir y las briznas brillan donde el sol bajo las atraviesa. Mueve el puntero para girar el viento.",
   "Sesenta mil briznas comparten una tira que se dobla; cada una se inclina según el viento en su raíz, un empuje constante más bandas de ruido que avanzan con el viento, así que cada ráfaga cruza el campo."
  ]
 },
 "ocean": {
  "title": "Mar abierto",
  "trick": "Olas grises avanzan con el viento; mueve el puntero para desplazar el brillo del sol",
  "notes": [
   "Un mar abierto, gris y con viento, bajo un cielo cubierto: cuatro FFT en la GPU convierten cada fotograma un espectro JONSWAP, concentrado en un abanico estrecho alrededor del viento, en olas de Gerstner de cresta larga que ruedan hacia ti, y la espuma se forma donde la superficie se pliega y se estira en vetas a favor del viento.",
   "El viento fija la altura de las olas y la frecuencia de las rompientes, el oleaje afila las crestas y el sol es la altura del sol oculto tras las nubes; el puntero mueve su zona luminosa a lo largo del horizonte."
  ]
 },
 "honey-coil": {
  "title": "Miel vertida",
  "trick": "Un hilo dorado se enrolla en columna; arrastra para mover la cuchara",
  "notes": [
   "La miel cae de una cuchara quieta en un cuenco de porcelana y se enrolla en una columna de anillos que se hunde en el charco y de vez en cuando se vuelca. Arrastra para mover la cuchara y coser un rastro de bucles.",
   "Flujo fija el grosor del hilo, bucles las vueltas por segundo, extensión lo rápido que se desploma el montículo; arrastra el puntero para coser rastros de bucles."
  ]
 },
 "diff-growth": {
  "title": "Crecimiento diferencial",
  "trick": "Una línea de tinta crece más que la página y se pliega en un laberinto",
  "notes": [
   "Una fina línea de tinta crece más de lo que cabe en el papel y se pliega hacia fuera en un laberinto ramificado, con contornos anidados dentro; la tinta pasa del azul profundo en el centro antiguo al bermellón en el borde más nuevo.",
   "Los nodos repelen a los cercanos, se acercan al punto medio de sus vecinos y dividen las aristas estiradas. Crecimiento fija cuánto se dividen; Separación, el ancho de los pliegues."
  ]
 },
 "stained-glass": {
  "title": "Vidriera",
  "trick": "Haces de sol de colores cruzan una iglesia; mueve el puntero para mover la luz",
  "notes": [
   "El sol entra por una hilera de vidrieras emplomadas, hundidas en los muros de piedra de la nave: haces de color en el aire polvoriento y manchas en las losas pulidas que se desplazan con él.",
   "La vidriera es una función que devuelve el color del vidrio o el plomo; el suelo y cada paso por el aire la consultan siguiendo la luz del sol. Mueve el puntero para mover el sol."
  ]
 },
 "lenia": {
  "title": "Lenia",
  "trick": "Formas blandas y vivas se deslizan, giran y sanan; arrastra para herir una",
  "notes": [
   "Criaturas reales del catálogo Lenia de Bert Chan se deslizan, giran, chocan y se curan en una gota bajo un microscopio de fluorescencia; mueve para enfocar, arrastra para herir.",
   "Cada celda promedia a sus vecinas a través de un anillo suave y crece o se desvanece según una campana. Velocidad fija los pasos por fotograma; Población, cuántas viven."
  ]
 },
 "dynamic-island": {
  "title": "Isla dinámica",
  "trick": "La píldora de la cámara se convierte en llamadas y música; toca para abrir el reproductor",
  "notes": [
   "En la pantalla de bloqueo, la píldora alrededor de la cámara se convierte en una llamada, su temporizador, un reproductor de música y una cuenta atrás. Tócala para abrir o cerrar el reproductor.",
   "La forma es un clip-path cuyo ancho, alto y radio son muelles, así que se pasa un poco y se asienta, y cualquier cambio la redirige; el contenido sale rápido y entra un instante después, con un breve desenfoque."
  ]
 },
 "snow-globe": {
  "title": "Bola de nieve",
  "trick": "Arrastra sobre ella para agitar los copos alrededor de una cabaña a la luz de la luna",
  "notes": [
   "Un globo de cristal lleno de agua sobre una base de nogal torneada, con una cabaña de troncos a la luz de la luna, abetos nevados, un muñeco de nieve y una farola; de vez en cuando se agita y la nieve gira y vuelve a posarse. Arrástralo de lado para agitarlo.",
   "La escena se traza con ray marching después de que cada rayo se desvía al entrar en el agua por el cristal, así que se ve ampliada y se curva en el borde; las ventanas proyectan charcos de luz trazados hacia atrás por sus huecos, y cada copo se coloca buscando el rayo de la vista que se refracta a través de él, de modo que se oculta tras la cabaña y los árboles."
  ]
 },
 "page-turn": {
  "title": "Paso de página",
  "trick": "Las hojas de un libro se vuelven solas; arrastra la de la derecha para probar",
  "notes": [
   "Un libro abierto pasa sus propias páginas: cada una se levanta por la esquina inferior, se curva sobre el lomo y cae. Arrastra la página derecha para pasarla tú.",
   "Cada fila de la página es una cadena de tramos cortos, un poco más inclinados hacia el borde, así que se curva sin estirarse; su sombra se proyecta sobre las páginas de debajo."
  ]
 },
 "type-ribbon": {
  "title": "Cinta tipográfica",
  "trick": "Palabras recorren una banda de Möbius que se retuerce; mueve para inclinar la vista",
  "notes": [
   "Una cinta de letras gruesas se retuerce en el espacio como una banda de Möbius, y las palabras la recorren sin fin, reflejadas en un suelo brillante.",
   "La cinta avanza por el camino sin girar sobre sí misma y recibe exactamente media vuelta por recorrido, así que el texto cubre las dos caras en dos vueltas. Prueba 3 o 5 medias vueltas."
  ]
 },
 "curl-flow": {
  "title": "Campo de flujo de ruido curl",
  "trick": "Miles de partículas siguen una corriente que nunca se enreda",
  "notes": [
   "Las partículas giran en corrientes suaves que dejan estelas tenues y nunca se acumulan.",
   "Cada partícula sigue el rotacional de un campo de ruido, que no tiene fuentes ni sumideros; un relleno translúcido en cada fotograma, en lugar de borrar, conserva las estelas."
  ]
 },
 "drone-show": {
  "title": "Espectáculo de drones",
  "trick": "Luces que vuelan de una figura a otra sin cruzarse nunca",
  "notes": [
   "Una flota de drones despega de una barcaza y dibuja formaciones sobre una ciudad nocturna, reflejada en la bahía.",
   "Las posiciones de cada formación se asignan a los drones ordenando por franjas; luego se prueban intercambios aleatorios y solo se conservan si acortan el vuelo total, así que ninguna trayectoria se cruza."
  ]
 },
 "particle-life": {
  "title": "Vida de partículas",
  "trick": "Motas que se persiguen y huyen hasta formar criaturas; arrastra para remover",
  "notes": [
   "Partículas de colores se autoorganizan en células, gusanos y enjambres cazadores que se deshacen y se vuelven a formar; arrastra para remover.",
   "Cada par de especies se atrae o se repele según una entrada de una pequeña tabla asimétrica, así que el rojo puede perseguir al verde mientras el verde huye; los vecinos se buscan en una cuadrícula."
  ]
 },
 "cloud-chamber": {
  "title": "Cámara de niebla",
  "trick": "La radiación invisible deja estelas de niebla que se curvan y se desvanecen",
  "notes": [
   "En una cámara brumosa aparecen trazas de gotas: cortos trazos rectos de partículas alfa, electrones en espiral y largas líneas de muones.",
   "Cada traza es una lista de gotas que crecen, se desplazan y se desvanecen; los electrones beta se dispersan y se enroscan en el campo magnético, cerrándose a medida que frenan."
  ]
 },
 "galaxy": {
  "title": "Galaxia espiral",
  "trick": "Brazos de estrellas giran despacio alrededor de un núcleo brillante",
  "notes": [
   "Una galaxia espiral gira despacio y sus brazos se enrollan mientras el núcleo brillante resplandece.",
   "Las estrellas se colocan en brazos de espiral logarítmica y se dispersan para que los brazos se lean como densidad; una curva de rotación plana los enrolla y los puntos aditivos hacen brillar el núcleo."
  ]
 },
 "strange-attractor": {
  "title": "Atractor extraño",
  "trick": "Estelas luminosas giran en torno a una forma de manzana sin repetirse",
  "notes": [
   "Miles de partículas luminosas recorren el atractor de Aizawa, una cáscara con forma de manzana y un eje central, mientras la cámara gira.",
   "Las partículas se integran en cada fotograma con las tres ecuaciones de Aizawa y se proyectan en 3D; atenuar ligeramente el canvas en vez de borrarlo deja las estelas."
  ]
 },
 "physarum": {
  "title": "Un moho mucilaginoso traza Tokio",
  "trick": "Una red se extiende entre ciudades y se afina en rutas como de tren",
  "notes": [
   "Un moho mucilaginoso tiende una red entre las ciudades que rodean Tokio y la va condensando en líneas troncales.",
   "Cada agente detecta el rastro delante a la izquierda, delante y delante a la derecha, gira hacia el más intenso y deposita más; el rastro se difunde y se desvanece, así que solo sobreviven las rutas usadas."
  ]
 },
 "lightning": {
  "title": "Arcos de rayos",
  "trick": "Rayos bifurcados chisporrotean desde tu puntero",
  "notes": [
   "Rayos ramificados caen, vuelven a caer en rápida sucesión y dejan una imagen residual luminosa.",
   "Desplazamiento del punto medio: el punto medio de cada segmento se empuja a un lado al azar y las mitades se vuelven a dividir, con bifurcaciones; un trazo ancho y difuminado bajo un núcleo blanco fino da el resplandor."
  ]
 },
 "iron-filings": {
  "title": "Limaduras de hierro",
  "trick": "Astillas de acero saltan en lazos alrededor de un imán oculto; arrástralo",
  "notes": [
   "Limaduras de acero sobre papel, encima de un imán de barra oculto, saltan con cada golpecito y se asientan en los clásicos lazos de polo a polo; arrastra el imán.",
   "Cada limadura se alinea con el campo local y es atraída hacia la curva de nivel más cercana de la función de flujo del imán: la suma de la carga de cada polo por el coseno de su ángulo respecto al eje de la barra."
  ]
 },
 "galton-board": {
  "title": "Tablero de Galton",
  "trick": "Bolitas rebotan entre clavos y se apilan en una campana",
  "notes": [
   "Las bolas caen entre clavos de latón y se apilan en una campana de Gauss que coincide con la línea teórica discontinua.",
   "Cada fila es más o menos un lanzamiento de moneda, así que las posiciones finales suman una binomial; las bolas son cuerpos reales que rebotan y se apilan mediante un hash espacial."
  ]
 },
 "pin-art": {
  "title": "Pin art",
  "trick": "Una mano y una cara surgen en relieve de acero; presiona para hundirlas",
  "notes": [
   "Una mano, una cara y una onda surgen en relieve entre agujas de acero; pulsa para empujarlas hacia atrás.",
   "Cilindros instanciados con cabeza abombada que solo se mueven hacia delante, así que las huellas permanecen hasta que un barrido las reinicia; una luz rasante hace que las agujas altas sombreen a las bajas."
  ]
 },
 "confetti": {
  "title": "Confeti de papel en 3D",
  "trick": "Dos cañones lanzan trocitos de colores que giran y caen revoloteando",
  "notes": [
   "El confeti de papel sale disparado de dos cañones, da vueltas y cae revoloteando.",
   "Escalar la altura de cada pieza por el coseno de su ángulo de giro simula la voltereta 3D, y el signo elige el color del anverso o del reverso; una fuerte resistencia del aire y el aleteo la hacen bajar."
  ]
 },
 "firefly-sync": {
  "title": "Luciérnagas sincronizadas",
  "trick": "Destellos al azar van cogiendo el mismo ritmo; mueve el puntero para asustarlos",
  "notes": [
   "Las luciérnagas de un bosque acaban destellando al unísono; el puntero asusta a las cercanas.",
   "Osciladores acoplados por pulsos de Mirollo–Strogatz: cada luciérnaga es un reloj que destella y se reinicia, y cada destello que ve adelanta un poco su reloj."
  ]
 },
 "gpu-particles": {
  "title": "Partículas en GPU (262k)",
  "trick": "Hilos luminosos de puntos fluyen y se enroscan en el espacio 3D",
  "notes": [
   "Un cuarto de millón de partículas fluyen por ruido curl en 3D formando filamentos luminosos.",
   "Las posiciones viven en una textura float que actualiza un fragment shader, alternando entre dos texturas (ping-pong); al dibujar, cada una se lee con texelFetch y se mezcla de forma aditiva."
  ]
 },
 "orbitals": {
  "title": "Orbitales del hidrógeno",
  "trick": "Una nube de puntos pasa de una forma de electrón a la siguiente",
  "notes": [
   "Una nube de puntos muestra un orbital del hidrógeno, que se agita mientras se transforma en el siguiente.",
   "Muestreo de Metropolis: cada punto propone un paso y lo acepta con probabilidad |ψ(new)|² ÷ |ψ(old)|²; ψ es la solución exacta, coloreada por su fase compleja."
  ]
 },
 "roche-limit": {
  "title": "Límite de Roche",
  "trick": "Una luna de escombros cae en espiral, se desgarra y se enrolla en un anillo",
  "notes": [
   "Una luna de escombros cae en espiral hacia un gigante helado, se desgarra en dos corrientes y se enrolla en un anillo.",
   "Veinte mil partículas sienten la autogravedad de la luna y la marea del planeta, que crece como 1/d³; los escombros interiores orbitan más rápido y cizallan las corrientes hasta formar un anillo."
  ]
 },
 "murmuration": {
  "title": "Murmuración de estorninos",
  "trick": "Una bandada se pliega y ondula cuando un halcón la atraviesa",
  "notes": [
   "Una bandada de estorninos se estira y se pliega, y ondas oscuras la recorren cuando se lanza un halcón.",
   "Boids que siguen a un número fijo de siete vecinos más cercanos en lugar de un radio, buscados con una cuadrícula hash; el miedo pasa de vecino en vecino y eso crea las ondas."
  ]
 },
 "states-of-matter": {
  "title": "Estados de la materia",
  "trick": "Los átomos se enfrían de gas a gotas y a cristal, y vuelven a fundirse",
  "notes": [
   "Los átomos se enfrían de gas a gotas, a un charco y a un cristal hexagonal, y luego vuelven a fundirse.",
   "Fuerzas de Lennard-Jones entre cada par, con un termostato que lleva las velocidades hacia una temperatura objetivo descendente; los átomos se colorean por velocidad y se dibujan enlaces entre vecinos cercanos."
  ]
 },
 "calligraphy": {
  "title": "Pincel de caligrafía",
  "trick": "Escribe 永 trazo a trazo, secándose en los trazos largos y encharcándose en los giros",
  "notes": [
   "Un pincel escribe 永 trazo a trazo, con vetas secas en los trazos largos y tinta acumulada en los giros.",
   "El pincel son cuarenta cerdas en una huella en forma de lágrima que gira con el trazo y se abre con la presión; cada una lleva su propia tinta y se va secando."
  ]
 },
 "harmonograph": {
  "title": "Armonógrafo",
  "trick": "Una pluma oscilante dibuja un rosetón que se cierra al frenar",
  "notes": [
   "Una pluma dibuja un rosetón que avanza despacio y se adelgaza a medida que el péndulo se detiene.",
   "La posición de la pluma es la suma de cuatro senos amortiguados con frecuencias cercanas a una razón simple como 2:3; la ligera desafinación hace que los bucles precesen."
  ]
 },
 "chladni": {
  "title": "Placa de Chladni",
  "trick": "El latón que vibra ordena la arena en nuevas figuras a medida que sube el tono",
  "notes": [
   "La arena sobre una placa de latón vibrante forma figuras que cambian a medida que sube el tono.",
   "Cada grano salta según lo fuerte que vibra su punto y se desliza hacia las líneas nodales de la onda estacionaria; 65.000 granos viven en una textura float en la GPU."
  ]
 },
 "dla-crystal": {
  "title": "Crecimiento de cristal (DLA)",
  "trick": "Ramas negras como helechos avanzan por la piedra desde una grieta",
  "notes": [
   "Dendritas de manganeso negras, como helechos, trepan por una losa de caliza clara desde una grieta y se ramifican en penachos con un halo marrón.",
   "Agregación limitada por difusión: los caminantes aleatorios se pegan al primer contacto, así que las puntas crecen más que los huecos; los troncos densos se imprimen gruesos y las puntas lejanas, más finas y pardas."
  ]
 },
 "wind-tunnel": {
  "title": "Túnel de viento",
  "trick": "El humo se enrosca en remolinos tras una forma; arrástrala para moverla",
  "notes": [
   "Líneas de humo pasan junto a un cilindro, un ala o una placa y se enrollan en una calle de vórtices; arrastra el objeto.",
   "Un solver de Boltzmann en retícula D2Q9: nueve poblaciones por celda se propagan y se relajan hacia el equilibrio; la advección de MacCormack mantiene nítidos los rizos de humo."
  ]
 },
 "fireworks": {
  "title": "Fuegos artificiales",
  "trick": "Cinco tipos de carcasa estallan en el cielo; toca para lanzar la tuya",
  "notes": [
   "Los cohetes estallan en peonías, sauces, crossettes, carcasas bicolores y purpurina; haz clic para lanzar uno allí.",
   "Cada estrella tiene velocidad, gravedad y resistencia, con un conjunto de reglas por tipo de carcasa; las estrellas guardan sus últimas posiciones, dibujadas como estelas aditivas que se afinan."
  ]
 },
 "bokeh": {
  "title": "Bokeh",
  "trick": "Luces desenfocadas flotan mientras el foco las recorre despacio",
  "notes": [
   "Luces desenfocadas flotan en capas mientras el enfoque se desplaza, nitidizando unas y difuminando otras.",
   "Cada luz se convierte en un disco con la forma del diafragma, cuyo tamaño depende de su distancia al plano de enfoque, con el brillo repartido por su área; un único sprite con borde, mezclado de forma aditiva."
  ]
 },
 "nebula": {
  "title": "Nebulosa",
  "trick": "Gas luminoso gira alrededor de una estrella, cortado por polvo oscuro",
  "notes": [
   "Gas magenta y turquesa flota alrededor de una estrella brillante, cortado por oscuras bandas de polvo, sobre estrellas que centellean.",
   "Ruido fractal con domain warping pliega el gas en filamentos; restar una muestra de densidad tomada en dirección a la estrella ilumina las caras que la miran."
  ]
 },
 "ink-fluid": {
  "title": "Fluido de tinta",
  "trick": "Muévete por el agua para empujar tinte luminoso en remolinos",
  "notes": [
   "La tinta gira y se extiende cuando la empujas, y también salpica por sí sola.",
   "Un solver de Navier–Stokes en GPU: la velocidad transporta el tinte, el confinamiento de vorticidad mantiene vivos los remolinos y una resolución de presión mantiene el flujo incompresible."
  ]
 },
 "liquid-distort": {
  "title": "Distorsión líquida de imagen",
  "trick": "Una foto ondula como el agua; pasa por encima para agitarla más",
  "notes": [
   "Una imagen ondula como el agua, con más fuerza donde el puntero la atraviesa.",
   "Cada píxel lee la textura en un punto desplazado por ruido animado, y el desplazamiento crece cerca del puntero."
  ]
 },
 "lava-lamp": {
  "title": "Lámpara de lava",
  "trick": "La cera caliente se estira desde el fondo, sube, se enfría y vuelve a bajar",
  "notes": [
   "Una lámpara de lava de cromo y cristal brilla en una habitación en penumbra: la cera se hincha sobre la bombilla, se estira en un cuello hasta soltarse del fondo, sube despacio, se enfría arriba y vuelve a bajar, fundiéndose y separándose.",
   "Todo se dibuja con raymarching en un solo shader: la cera son metaballs 3D unidas con un mínimo suave y el calor de cada burbuja fija su flotación; la luz se refracta en el cristal y la cera brilla donde es fina."
  ]
 },
 "fire-smoke": {
  "title": "Fuego y humo",
  "trick": "Las llamas lamen troncos apilados y las chispas suben en la noche",
  "notes": [
   "Una fogata de noche ardiendo sobre troncos apilados: las llamas lamen la madera y las brasas, la corteza carbonizada brilla naranja en sus grietas y suben humo y chispas.",
   "El gas de la madera caliente arde a ritmo fijo, así que las puntas de la llama marcan dónde se agota; todo lo caliente brilla según la ley de Planck, y el carbón son bloques de Voronoi iluminados por el fuego."
  ]
 },
 "lava-flow": {
  "title": "Colada de lava",
  "trick": "Roca fundida brota de un cráter y baja por los barrancos",
  "notes": [
   "Un volcán al anochecer: la lava al rojo vivo brota del cráter y baja por los barrancos en canales incandescentes, con balsas oscuras de costra a la deriva, y su luz tiñe las laderas y la columna.",
   "Una simulación de espesor y calor corre sobre la montaña trazada por rayos; el cráter da pulsos, las placas de costra cuajan cada una a su edad y viajan con el flujo, y el color sigue la ley de Planck."
  ]
 },
 "ferrofluid": {
  "title": "Ferrofluido",
  "trick": "Un aceite negro se eriza sobre un imán; muévelo o toca para apagarlo",
  "notes": [
   "Un aceite magnético negro y brillante forma un charco sobre una mesa de estudio y trepa por un imán cuadrado que está dentro, rompiéndose en una corona de agujas afiladas unidas por valles suaves, más altas e inclinadas hacia fuera en bordes y esquinas; mueve el puntero para deslizar el imán por el charco (arrastra el aceite) y haz clic o toca para apagarlo y ver cómo las agujas se funden y el aceite resbala.",
   "Campo de distancias con raymarching: el charco unido suavemente con una película sobre el bloque y conos cóncavos en una red hexagonal girada y desplazada al azar (cada muestra visita su punto más cercano y sus seis vecinos, buscados deshaciendo la inclinación), sombreado solo con reflejos de estudio; el charco refleja la corona."
  ]
 },
 "marbling": {
  "title": "Papel marmolado",
  "trick": "Bandas de pintura se arremolinan tras el punzón al pasar por encima",
  "notes": [
   "Bandas de pintura se peinan y arremolinan como en el papel marmolado; el puntero arrastra el punzón.",
   "Cada píxel recorre hacia atrás las ondas del peine y el remolino del punzón para encontrar su banda de pintura, así que la búsqueda inversa nunca emborrona."
  ]
 },
 "raindrops-glass": {
  "title": "Lluvia en el cristal",
  "trick": "Gotas resbalan por una ventana y cada una muestra la ciudad al revés",
  "notes": [
   "Las gotas de lluvia se forman y resbalan por una ventana sobre una ciudad desenfocada, cada una con una copia nítida e invertida.",
   "Cada gota muestrea la escena nítida invertida y reducida, como una lente diminuta; las gotas pesadas resbalan a tirones, absorben las pequeñas y dejan rastro."
  ]
 },
 "dripping-text": {
  "title": "Texto que gotea",
  "trick": "La pintura gotea de las letras, se estira y se suelta",
  "notes": [
   "Las gotas se hinchan bajo las letras, se estiran, se desprenden y se acumulan en un charco.",
   "Las gotas nacen en los bordes inferiores del texto; un desenfoque seguido de un umbral de alfa duro funde gota y letra en un único contorno líquido."
  ]
 },
 "mercury": {
  "title": "Mercurio líquido",
  "trick": "Bolitas de plata ruedan y se funden; pasa rápido para separarlas",
  "notes": [
   "Gotas de mercurio ruedan, se unen al tocarse y se separan si las atraviesas deprisa.",
   "Las gotas se suman en un único campo de metaballs que el shader convierte en altura y normal; la normal refleja un estudio, y al unirse se conservan el área y el momento."
  ]
 },
 "billow-clouds": {
  "title": "Nubes de Kelvin–Helmholtz",
  "trick": "Un cielo de atardecer se enrolla en una fila de olas que rompen",
  "notes": [
   "Al atardecer, una capa de nubes se enrolla en una fila de olas que rompen y luego se disuelve en turbulencia.",
   "Un fluido en GPU con cizalla, flotabilidad, confinamiento de vorticidad y resolución de presión genera ondas de Kelvin–Helmholtz; el tinte se ilumina con una marcha hacia el sol."
  ]
 },
 "paint-swirl": {
  "title": "Remolino de pintura",
  "trick": "Anillos de color se enroscan en espirales; traza círculos encima para remover",
  "notes": [
   "Anillos de pintura brotan de dos caños y se enrollan en espirales nítidas; traza círculos con el puntero para remover.",
   "Advección semilagrangiana a través de vórtices de Lamb–Oseen con muestreo Catmull-Rom acotado; acercar cada píxel al color de pintura más próximo mantiene nítidas las bandas."
  ]
 },
 "sph-water": {
  "title": "Tanque de agua SPH",
  "trick": "Olas van de un lado a otro en una caja de cristal que se mece; mueve para inclinarla",
  "notes": [
   "Un pesado tanque de cristal se inclina despacio a un lado y a otro, y el agua rueda de extremo a extremo en olas largas y graduales que proyectan cáusticas; el puntero lo inclina.",
   "SPH con doble relajación de densidad; las partículas se vuelcan en un campo de coma flotante y cada píxel lo recorre en perspectiva: absorción, menisco, superficie de Fresnel y cáusticas."
  ]
 },
 "portal": {
  "title": "Portal",
  "trick": "Una puerta en el desierto se abre a un mar nocturno; se cruza y se vuelve",
  "notes": [
   "Una puerta de piedra tallada en un desierto dorado se abre a un mar nocturno bajo un planeta con anillos; la cámara la cruza y vuelve.",
   "Los rayos recorren el desierto mediante raymarching; el que cruza la abertura sigue en el otro mundo, así que el paralaje es real."
  ]
 },
 "glass-lens": {
  "title": "Refracción en lente de cristal",
  "trick": "Mueve el puntero para pasar una lupa de bordes irisados por la escena",
  "notes": [
   "Una lente de cristal sigue al puntero y curva la escena con un borde de color en su contorno.",
   "Cada píxel muestrea la escena desplazada por la normal de la superficie de la lente, con el rojo, el verde y el azul desplazados un poco distinto para la dispersión."
  ]
 },
 "dust-bust": {
  "title": "Polvo al viento",
  "trick": "Un busto de mármol se deshace y sale volando, luego se recompone",
  "notes": [
   "Un busto de mármol se deshace en polvo que se lleva el viento y luego se recompone sobre su peana.",
   "El busto es un SDF de formas unidas con smooth-min; la GPU muestrea 150.000 puntos de superficie lanzando rayos repartidos uniformemente, y cada uno guarda su normal y su oclusión."
  ]
 },
 "cloth-reveal": {
  "title": "Revelado con tela",
  "trick": "Una seda roja cae sobre una estrella oculta y luego se desliza",
  "notes": [
   "Una seda roja cae flotando sobre un pedestal y se apoya en puntas ocultas; luego se tira de una esquina y aparece una estrella cromada.",
   "Puntos Verlet con restricciones de estiramiento, cizalla y flexión chocan con la estrella como doce conos; la seda se dibuja como una superficie B-spline suave."
  ]
 },
 "liquid-metal": {
  "title": "Metal líquido",
  "trick": "Una gota de cromo sale del baño, se suelta y vuelve a caer salpicando",
  "notes": [
   "Una gota cromada surge de un charco ondulante, se estrecha, se suelta y vuelve a caer formando anillos.",
   "Un mínimo suave une un charco de campo de alturas y una esfera que se bambolea; dos rebotes de reflexión permiten que cada uno refleje al otro, y una luz anular crea las bandas de cebra."
  ]
 },
 "mandelbulb": {
  "title": "Fractal Mandelbulb",
  "trick": "Una forma 3D llena de bultos respira despacio y cambia sus grietas",
  "notes": [
   "Un fractal Mandelbulb respira despacio y reorganiza sus grietas.",
   "Raymarching con una estimación de distancia a partir de la velocidad de escape de la órbita; el número de pasos hace de oclusión ambiental y una trampa de órbita elige el color."
  ]
 },
 "infinite-tunnel": {
  "title": "Túnel infinito",
  "trick": "Avanza sin fin por un tubo curvo iluminado por pulsos veloces",
  "notes": [
   "La cámara vuela sin fin por un túnel curvo de paneles biselados recorrido por pulsos de luz.",
   "El SDF del túnel es la distancia más allá de 1.5 unidades desde un camino curvo; los paneles salen del ángulo alrededor de él y de la profundidad a lo largo, alternados fila sí, fila no."
  ]
 },
 "glass-prism": {
  "title": "Prisma de cristal",
  "trick": "Al girar, cada franja que hay detrás se abre en un arcoíris",
  "notes": [
   "Un prisma de cristal giratorio descompone un estudio a rayas en franjas de arcoíris y proyecta un abanico de color.",
   "Los rayos se refractan al entrar, se reflejan totalmente pasado el ángulo crítico y se refractan al salir, con un índice ligeramente distinto por canal de color; Fresnel añade reflejos rasantes."
  ]
 },
 "point-globe": {
  "title": "Globo de puntos con arcos",
  "trick": "Rutas de vuelo saltan entre continentes; arrastra para girar el mundo",
  "notes": [
   "Un globo de puntos gira con arcos que saltan entre puntos de tierra; arrastra para girarlo.",
   "Puntos en espiral de ángulo áureo con ruido 3D para la tierra, rotados y divididos en perspectiva a mano en un canvas 2D; los arcos siguen círculos máximos."
  ]
 },
 "extruded-type": {
  "title": "Tipografía extruida en 3D",
  "trick": "Una palabra maciza gira bajo un brillo cromado; mueve el puntero para guiarla",
  "notes": [
   "Una palabra sólida en 3D gira con un barrido cromado sobre su cara; el puntero la dirige.",
   "La máscara de la palabra se estampa decenas de veces de atrás adelante, cada una desplazada por la misma rotación; un plano ortográfico es solo una transformación afín 2D."
  ]
 },
 "holo-card": {
  "title": "Tarjeta holográfica",
  "trick": "Se inclina hacia tu puntero mientras la lámina irisada y el reflejo se deslizan",
  "notes": [
   "Una tarjeta holográfica se inclina hacia el puntero, y su foil de arcoíris y su brillo se deslizan con ella.",
   "rotateX y rotateY de CSS 3D bajo perspectiva, movidos por un muelle; una capa de foil mezclada con color-dodge a través de una fina máscara diagonal se lee como holográfica."
  ]
 },
 "torus-knot": {
  "title": "Nudo tórico iridiscente",
  "trick": "Un tubo de color cambiante se enlaza consigo mismo mientras fluyen rayas",
  "notes": [
   "Un tubo iridiscente se retuerce en un nudo tórico con rayas que fluyen a lo largo.",
   "Un círculo barrido a lo largo de un nudo tórico (p, q), orientado por transporte paralelo para que nunca se voltee, con la torsión sobrante repartida por igual para cerrar la costura."
  ]
 },
 "jelly-cube": {
  "title": "Cubo de gelatina",
  "trick": "Arrástralo y lánzalo para verlo temblar; tócalo para que salte",
  "notes": [
   "Un cubo de gelatina aterriza, se aplasta y tiembla; agárralo y lánzalo, o tócalo para que salte.",
   "Una retícula de masas y muelles de 4×4×4 deforma un cubo suave mediante deformación libre de Bézier tricúbica; una pasada de profundidad trasera da el grosor para la absorción de color."
  ]
 },
 "neon-geodesic": {
  "title": "Esfera geodésica de neón",
  "trick": "Pulsos de luz corren por las aristas de una bola de alambre que gira",
  "notes": [
   "Una esfera geodésica de neón gira sobre un suelo brillante mientras unos pulsos recorren sus varillas.",
   "Un icosaedro subdividido con varillas en cuatro franjas de profundidad; el resplandor es el mismo dibujo reducido a un cuarto y a un doceavo y vuelto a ampliar."
  ]
 },
 "path-spheres": {
  "title": "Esferas sobre un nudo",
  "trick": "Bolas brillantes recorren un lazo y se reflejan entre sí",
  "notes": [
   "Bolas cromadas y de colores se deslizan por un nudo de trébol, reflejándose entre sí y en el suelo.",
   "Intersección analítica rayo–esfera y rayo–plano con hasta tres rebotes, sin raymarching; las sombras suaves salen de lo cerca que el rayo de sombra pasa de cada bola."
  ]
 },
 "sdf-morph": {
  "title": "Metamorfosis de formas SDF",
  "trick": "El cromo se funde de esfera a cubo y a anillo, retorciéndose",
  "notes": [
   "Un objeto cromado se transforma de esfera en cubo, toro, octaedro y una esfera tallada con un giroide.",
   "Dos funciones de distancia con signo se mezclan en una proporción suavizada mientras el espacio se retuerce alrededor del eje vertical, con la torsión máxima a mitad de camino."
  ]
 },
 "paper-fold": {
  "title": "Pliegue de papel",
  "trick": "Una hoja impresa se pliega y se abre de cuatro maneras distintas",
  "notes": [
   "Una hoja impresa se pliega y se abre sobre la mesa: como carta, en ventana, en acordeón o como un mapa.",
   "Cada pliegue es una bisagra preserve-3d anidada, así que el último arrastra al resto; las solapas sueltas son cadenas de tiras que se curvan al girar, y cada pliegue sigue la trayectoria de mínimo tirón de una mano."
  ]
 },
 "menger-sponge": {
  "title": "Esponja de Menger",
  "trick": "Un cubo de latón lleno de agujeros cada vez menores gira a la luz",
  "notes": [
   "Una esponja de Menger de latón gira en un estudio, con túneles que se oscurecen hacia dentro.",
   "Un solo SDF de caja y un bucle corto: plegar el espacio en celdas con mod y restar una cruz tres veces más fina en cada nivel; la profundidad da oclusión ambiental gratis."
  ]
 },
 "gyroid": {
  "title": "Vuelo por un giroide",
  "trick": "Deslízate entre paredes curvas sin fin que cambian de color en la niebla",
  "notes": [
   "La cámara vuela entre infinitos muros de un laberinto orgánico que cambian de tono y se pierden en la niebla.",
   "Los muros son el valor absoluto del giroide menos un grosor, al que se resta un tubo a lo largo de la trayectoria; el raymarcher avanza al 70 % porque la distancia no es exacta."
  ]
 },
 "black-hole": {
  "title": "Agujero negro",
  "trick": "Un disco brillante se arquea por encima y por debajo de la sombra, como en Interstellar",
  "notes": [
   "Gargantua como la dibujó la película: un disco blanco y fino que se arquea sobre y bajo la sombra, un anillo de fotones finísimo y estrellas estiradas en el borde.",
   "Cada rayo sigue la ecuación de la órbita de la luz, u″ + u = 3Mu², y lee el disco en cada cruce; el giro desplaza la sombra."
  ]
 },
 "tesseract": {
  "title": "Teseracto",
  "trick": "Un cubo de cuatro dimensiones gira y parece volverse del revés",
  "notes": [
   "Un cubo cromado de cuatro dimensiones se vuelve del revés mientras gira.",
   "Dieciséis vértices de ±1 giran en planos que incluyen w, y luego una división de perspectiva en w los proyecta a 3D, así que el cubo interior engulle al exterior."
  ]
 },
 "soap-bubble": {
  "title": "Pompa de jabón",
  "trick": "Tiembla en el aire mientras colores irisados giran sobre su piel",
  "notes": [
   "Una pompa de jabón flota y se bambolea mientras colores de arcoíris fluyen en remolinos por su superficie.",
   "Interferencia de película delgada según el grosor, el ángulo y la longitud de onda; el grosor escurre por la gravedad y lo remueve un ruido, con reflejos de Fresnel en ambas paredes."
  ]
 },
 "terrain-flyover": {
  "title": "Vuelo sobre el terreno",
  "trick": "Vuela por un fiordo entre picos nevados reflejados en agua en calma",
  "notes": [
   "Un vuelo de dron por un fiordo: bosque en las orillas, paredes de roca surcadas de barrancos, nieve en las cumbres y las montañas reflejadas en el agua en calma. La altura del sol va del anochecer al mediodía.",
   "El terreno se construye una vez al empezar: montañas amplias, un valle excavado a lo largo de la ruta de vuelo y barrancos que bajan por la pendiente, con las sombras suaves del sol y cuánto cielo ve cada punto. La dispersión del aire da al cielo su color y a las crestas lejanas su bruma azul, y los fotogramas, dibujados más pequeños, se mezclan en el tiempo para dar bordes limpios."
  ]
 },
 "volumetric-clouds": {
  "title": "Nubes volumétricas",
  "trick": "Atraviesa un cielo soleado de vientres oscuros y bordes brillantes",
  "notes": [
   "La cámara se desliza entre nubes iluminadas por el sol, con bases oscuras, cimas brillantes y bordes finos que resplandecen.",
   "Un rayo recorre una capa de densidad de ruido con la ley de Beer, y una segunda marcha corta hacia el sol en cada paso produce la autosombra."
  ]
 },
 "gem": {
  "title": "Diamante talla brillante",
  "trick": "Gira bajo tiras de luz, lanzando destellos blancos y fuego de colores",
  "notes": [
   "Un diamante de talla brillante gira bajo luces de tira, lanzando destellos blancos y fuego de colores.",
   "La piedra es la intersección de 49 semiespacios; los rayos rebotan por reflexión interna total, con un índice de refracción ligeramente distinto por canal de color."
  ]
 },
 "klein-bottle": {
  "title": "Botella de Klein",
  "trick": "Una forma transparente cuyo cuello atraviesa su propia pared",
  "notes": [
   "Una botella de Klein holográfica gira y su cuello atraviesa su propia pared.",
   "Una malla paramétrica dibujada de forma aditiva con caras tenues, bordes brillantes y líneas de cuadrícula suavizadas con fwidth, así que no hace falta ordenar por profundidad."
  ]
 },
 "inflated-type": {
  "title": "Tipografía inflada",
  "trick": "Una palabra se hincha como un globo de foil, rebota y se desinfla",
  "notes": [
   "Una palabra se infla como un globo metalizado con un rebote elástico y luego se desinfla.",
   "Una transformada de distancia de las letras siembra una membrana a presión cuya raíz cuadrada da una altura redondeada, con raymarching y color de película delgada según el ángulo."
  ]
 },
 "melting-logo": {
  "title": "Logotipo cromado que se derrite",
  "trick": "Las letras se derriten en un charco y luego vuelven a formar la palabra",
  "notes": [
   "Letras cromadas se desploman en un charco y luego vuelven a formar la palabra con un rebote.",
   "Un campo de distancia 2D de la palabra se extruye y se renderiza con raymarching; para derretirlo se lee el campo desde más arriba y se mezcla con una copia difuminada, con goteos bajo los salientes."
  ]
 },
 "dna-helix": {
  "title": "Doble hélice de ADN",
  "trick": "Gira mientras sus dos hebras se separan y se vuelven a cerrar",
  "notes": [
   "Una doble hélice de ADN gira mientras una horquilla de replicación la abre y la vuelve a cerrar.",
   "Los puntos en 3D se rotan, se proyectan y se dibujan de atrás adelante como sprites de esferas presombreadas; la segunda columna queda 140° por detrás y forma los surcos."
  ]
 },
 "fractal-tree": {
  "title": "Árbol fractal en 3D",
  "trick": "Crece rama a rama, se mece con el viento y suelta pétalos",
  "notes": [
   "Un árbol en 3D crece nivel a nivel, se mece con el viento y suelta pétalos.",
   "Cada rama se divide en tres más cortas giradas según el ángulo áureo e inclinadas hacia fuera, así que la copa se llena de forma uniforme; las ramas se dibujan de lejos a cerca."
  ]
 },
 "shatter": {
  "title": "Estallido y rebobinado",
  "trick": "Una bola rompe un cristal a cámara lenta y luego el tiempo retrocede",
  "notes": [
   "Una bola de acero atraviesa un cristal dicroico ante un anillo de luz; las esquirlas se abren a cámara lenta, quedan suspendidas y se rebobinan hasta encajar enteras.",
   "Semillas en anillos y sectores dan grietas de telaraña; cada esquirla biselada sigue una trayectoria balística exacta, así que rebobinar es preciso; una capa de película fina cambia de color con el ángulo."
  ]
 },
 "crt-monitor": {
  "title": "Monitor CRT",
  "trick": "Una pantalla antigua se calienta, juega a Breakout y se encoge hasta un punto",
  "notes": [
   "Un viejo CRT se enciende, arranca, juega solo a Breakout y se apaga en un punto.",
   "Un canvas de 320×240 con persistencia de fósforo alimenta una pasada de tubo que curva el cristal, dibuja líneas de haz cuyo ancho depende del brillo y franjas RGB filtradas por caja."
  ]
 },
 "cmyk-halftone": {
  "title": "Semitono CMYK",
  "trick": "Colores en movimiento se imprimen con puntos; pasa por encima para engordarlos",
  "notes": [
   "Esferas de color a la deriva se imprimen como tramas de semitono giradas que forman rosetas; el cursor hace florecer los puntos.",
   "Cada separación es una cuadrícula en su ángulo clásico; cada píxel encuentra su celda, muestrea en el centro y dibuja un punto del tamaño de la cobertura de tinta."
  ]
 },
 "reaction-diffusion": {
  "title": "Reacción–difusión",
  "trick": "Patrones como de coral se extienden; pasa por encima para sembrar más",
  "notes": [
   "Manchas, rayas y patrones de coral crecen y se desplazan por la superficie.",
   "Una reacción–difusión al estilo Gray-Scott en la GPU, con varios pasos por fotograma; dos sustancias se difunden a distinta velocidad y las tasas de alimentación y eliminación definen el patrón."
  ]
 },
 "guilloche": {
  "title": "Espirógrafo guilloché",
  "trick": "Finas líneas en bucle forman rosetones como el grabado de un billete",
  "notes": [
   "Rosetones grabados al estilo de los billetes, hechos de finas líneas en bucle.",
   "Hipotrocoides, un punto de un círculo pequeño que rueda dentro de uno grande y que se cierran con razones enteras; siete copias ligeramente desplazadas dan el aspecto de grabado."
  ]
 },
 "rgb-glitch": {
  "title": "Glitch de canales RGB",
  "trick": "Una imagen se rompe en copias de color mientras saltan franjas a ráfagas",
  "notes": [
   "Una imagen se separa en sus canales de color mientras unas franjas saltan de lado en ráfagas aleatorias.",
   "Cada canal de color se dibuja por separado con mezcla aditiva y desplazado; durante ráfagas imprevisibles, franjas horizontales se desplazan y las líneas de barrido tiemblan."
  ]
 },
 "domain-warp": {
  "title": "Mármol con domain warping",
  "trick": "Vetas de color humeantes se pliegan unas en otras sin parar",
  "notes": [
   "Filamentos marmolados y humeantes se pliegan y fluyen sin fin.",
   "Domain warping: ruido leído en un punto empujado por ruido leído en otro punto empujado; los vectores de desplazamiento intermedios eligen los colores, así que el tinte sigue los pliegues."
  ]
 },
 "truchet": {
  "title": "Flujo de Truchet",
  "trick": "Guiones recorren caminos sinuosos que cambian cuando gira una baldosa",
  "notes": [
   "Trazos discontinuos fluyen por caminos sinuosos que cambian de ruta cuando alguna loseta gira.",
   "Losetas de Truchet de dos arcos de cuarto de círculo en orientaciones aleatorias; invertir el sentido del flujo en damero mantiene los trazos continuos entre losetas."
  ]
 },
 "kaleidoscope": {
  "title": "Caleidoscopio",
  "trick": "Trocitos de vidrio caen en porciones espejadas alrededor de un centro que gira",
  "notes": [
   "Un caleidoscopio de trocitos de cristal gira despacio con una fuga de luz cálida.",
   "Coordenadas polares con el ángulo envuelto en una cuña y reflejado en sus bordes; la cuña contiene celdas de Voronoi en movimiento, con escala por canal para las franjas de color."
  ]
 },
 "dither": {
  "title": "Tramado ordenado",
  "trick": "Una pequeña escena 3D dibujada con dos tintas que se leen como un gris suave",
  "notes": [
   "Una pequeña escena 3D renderizada en dos tonos de tinta gruesos que se leen como un gris suave.",
   "El brillo de cada píxel se compara con un umbral de una matriz Bayer de 8×8; renderizar a baja resolución y ampliar sin suavizado mantiene nítida la cuadrícula."
  ]
 },
 "pen-sketch": {
  "title": "Boceto a pluma",
  "trick": "Figuras de yeso giran sobre una peana, dibujadas con tinta y una trama temblorosa",
  "notes": [
   "Sólidos de yeso sobre un plato giratorio dibujados con tinta negroazulada temblorosa y tramas que se densifican en la sombra.",
   "Una pasada de G-buffer guarda luz, profundidad y normal; la pasada de pluma dibuja contornos en los saltos y superpone direcciones de trama según la oscuridad, redibujando cada dos fotogramas."
  ]
 },
 "ascii-render": {
  "title": "Render ASCII",
  "trick": "Una esponja 3D que gira, dibujada solo con caracteres ámbar",
  "notes": [
   "Una esponja de Menger gira sobre un suelo, dibujada solo con caracteres ámbar.",
   "Raymarching por celda de carácter; las celdas de borde eligen - / | \\ a partir de un tensor de estructura de Sobel, y las demás eligen glifos de una rampa de brillo en un atlas predibujado."
  ]
 },
 "pixel-sort": {
  "title": "Ordenación de píxeles",
  "trick": "El cielo brillante de un atardecer cae en chorros y luego se retira",
  "notes": [
   "Una puesta de sol tormentosa se derrite mientras el cielo brillante cae en vetas ordenadas y luego se escurre.",
   "Los tramos de píxeles por encima del umbral en cada columna se ordenan por brillo con transposición par-impar, diez pasadas por fotograma, para que la ordenación se vea."
  ]
 },
 "hyperbolic-tiling": {
  "title": "Teselado hiperbólico",
  "trick": "Estrellas entrelazadas se encogen sin fin hacia el borde, como en Escher",
  "notes": [
   "Un patrón de estrellas entrelazadas de losetas heptagonales fluye sin fin hacia el borde de un disco de Poincaré.",
   "Cada píxel se pliega en un triángulo fundamental mediante rotaciones, simetrías e inversiones circulares; el número de reflexiones decide qué pasa por encima y qué por debajo en los cruces."
  ]
 },
 "op-art-moire": {
  "title": "Moiré op-art",
  "trick": "Anillos finos se superponen en franjas que barren; mueve para desplazar un juego",
  "notes": [
   "Dos series de anillos finos se superponen en amplias franjas de moiré; el puntero mueve uno de los centros.",
   "Cada serie de anillos es una banda al 50 % de la distancia, suavizada con fwidth; el producto de ambas, con un contraste duro, da coincidencias brillantes y entrelazados oscuros."
  ]
 },
 "bauhaus": {
  "title": "Composición Bauhaus",
  "trick": "Un cartel de baldosas en colores primarios se reordena sin parar en oleadas",
  "notes": [
   "Un cartel Bauhaus de losetas de colores en el que un tercio de las figuras cambia en una onda.",
   "Cada cambio es un cuarto de vuelta, un encoger y crecer o un barrido del fondo, con inicios escalonados cada 70 ms; cinco colores mantienen cada fotograma en la retícula."
  ]
 },
 "memphis": {
  "title": "Patrón Memphis",
  "trick": "Garabatos y zigzags ochenteros flotan; mueve el puntero para desplazar las capas",
  "notes": [
   "Garabatos, zigzags y puntos Memphis flotan sobre un fondo oscuro; el puntero desplaza tres capas de profundidad.",
   "Las formas se reparten una por celda de una cuadrícula con jitter para que nunca se agrupen, y las posiciones se repiten con módulo sobre un tramo más ancho que el escenario."
  ]
 },
 "phyllotaxis": {
  "title": "Filotaxis",
  "trick": "Las semillas llenan un girasol; mueve de lado a lado para cambiar el ángulo",
  "notes": [
   "Las semillas crecen hacia fuera en una cabeza de girasol mientras el ángulo oscila en torno a 137.508°, abriendo radios. De izquierda a derecha, el ángulo pasa de 130.5° a 144.5° y se engancha en 137.508°.",
   "La semilla j se sitúa en el ángulo j·α y el radio c·√(edad), con un área constante por semilla; colorear por índice mod 21 resalta cada brazo de la espiral."
  ]
 },
 "rose-curve": {
  "title": "Curva rosa",
  "trick": "Una pluma luminosa dibuja pétalos; mueve el puntero para elegir la siguiente forma",
  "notes": [
   "Una pluma luminosa traza una rosa polar, la mantiene y se transforma en la siguiente. El puntero elige la razón n/d: en horizontal n, en vertical d.",
   "Con k = n/d la curva se cierra tras d·π vueltas si n·d es impar y tras 2d·π en caso contrario; tres trazos de un mismo trazado con mezcla lighter dan el resplandor."
  ]
 },
 "superformula": {
  "title": "Superfórmula",
  "trick": "Un contorno pasa de estrellas a flores; mueve el puntero para cambiarlo",
  "notes": [
   "Una estrella se transforma en cuadrado, engranaje, triángulo y flor, dejando ecos anidados que se desvanecen. El puntero ajusta la simetría y la nitidez, de estrella puntiaguda a flor redonda.",
   "La superfórmula de Gielis muestreada en 720 ángulos y normalizada; la transformación se suaviza radio a radio, y cada eco es un fotograma anterior dibujado algo más pequeño."
  ]
 },
 "hex-wave": {
  "title": "Onda hexagonal",
  "trick": "Columnas de panal se elevan en anillos; toca o mueve para añadir más",
  "notes": [
   "Anillos de prismas hexagonales elevados y luminosos se extienden sobre un oleaje lento; haz clic o mueve el puntero para soltar anillos.",
   "Cada celda suma protuberancias gaussianas de anillo según su distancia, pasadas por tanh para fijar la elevación y el color; pintar las filas de arriba abajo resuelve la oclusión."
  ]
 },
 "wave-lines": {
  "title": "Líneas de onda",
  "trick": "Finos trazos apilados ruedan en crestas; mueve el puntero para alzar un pico",
  "notes": [
   "Una pila de líneas finas se eleva en crestas que viajan en diagonal hacia abajo y vuelven a aplanarse. El puntero pellizca las líneas hacia arriba en un pico luminoso.",
   "Cada línea suma armónicos senoidales cuya fase avanza por línea a distintas velocidades; rellenar por debajo de cada línea antes de trazarla oculta las crestas de detrás."
  ]
 },
 "starburst": {
  "title": "Estallido de rayos",
  "trick": "Rayos giran y salen hacia fuera; mueve para cruzar un segundo abanico",
  "notes": [
   "Un sol de rayos gira, parpadea y fluye hacia fuera entre bandas de color. El puntero mueve un segundo abanico, y los dos se cruzan en arcos de moiré.",
   "Dos abanicos de cuñas en contrarrotación y anillos con espaciado logarítmico combinados con mezcla difference; el espaciado de razón constante convierte el movimiento hacia fuera en un zoom infinito."
  ]
 },
 "spiral": {
  "title": "Espiral logarítmica",
  "trick": "Brazos fluyen sin fin hacia el centro y brotan de tu puntero",
  "notes": [
   "Espirales doradas y azules tejen una retícula de rombos que fluye sin fin hacia un centro luminoso. El puntero es un segundo polo del que brotan las espirales.",
   "En el espacio log-polar una espiral logarítmica es una recta, así que cada familia es una banda de N·θ + k·log r, dibujada como líneas finas con fwidth."
  ]
 },
 "tartan": {
  "title": "Tartán tejido",
  "trick": "Una tela escocesa pasa muy de cerca, con cada hilo a la vista",
  "notes": [
   "Un primer plano de tartán tejido se desliza en diagonal, con cada hilo y cada nervio de la sarga a la vista.",
   "Un único sett reflejado en una textura de 1 píxel sirve para urdimbre y trama; una regla de sarga 2/2, con la urdimbre encima donde (i + j) mod 4 < 2, elige el hilo visible."
  ]
 },
 "clifford-attractor": {
  "title": "Atractor de Clifford",
  "trick": "Una cinta de luz sedosa cambia de forma sin parar; mueve para doblarla",
  "notes": [
   "Una cinta de luz sedosa que se cruza consigo misma cambia de forma a medida que derivan sus cuatro parámetros. Las coordenadas x e y del puntero fijan dos coeficientes y remodelan el atractor bajo tu mano.",
   "Cada vértice itera el mapa de Clifford 24 veces desde un inicio obtenido por hash de gl_VertexID y luego se proyecta de forma aditiva en un búfer half-float que se desvanece, mapeado con log(1 + k·n)."
  ]
 },
 "barnsley-fern": {
  "title": "Helecho de Barnsley",
  "trick": "Puntos sueltos componen una hoja llena de foliolos; mueve para mecerla",
  "notes": [
   "Un helecho se forma a partir de puntos dispersos: primero el contorno, luego los folíolos y las nervaduras. El puntero es el viento: el helecho se inclina y se enrosca hacia él.",
   "El juego del caos con cuatro transformaciones afines ponderadas, trazado en un contador de impactos por píxel que indexa una rampa de color; los puntos por fotograma crecen de forma exponencial."
  ]
 },
 "sierpinski": {
  "title": "Juego del caos",
  "trick": "Saltos al azar construyen triángulos dentro de triángulos; mueve para tirar de una esquina",
  "notes": [
   "Un punto que salta a mitad de camino hacia vértices aleatorios dibuja un triángulo de Sierpinski en colores anidados. El puntero arrastra el vértice más cercano y la figura se recompone a su alrededor.",
   "El juego del caos con recuentos de impactos y sumas de color por píxel; cada impacto se tiñe según los dos últimos vértices, la dirección del punto, así que cada subcopia recibe su tono."
  ]
 },
 "dragon-curve": {
  "title": "Curva del dragón",
  "trick": "Una tira de papel se despliega pliegue a pliegue; mueve para ajustar el ángulo",
  "notes": [
   "Un dragón de Heighway se despliega pliegue a pliegue hasta 8.192 segmentos y luego se vuelve a plegar. De izquierda a derecha abre cada pliegue de 60° a 150°, con un enganche en 90°.",
   "Cada paso añade los puntos existentes en orden inverso, girados alrededor del último punto por un ángulo de pliegue que se suaviza de 0 a 90°, mientras la vista contrarrota."
  ]
 },
 "dot-matrix-wave": {
  "title": "Onda de matriz de puntos",
  "trick": "Luces redondas respiran en bandas ondulantes; mueve para alzar un bulto",
  "notes": [
   "Una cuadrícula de puntos respira en bandas ondulantes; el cursor levanta una cúpula caliente rodeada de un foso.",
   "Cada píxel encuentra su celda, muestrea en el centro un campo de alturas de ondas planas y circulares y dibuja un disco suavizado cuyo tamaño y color dependen de él."
  ]
 },
 "metaballs": {
  "title": "Metaballs",
  "trick": "Gotas brillantes se funden unas con otras; tu puntero es una más",
  "notes": [
   "Burbujas brillantes flotan y se funden unas con otras con cuellos suaves; el cursor también es una burbuja.",
   "Cada burbuja suma r² / d² a un campo con la superficie en 1; el gradiente exacto del campo ilumina cada píxel y suaviza el borde."
  ]
 },
 "aurora-ribbons": {
  "title": "Cortinas de aurora",
  "trick": "Una luz verde se pliega en un cielo estrellado; mueve para alzar un pliegue",
  "notes": [
   "Cortinas de aurora verde se pliegan y flotan por un cielo estrellado, brillando en violeta en lo alto. El puntero levanta la cortina más cercana en un pliegue brillante.",
   "Cada cortina cuelga de una curva de ruido doblada por senos, más brillante donde la pendiente del pliegue se acerca a cero (vista de canto); la luz se atenúa de forma exponencial con la altura."
  ]
 },
 "ripple-grid": {
  "title": "Cuadrícula de ondas",
  "trick": "Papel cuadriculado flota sobre el agua; toca o mueve para lanzar ondas",
  "notes": [
   "Una cuadrícula fina flota como papel milimetrado sobre el agua, con anillos que se extienden desde los clics y el movimiento.",
   "Los desplazamientos radiales de los trenes de ondas se suman por píxel y la cuadrícula se dibuja en el punto desplazado, con derivadas en espacio de pantalla para líneas de un píxel."
  ]
 },
 "voronoi-cells": {
  "title": "Celdas de Voronoi",
  "trick": "Paneles de vidrio flotan y cambian de vecinos; mueve para apartarlos",
  "notes": [
   "Un mosaico de cristal de celdas a la deriva con paredes luminosas que se deslizan e intercambian vecinas. El puntero es una semilla más que aparta a sus vecinas.",
   "Cada píxel comprueba las semillas vecinas en un 3 × 3 para obtener F1 y F2; dividir F2 − F1 por su gradiente exacto mantiene las paredes con un ancho de píxel uniforme."
  ]
 },
 "quasicrystal": {
  "title": "Cuasicristal",
  "trick": "Rosetones dorados florecen sin repetirse nunca; mueve para cambiarlos",
  "notes": [
   "Anillos dorados y rosetones de cinco puntas florecen hacia fuera en un patrón que nunca se repite. El puntero desplaza las fases de las ondas, y los rosetones se funden y se vuelven a formar.",
   "Se suman cinco ondas de bandas a k · 36°, lo que da una interferencia cuasiperiódica; desplazar todas las fases a la vez la hace fluir hacia fuera, y una onda triangular la pliega en anillos."
  ]
 },
 "topographic": {
  "title": "Curvas de nivel",
  "trick": "Las líneas del mapa siguen al relieve; mueve para alzar una colina, presiona para cavar",
  "notes": [
   "Las curvas de nivel de un paisaje que cambia despacio se apiñan en las laderas y se cierran en anillos en las cimas. El puntero levanta una colina que las curvas rodean; pulsa para hundir un hoyo.",
   "Ruido con domain warping da la altura; la distancia a la curva más cercana, dividida por fwidth, se mide en píxeles, así que cada línea es igual de nítida en terreno abrupto y suave."
  ]
 },
 "interference": {
  "title": "Interferencia de ondas",
  "trick": "Las ondas de dos puntos se cruzan en bandas; mueve para desplazar uno",
  "notes": [
   "Dos fuentes de ondas se cruzan en bandas brillantes y líneas nodales negras; mueve el cursor para arrastrar una de las fuentes.",
   "En cada píxel, cada fuente suma un número complejo con fase k · distancia y amplitud 1/√distancia; el módulo de la suma da las franjas fijas, y su parte real rotada, la onda en movimiento."
  ]
 },
 "plasma": {
  "title": "Plasma",
  "trick": "Manchas de neón coral y azul hielo se hinchan y se pliegan; mueve para guiarlas",
  "notes": [
   "Lóbulos de neón se hinchan, se funden y se pliegan, coral cálido por un lado y azul hielo por el otro. Los anillos se extienden desde el puntero.",
   "La receta de la demoscene: en cada píxel se suman senos en x, en y, en una diagonal y en un círculo; un coseno lleva la suma a una rampa oscuro-claro-oscuro que da a cada lóbulo un borde iluminado."
  ]
 },
 "heatmap": {
  "title": "Mapa de calor",
  "trick": "Las celdas se calientan con el calor que se desplaza; mueve para dejar una estela cálida",
  "notes": [
   "Una cuadrícula de celdas redondeadas brilla del negro al carmesí y al amarillo pálido mientras los focos calientes se desplazan. El puntero deja calor que se extiende y se enfría despacio.",
   "Ruido con domain warping más gaussianas errantes, muestreado en el centro de cada celda y mapeado con una paleta tipo inferno cuyo brillo sube de forma uniforme; las celdas son cuadrados redondeados SDF."
  ]
 },
 "julia-set": {
  "title": "Conjunto de Julia",
  "trick": "Un fractal luminoso se funde de lóbulos a espirales; mueve para guiarlo",
  "notes": [
   "Un fractal luminoso se transforma sin fin: lóbulos gruesos se funden en espirales, luego en encaje y polvo, y vuelta a empezar. Mueve el puntero para dirigir c tú mismo.",
   "Cada píxel itera z → z² + c mientras c recorre el borde de la cardioide de Mandelbrot; una estimación de distancia en píxeles mantiene los filamentos más finos nítidos a un píxel."
  ]
 },
 "brians-brain": {
  "title": "Brian’s Brain",
  "trick": "Naves diminutas cruzan, chocan y crean otras; arrastra para dibujar",
  "notes": [
   "Naves cruzan la cuadrícula, chocan y engendran otras nuevas, con estelas azules que se enfrían; arrastra para pintar celdas.",
   "Una celda se enciende cuando exactamente dos de sus ocho vecinas están encendidas, y después debe morir y descansar un paso; ese descanso forzoso lo mantiene todo en movimiento."
  ]
 },
 "langtons-ant": {
  "title": "Hormiga de Langton",
  "trick": "Garabatea una mancha caótica durante mucho rato y luego se va en línea recta",
  "notes": [
   "Una hormiga garabatea caos durante unos diez mil pasos y luego construye una autopista diagonal recta.",
   "Gira a la derecha en una celda vacía y a la izquierda en una llena, la invierte y avanza; el caos siempre acaba en un ciclo de 104 pasos. Las celdas se colorean según cuándo se pisaron por última vez."
  ]
 },
 "falling-sand": {
  "title": "Arena que cae",
  "trick": "Mueve el puntero para verter granos que forman dunas y absorben agua",
  "notes": [
   "Arena fina del desierto cae desde el cursor, se amontona en las cornisas y se asienta en dunas por capas; de vez en cuando baja un chorro de agua, se encharca en los huecos y oscurece la arena que empapa.",
   "Una cuadrícula de granos recorrida de abajo arriba: cada uno cae cada vez más rápido o resbala en diagonal, el agua además se extiende a los lados y se filtra, y los bloques de 32 celdas sin movimiento se duermen."
  ]
 },
 "doom-fire": {
  "title": "Fuego de Doom",
  "trick": "Llamas pixeladas se mecen y vuelven a rugir; arrastra para añadir calor",
  "notes": [
   "Un muro de fuego de píxeles gruesos se mece, se apaga y vuelve a rugir; arrastra para añadir calor donde quieras.",
   "Valores de calor de 0–36 suben desde una fila inferior caliente: cada celda se copia hacia arriba, desplazada a un lado y enfriada por un mismo número aleatorio, y una rampa de 37 colores la convierte en llama."
  ]
 },
 "water-ripple": {
  "title": "Ondas en el agua",
  "trick": "Gotas dibujan anillos en un estanque soleado; arrastra para una estela, toca para salpicar",
  "notes": [
   "Un estanque poco profundo en un día de sol: cae una gota cada vez en el agua clara y envía un anillo que dobla los guijarros del fondo, con cáusticas de sol en el lecho y el cielo en la superficie; el control fija los segundos entre gotas. Arrastra para dejar una estela y haz clic para una gota grande.",
   "La ecuación de ondas en dos texturas flotantes que se alternan: la nueva altura es la mitad de la suma de las vecinas menos la altura anterior, amortiguada; la pendiente refracta el fondo y refleja el cielo, la curvatura concentra la luz del sol y el sol destella en cada anillo."
  ]
 },
 "double-pendulum": {
  "title": "Péndulos dobles",
  "trick": "Nueve se balancean como uno y luego se separan; mueve para sujetar el eje",
  "notes": [
   "Nueve péndulos dobles oscilan como un único trazo blanco y de pronto se abren en abanico en colores que ya nunca coinciden. El puntero sujeta el pivote, así que los péndulos cuelgan de tu mano.",
   "Parten separados por una fracción de milirradián y se integran con Runge–Kutta 4 sobre las ecuaciones completas; el caos duplica la diferencia en cada oscilación. Las estelas aditivas hacen blanco el trazo compartido."
  ]
 },
 "orbits": {
  "title": "Órbitas de N cuerpos",
  "trick": "Planetas trazan rosetones alrededor de dos soles; toca para soltar uno nuevo",
  "notes": [
   "Los planetas giran alrededor de dos soles en rosetones que rotan despacio mientras pasan cometas; haz clic para soltar un planeta.",
   "Gravedad de cuadrado inverso suavizada entre cada par, integrada con leapfrog (medio impulso, deriva, medio impulso), que es simpléctico y mantiene las órbitas cerradas; el tirón del sistema binario las hace precesar."
  ]
 },
 "vortex": {
  "title": "Vórtice de desagüe",
  "trick": "Estelas giran en espiral hacia un agujero que sigue a tu puntero",
  "notes": [
   "Miles de estelas caen en espiral hacia un desagüe que sigue al cursor, con sus colores enrollados en brazos espirales.",
   "Un vórtice de Lamb–Oseen: un giro tangencial que decae como 1/r fuera de un núcleo suave y una leve atracción hacia dentro; las partículas conservan el color de su sector de origen, que los anillos interiores cizallan en espirales."
  ]
 },
 "plexus": {
  "title": "Plexo",
  "trick": "Puntos a la deriva se unen con líneas finas; mueve para reunirlos",
  "notes": [
   "Puntos a la deriva tejen una malla de líneas finas, y el cursor reúne a los más cercanos en enlaces cálidos.",
   "Los puntos se unen a sus vecinos dentro de una distancia dada, atenuándose con la longitud, y se buscan en una cuadrícula uniforme del ancho de un enlace; las líneas se agrupan en unos pocos niveles de opacidad, con un trazado por nivel."
  ]
 },
 "matrix-rain": {
  "title": "Lluvia digital",
  "trick": "Glifos verdes caen en columnas tras cabezas blancas brillantes",
  "notes": [
   "Columnas de katakana invertidos y dígitos caen en cascada, cada una encabezada por una cabeza blanca y una cola verde que se desvanece.",
   "Cada glifo se dibuja una sola vez con fillText en un atlas a la resolución del dispositivo y se estampa con drawImage, así que miles por fotograma siguen nítidos y baratos."
  ]
 },
 "starfield-warp": {
  "title": "Campo de estrellas en hiperespacio",
  "trick": "Las estrellas se estiran en trazos al ganar velocidad; mueve para dirigir",
  "notes": [
   "Las estrellas salen disparadas desde un punto de fuga: puntos a velocidad de crucero y largas estelas en hiperespacio; el puntero dirige.",
   "Cada estrella 3D se dibuja como una línea desde su última posición proyectada (x/z, y/z) hasta la actual, así que la velocidad alarga las estelas sin coste extra; las líneas se agrupan por color."
  ]
 },
 "oscilloscope": {
  "title": "Osciloscopio",
  "trick": "Un haz verde dibuja figuras en bucle; mueve para girar los mandos",
  "notes": [
   "Un trazo verde de CRT dibuja figuras de Lissajous a la deriva sobre una retícula, dejando una persistencia de fósforo que se desvanece. En horizontal se elige la razón de frecuencias; en vertical, la fase.",
   "Dos generadores de senos mueven x e y; el brillo de cada segmento es inverso a su longitud, como en un haz real, y cada fotograma solo atenúa en parte el anterior."
  ]
 },
 "copper-bars": {
  "title": "Copper bars",
  "trick": "Franjas brillantes al estilo Amiga ruedan unas delante de otras",
  "notes": [
   "Barras horizontales brillantes pasan unas por encima y por debajo de otras sobre un reflejo ondulante, con bandas como en un Amiga.",
   "Cada barra recorre un círculo en altura y profundidad, y cada línea de barrido muestra la barra más cercana que la cubre; los colores se ajustan a 16 niveles por canal."
  ]
 },
 "checker-tunnel": {
  "title": "Túnel de damero",
  "trick": "Avanza por un tubo sin fin de cuadros que se retuerce hacia la oscuridad",
  "notes": [
   "Un túnel de damero infinito que se retuerce y se curva pasa a toda velocidad y se pierde en la oscuridad.",
   "El ángulo de cada píxel pasa a ser u y 1/distancia pasa a ser v, envolviendo un damero plano en un tubo; filtrar por caja con derivadas de pantalla mantiene nítidas las casillas hasta el punto de fuga."
  ]
 },
 "rotozoom": {
  "title": "Rotozoom",
  "trick": "Un patrón de cuadrados anidados gira y hace zoom como una demo de los 90",
  "notes": [
   "Un patrón XOR de cuadrados anidados gira y hace zoom hacia dentro y hacia fuera por toda la pantalla.",
   "Las coordenadas de cada píxel pasan por una matriz de rotación y escala que cambia en cada fotograma y luego leen una textura x ^ y de 256×256; los mipmaps evitan el parpadeo al alejar."
  ]
 },
 "seven-segment": {
  "title": "Reloj de siete segmentos",
  "trick": "Una pantalla LED cuenta centésimas, con los segmentos apagados al fondo",
  "notes": [
   "Un reloj LED en directo con centésimas, esfera inclinada, tenues segmentos apagados y dos puntos que parpadean.",
   "Cada dígito son siete barras hexagonales a inglete encendidas a partir de una máscara de bits por número, con transiciones suaves; el resplandor es una pasada de shadow-blur por nivel de brillo."
  ]
 },
 "led-matrix": {
  "title": "Letrero LED de matriz de puntos",
  "trick": "Un texto ámbar se desplaza por un panel de bombillas redondas",
  "notes": [
   "Un texto ámbar se desplaza por un panel de LED redondos con puntos fantasma y un bloom suave.",
   "La CPU rasteriza una fuente de 5×7 en una pequeña textura de encendido y apagado; el shader dibuja cada LED como una lente con núcleo caliente y suma sus ocho vecinos como bloom."
  ]
 },
 "radar-sweep": {
  "title": "Barrido de radar",
  "trick": "Un haz giratorio enciende ecos que se apagan hasta la siguiente pasada",
  "notes": [
   "Un haz de radar gira sobre anillos de distancia, y los contactos destellan a su paso y luego se apagan.",
   "No se acumula nada entre fotogramas: cada píxel calcula cuánto ha girado el haz desde que lo cruzó y brilla según una exponencial de ese valor; los contactos solo se actualizan al ser barridos."
  ]
 },
 "ekg": {
  "title": "Monitor cardíaco",
  "trick": "Un trazo verde del corazón se escribe en pantalla borrando a su paso",
  "notes": [
   "Un trazo verde de ECG se escribe por la pantalla, borrando un hueco justo delante de la pluma.",
   "Cada latido suma protuberancias gaussianas para la onda P, el pico QRS y la onda T, escritas de izquierda a derecha en un búfer fijo; nada se desplaza."
  ]
 },
 "audio-bars": {
  "title": "Analizador de espectro",
  "trick": "Barras que saltan al ritmo, con topes de pico que flotan y luego caen",
  "notes": [
   "Barras segmentadas de verde a rojo bailan al ritmo, cada una coronada por un tope de pico que se queda flotando y luego cae.",
   "Un espectro sintético (pendiente de ruido rosa más bombo, caja, charles y notas) mueve barras que suben rápido y bajan despacio; los topes aguantan un tercio de segundo y luego caen por gravedad."
  ]
 },
 "neon-pipes": {
  "title": "Tubos de neón",
  "trick": "Vidrio de colores brillante serpentea por una pared oscura",
  "notes": [
   "Tubos de neón de colores serpentean despacio por una pared oscura, cada uno con un núcleo al rojo blanco y un halo suave.",
   "El bloom se traza en un búfer a un cuarto de resolución, se reduce a la mitad dos veces más y cada nivel se vuelve a ampliar de forma aditiva: un desenfoque barato sin filtro."
  ]
 },
 "crosshair-hud": {
  "title": "HUD de puntería",
  "trick": "Una mira sigue tu puntero y se fija en los ecos cercanos",
  "notes": [
   "Una retícula de puntería sigue al puntero con lecturas en directo, y unos corchetes se cierran para fijar los contactos.",
   "La retícula persigue al puntero con un muelle de amortiguamiento crítico, así que se asienta sin pasarse; cada línea fina se ajusta a la cuadrícula de píxeles del dispositivo."
  ]
 },
 "fade-scale": {
  "title": "Aparición con escala",
  "trick": "Las tarjetas viejas salen rápido y las nuevas suben una a una",
  "notes": [
   "Toca un filtro de la tienda y las tarjetas de producto se van rápido; luego las nuevas aparecen por turnos.",
   "Cada tarjeta entra desde un 94 % de escala y transparente, con un ease-out marcado; la salida es más corta que la entrada, así que los resultados nuevos nunca esperan a los viejos."
  ]
 },
 "stagger-grid": {
  "title": "Cuadrícula escalonada",
  "trick": "Un cambio de color se propaga desde la muestra tocada",
  "notes": [
   "Toca una muestra de una carta de colores y todas las muestras adoptan un tono de ella en una onda que se expande.",
   "El retardo de cada muestra es su distancia al toque multiplicada por un pequeño paso por celda (de 20 a 40 ms), así que una sola regla convierte decenas de cambios en una sola onda."
  ]
 },
 "easing-race": {
  "title": "Carrera de curvas de easing",
  "trick": "Cuatro interruptores en paralelo muestran por qué ease-out se siente más rápido",
  "notes": [
   "Cuatro interruptores de facturación cambian a la vez con la misma distancia y el mismo tiempo; solo cambia la curva de easing.",
   "Lineal, ease-in, un ease-out marcado y un muelle, uno al lado del otro; en la primera décima de segundo el ease-out casi ha llegado, y por eso se siente rápido."
  ]
 },
 "card-flip": {
  "title": "Volteo de tarjeta 3D",
  "trick": "Se da la vuelta para mostrar el dorso cuando el campo CVC está activo",
  "notes": [
   "Al pagar, la vista previa de la tarjeta se da la vuelta cuando el campo CVC recibe el foco, y vuelve después.",
   "Dos caras espalda con espalda con backface-visibility hidden y perspectiva en el elemento padre; un muelle mueve el ángulo, así que se pasa un poco y se asienta."
  ]
 },
 "anticipation": {
  "title": "Anticipación y continuidad",
  "trick": "Un producto se agacha, salta a la bolsa y el asa se balancea",
  "notes": [
   "Un producto salta al icono de la bolsa: primero se agacha, se estira en el aire y el asa sigue balanceándose.",
   "Agacharse es la anticipación, y el balanceo del asa cuando la bolsa se detiene es la continuidad, ambas curvas amortiguadas calculadas por fotograma; sin ellas el salto parece un empujón, no un salto."
  ]
 },
 "list-reorder": {
  "title": "Reordenar lista (FLIP)",
  "trick": "Las filas de una clasificación se deslizan a su nuevo puesto, las que suben por encima",
  "notes": [
   "La clasificación de un club de running se reordena por distancia, ritmo o desnivel, y cada corredor se desliza a su nuevo puesto.",
   "FLIP: medir cada fila, reordenar, transformar cada una de vuelta a su posición anterior y animar a cero; las filas que suben pasan por encima de las que bajan."
  ]
 },
 "add-remove": {
  "title": "Añadir y quitar",
  "trick": "Un artículo se desvanece, el resto cierra el hueco y Deshacer lo revierte",
  "notes": [
   "Un artículo eliminado de la bolsa se desvanece y luego las filas de abajo cierran el hueco; Deshacer invierte ambos pasos.",
   "Las filas nunca animan la altura: se miden antes y después y se deslizan con un transform escalonado (FLIP), y salir primero y colapsar después hace que nada salte."
  ]
 },
 "number-ticker": {
  "title": "Contador de números",
  "trick": "Cada dígito rueda hasta su nuevo valor cuando cambia un dato",
  "notes": [
   "Una tarjeta de ingresos cambia de periodo y cada dígito rueda hasta su nuevo valor como un cuentakilómetros.",
   "Cada dígito es una tira de 0–9 tras una ventana de una línea con bordes difuminados; solo se mueve translateY, con un pequeño escalonado de izquierda a derecha para que se lea como un único barrido."
  ]
 },
 "accordion-faq": {
  "title": "Acordeón de preguntas frecuentes",
  "trick": "Las respuestas se abren de una en una, con el texto un instante después",
  "notes": [
   "Las preguntas sobre envíos se abren de una en una: el panel de respuesta crece, el anterior se cierra y el chevrón gira.",
   "El panel anima la altura hasta la altura medida de la respuesta, nunca hasta auto; el texto aparece un instante después de que el panel empiece y es lo primero en irse al cerrar."
  ]
 },
 "tab-swap": {
  "title": "Cambio de pestaña",
  "trick": "Una píldora oscura se estira hasta la opción elegida, primero el borde delantero",
  "notes": [
   "Una píldora oscura se desliza hasta la pestaña de producto elegida y el contenido de abajo hace un fundido cruzado.",
   "La píldora es una copia oscura de la fila de pestañas recortada a la pestaña activa, así que animar el recorte mueve a la vez el fondo y el color de la etiqueta; el borde de avance va delante."
  ]
 },
 "push-slide": {
  "title": "Deslizamiento con empuje",
  "trick": "Una pantalla nueva entra mientras la anterior retrocede y se oscurece",
  "notes": [
   "En los Ajustes del móvil, Notificaciones entra empujando desde la derecha y Atrás la vuelve a sacar.",
   "La pantalla nueva recorre todo el ancho mientras la vieja se mueve un 30 % y se oscurece, con una misma curva al estilo iOS; la diferencia de velocidad se lee como profundidad."
  ]
 },
 "circle-reveal": {
  "title": "Revelado circular",
  "trick": "Toca en cualquier sitio y el nuevo tema se extiende desde ese punto",
  "notes": [
   "Al tocar Oscuro, el tema oscuro se extiende en círculo desde tu dedo; haz clic para fijar el origen.",
   "La pantalla nueva está encima, recortada a un círculo de radio 0 en el punto del toque que crece hasta cubrir la esquina más lejana."
  ]
 },
 "staircase-wipe": {
  "title": "Barrido en escalera",
  "trick": "Barras de colores bajan sobre la página y siguen de largo",
  "notes": [
   "Siguiente hace bajar barras de colores por turnos sobre una página de tienda y revela la siguiente colección al irse.",
   "Las barras cubren la página, el contenido cambia mientras está oculto y las barras siguen bajando en vez de volver atrás; adoptan el color de la siguiente colección."
  ]
 },
 "shared-expand": {
  "title": "Expansión de elemento compartido",
  "trick": "La foto de un producto crece desde su tarjeta hasta la cabecera de la página",
  "notes": [
   "Una foto de producto tocada crece desde su tarjeta hasta la cabecera de la página y se encoge al volver.",
   "FLIP desde el rectángulo de la tarjeta: colocar la foto como cabecera, transformarla de vuelta sobre la tarjeta y animar a cero; la escala uniforme con un recorte evita que se deforme."
  ]
 },
 "view-transition": {
  "title": "Transformación con View Transitions",
  "trick": "La portada de un álbum crece hasta la cabecera del álbum abierto, y vuelve",
  "notes": [
   "La portada y el nombre de un álbum crecen hasta la cabecera del álbum abierto y se encogen al volver.",
   "document.startViewTransition() captura la pantalla, aplica el cambio en el DOM y transforma entre sus cajas cada elemento que comparte view-transition-name; el resto hace un fundido cruzado, sin código de animación."
  ]
 },
 "ios-sheet": {
  "title": "Hoja de iOS",
  "trick": "Un panel sube mientras la página de detrás retrocede y se oscurece",
  "notes": [
   "Elegir talla hace subir una hoja mientras la página de detrás se encoge, redondea sus esquinas y se oscurece.",
   "La hoja se mueve con translateY y la página con scale y un clip-path para las esquinas, bajo una capa negra que se desvanece, todo con la misma curva de cajón."
  ]
 },
 "lightbox-zoom": {
  "title": "Zoom de lightbox",
  "trick": "Una miniatura crece hasta una foto a pantalla completa y vuelve a su sitio",
  "notes": [
   "Una foto tocada crece desde su cuadrado hasta un visor a pantalla completa; desliza hacia abajo y vuelve a su sitio.",
   "La miniatura es un recorte centrado, así que la foto escala de forma uniforme mientras un clip-path abre el recorte al encuadre completo: FLIP solo con transform y clip-path."
  ]
 },
 "directional-tabs": {
  "title": "Pestañas direccionales",
  "trick": "Los productos entran desde el lado de la categoría elegida",
  "notes": [
   "Elegir una categoría más a la derecha hace entrar los productos desde la derecha; volver atrás los hace entrar desde la izquierda.",
   "El contenido viejo se desvanece moviéndose en sentido contrario, el nuevo entra desde una fracción del ancho, y el subrayado se desliza y se estira hasta la nueva etiqueta."
  ]
 },
 "blur-crossfade": {
  "title": "Fundido con desenfoque",
  "trick": "La vista en cuadrícula se funde con la lista sin una doble imagen confusa",
  "notes": [
   "Cambiar una categoría de la tienda entre vista de cuadrícula y de lista funde un diseño en el otro.",
   "La vista vieja se desvanece desenfocándose y encogiéndose un poco; la nueva aparece después desde desenfocada y algo más grande. El desenfoque oculta la imagen doble; mantenlo por debajo de 20 px."
  ]
 },
 "card-stack-swipe": {
  "title": "Deslizar pila de tarjetas",
  "trick": "Las fotos se inclinan, reciben un sello Guardar o Borrar y salen volando",
  "notes": [
   "Las fotos se arrastran a la derecha para conservarlas o a la izquierda para borrarlas y salen lanzadas, y sube la siguiente tarjeta.",
   "Mientras se arrastra, la tarjeta se inclina según su desplazamiento y aparece un sello de CONSERVAR o BORRAR; el lanzamiento usa un ease-out y las tarjetas de detrás se colocan con muelles."
  ]
 },
 "letter-rise": {
  "title": "Letras que suben escalonadas",
  "trick": "Un nombre surge de un borde oculto, un carácter tras otro",
  "notes": [
   "El nombre de un compositor sube letra a letra desde una línea recortada, y luego llegan la fecha y el programa.",
   "Cada letra está en una línea con overflow hidden y tiene su propio muelle escalonado; el ligero exceso parece compuesto a mano, y la salida usa un escalonado más corto."
  ]
 },
 "scramble": {
  "title": "Descifrado",
  "trick": "Caracteres al azar se agitan y luego se fijan en palabras de izquierda a derecha",
  "notes": [
   "Un titular y una huella de clave pasan por glifos aleatorios y se fijan en su sitio, letra a letra.",
   "Cada carácter recorre glifos aleatorios hasta que le llega el turno en orden de lectura y entonces se fija en la letra real; una fuente monoespaciada evita que la línea se mueva."
  ]
 },
 "vf-wave": {
  "title": "Onda de fuente variable",
  "trick": "Un abultamiento de peso y anchura recorre una palabra",
  "notes": [
   "Una onda de peso y ancho recorre una palabra mientras unos controles de eje siguen a la letra marcada.",
   "Cada letra lee un seno desfasado según su índice y fija font-variation-settings; los mandos y rellenos de los controles son transforms, así que las lecturas nunca provocan layout."
  ]
 },
 "typewriter": {
  "title": "Máquina de escribir",
  "trick": "Un buscador escribe viajes de ejemplo con pausas humanas",
  "notes": [
   "Un buscador escribe viajes de ejemplo, los divide en chips de filtro que aparecen de golpe y luego borra el texto.",
   "El retardo de cada tecla varía al azar en torno a la velocidad base, la puntuación añade una pausa, el cursor solo parpadea en reposo y borrar va más rápido que escribir."
  ]
 },
 "line-mask": {
  "title": "Revelado con máscara de línea",
  "trick": "Un titular sube fila a fila desde un borde oculto",
  "notes": [
   "Un titular de tres líneas sube línea a línea, después aparece la firma y la foto se revela de abajo arriba.",
   "Cada línea está en una caja con overflow hidden, así que su texto empieza por debajo del borde; escalonar por línea respeta los saltos del editor, y la salida dura la mitad."
  ]
 },
 "split-flap": {
  "title": "Panel de lamas",
  "trick": "Las letras giran como en un tablero de salidas de aeropuerto",
  "notes": [
   "Un panel de salidas voltea las filas hasta el siguiente vuelo, y cada carácter recorre el alfabeto lama a lama.",
   "Cada celda tiene cuatro mitades: la mitad superior vieja se pliega sobre la línea de doblez y luego cae la nueva inferior; las columnas arrancan con milisegundos de diferencia y se asientan en una onda irregular."
  ]
 },
 "odometer": {
  "title": "Cuentakilómetros",
  "trick": "El total de una ONG sube con cada donación, rueda a rueda",
  "notes": [
   "El total en directo de una ONG sube con cada donación mientras entra una tarjeta en el feed.",
   "Cada dígito es una rueda de 0–9 movida con transform que solo gira mientras su vecina de la derecha pasa de 9 a 0, así que los acarreos se propagan a la izquierda; las cifras tabulares mantienen el número estable."
  ]
 },
 "rotating-word": {
  "title": "Palabra rotatoria",
  "trick": "El final de un titular cambia sin parar, deslizándose por una ranura",
  "notes": [
   "La última palabra de un titular va pasando por familias, compañeros de piso, clubes y equipos, y el calendario de al lado la sigue.",
   "La palabra sube por una ranura recortada con unos píxeles de desenfoque mientras aparece un subrayado; cierra una línea alineada a la izquierda, así que nada más se mueve."
  ]
 },
 "highlighter": {
  "title": "Resaltado con rotulador",
  "trick": "Un trazo irregular pasa tras las frases clave, línea a línea",
  "notes": [
   "Un resaltado de rotulador pasa por detrás de tres frases de una página de Walden, un trazo por línea.",
   "Cada línea recibe su propia banda SVG con bordes ondulados, extremos inclinados y una ligera inclinación, revelada con un barrido de clip-path a velocidad de trazo constante."
  ]
 },
 "text-circle": {
  "title": "Texto en un círculo",
  "trick": "Un anillo de palabras gira despacio; pasa por encima para acelerarlo",
  "notes": [
   "Un anillo de texto gira despacio alrededor de una flecha y a veces acelera; pasa el cursor para hacerlo girar tú.",
   "El texto recorre un círculo SVG con textPath, estirado para encajar exactamente, y su velocidad se acerca suavemente a un objetivo, así que nunca da tirones."
  ]
 },
 "parallax": {
  "title": "Capas de paralaje",
  "trick": "Al desplazarte, las montañas lejanas se rezagan y las cercanas siguen el ritmo",
  "notes": [
   "Al hacer scroll, las montañas lejanas apenas se mueven, la cresta cercana casi sigue el ritmo y el título flota entre ambas.",
   "Cada capa se desplaza hacia abajo una parte del scroll, así que su velocidad neta disminuye con la distancia; esa diferencia de velocidad es lo que se lee como profundidad."
  ]
 },
 "scrub-reveal": {
  "title": "Revelado con scroll",
  "trick": "Una frase se ilumina palabra a palabra al desplazarte",
  "notes": [
   "Una frase de producto se queda fija y se ilumina palabra a palabra mientras la página hace scroll.",
   "El avance por el tramo fijado se traduce en la opacidad de cada palabra, desfasada según su posición en la frase, así que sigue el scroll con exactitud en ambos sentidos."
  ]
 },
 "pinned-track": {
  "title": "Pista horizontal fijada",
  "trick": "Al bajar, una fila de proyectos se desliza hacia un lado",
  "notes": [
   "Una sección de portfolio se queda fija mientras el scroll desliza en horizontal una fila de proyectos, con contador y barra de progreso.",
   "Una sección alta contiene un marco con position: sticky; el avance por ella se traduce directamente en el desplazamiento de la fila, y la altura de la sección marca el ritmo."
  ]
 },
 "zoom-through": {
  "title": "Zoom a través",
  "trick": "Al desplazarte, entras volando en la O de una palabra gigante",
  "notes": [
   "Saturno asoma por la O de LOOK, y el scroll agranda la palabra hasta que atraviesas la letra volando.",
   "La palabra escala de forma exponencial alrededor del ojo de la O, lo que se lee como un avance constante; los ojos de las letras son huecos de clip-path evenodd, así que el cielo se ve a través desde el principio."
  ]
 },
 "velocity-skew": {
  "title": "Marquesina con inclinación por velocidad",
  "trick": "El texto corre y se inclina más cuanto más rápido deslizas",
  "notes": [
   "Las bandas promocionales se desplazan sin parar, y un golpe rápido de scroll las hace correr e inclinarse antes de asentarse.",
   "La velocidad del scroll se suaviza, se suma a la velocidad de desplazamiento y se convierte en un skew, así que la inclinación crece y se asienta en vez de dar tirones."
  ]
 },
 "reading-progress": {
  "title": "Progreso de lectura",
  "trick": "Una barra fina se llena mientras lees y bajan los minutos restantes",
  "notes": [
   "Una barra fina se llena mientras lees, y los minutos restantes van bajando, deslizándose en el sentido del scroll.",
   "La barra es un único elemento escalado en x y suavizado hacia la posición real, así que las sacudidas del scroll nunca se notan; los minutos salen de las palabras que quedan por debajo."
  ]
 },
 "sticky-stack": {
  "title": "Pila de tarjetas sticky",
  "trick": "Los pasos se apilan al desplazarte y los anteriores retroceden",
  "notes": [
   "Cada tarjeta de paso se fija un poco más abajo que la anterior, y las tarjetas cubiertas se reducen y se oscurecen.",
   "position: sticky hace el apilado; la profundidad de cada tarjeta depende de cuánto han avanzado las siguientes, lo que controla una escala desde el borde superior y un sombreado."
  ]
 },
 "timeline-draw": {
  "title": "Línea de tiempo que se dibuja",
  "trick": "Una línea baja por la página al desplazarte y van apareciendo los años",
  "notes": [
   "Una línea de telégrafo de cobre se dibuja página abajo mientras haces scroll, y cada año aparece al llegar.",
   "La línea se controla con un borde de clip-path fijado a una línea de lectura fija del viewport, con una punta luminosa; los hitos, en cambio, se activan y entran suavemente una sola vez."
  ]
 },
 "sequence-scrub": {
  "title": "Secuencia de imágenes con scroll",
  "trick": "Una zapatilla da una vuelta completa al desplazarte, fotograma a fotograma",
  "notes": [
   "Una zapatilla de running da una vuelta completa fotograma a fotograma al hacer scroll, junto a notas de características que cambian.",
   "Una pequeña malla 3D de sombreado plano dibujada en código se guarda en caché como fotogramas la primera vez; la posición del scroll elige el fotograma, sin nada interpolado entre ellos."
  ]
 },
 "snap-gallery": {
  "title": "Galería con snap",
  "trick": "Las fotos encajan una a una y la del centro crece",
  "notes": [
   "Una fila de fotografías nocturnas se ajusta tarjeta a tarjeta, con la tarjeta central agrandándose mientras las vecinas se atenúan.",
   "La escala y la atenuación salen de la distancia de cada tarjeta al centro en cada fotograma, así que siguen el scroll en pleno gesto; el scroll snapping de CSS asienta un deslizamiento real."
  ]
 },
 "magnetic": {
  "title": "Botón magnético",
  "trick": "Se inclina hacia el puntero cuando se acerca, y la etiqueta aún más",
  "notes": [
   "Dos botones de registro se inclinan hacia el cursor que se acerca, y cada etiqueta se inclina un poco más que su botón.",
   "La atracción es máxima en el centro y se anula en el borde del radio, y ambas posiciones pasan por muelles, así que nunca salta al engancharse ni al soltarse."
  ]
 },
 "ripple": {
  "title": "Onda al hacer clic",
  "trick": "Pulsa un botón y un círculo suave se extiende desde el punto exacto",
  "notes": [
   "Pulsar un botón de precios lanza un círculo suave desde el punto exacto pulsado, y el botón se hunde.",
   "El círculo tiene el tamaño justo para llegar a la esquina más lejana, crece con un ease-out marcado y se desvanece; empieza en pointerdown, no al soltar."
  ]
 },
 "tilt": {
  "title": "Tarjeta con inclinación 3D",
  "trick": "Gira hacia el cursor y se eleva, con un reflejo que la cruza",
  "notes": [
   "Una tarjeta de artículo bajo el cursor gira hacia él, se eleva un poco y un brillo suave la recorre.",
   "La posición del cursor sobre la tarjeta se traduce en rotateX y rotateY mediante muelles, con la sombra y el brillo siguiendo los mismos valores; al salir vuelve a quedar plana."
  ]
 },
 "cursor-trail": {
  "title": "Estela del cursor",
  "trick": "Una cinta cálida sigue al puntero y se curva con cada gesto",
  "notes": [
   "Una cinta cálida sigue al cursor, afinándose y enroscándose con cada gesto.",
   "El primer punto está sobre el cursor y cada uno de los demás se acerca suavemente al de delante; se dibuja opaca, fundiéndose con el color de la página, así que las uniones nunca forman bolitas."
  ]
 },
 "spotlight": {
  "title": "Revelado con foco",
  "trick": "Una linterna suave sigue al cursor bajo un velo oscuro",
  "notes": [
   "Un agujero redondo y suave en un velo oscuro sigue al cursor y revela debajo una colorida vista previa de calendario.",
   "Una máscara radial-gradient sobre el velo se mueve con el cursor, suavizada para que la luz quede un poco rezagada; no hace falta canvas."
  ]
 },
 "image-follow": {
  "title": "Imagen que sigue al cursor",
  "trick": "Recorre una lista de proyectos y cada vista previa sigue al cursor",
  "notes": [
   "Al pasar por una fila de proyecto aparece su vista previa junto al cursor, rezagada e inclinándose con el movimiento.",
   "La vista previa se acerca suavemente al cursor y se inclina según su velocidad; las imágenes comparten una tira dentro de un marco fijo, y cambiar de fila desliza la tira, así que nunca desaparece."
  ]
 },
 "directional-fill": {
  "title": "Relleno direccional",
  "trick": "El color entra por el lado por donde llegas y sale por donde te vas",
  "notes": [
   "El relleno oscuro de un botón entra por el lado por el que entró el cursor y sale por el lado por el que se va.",
   "Una copia rellena del botón se revela con un clip-path inset desde el borde de entrada y luego se recoge hacia el borde de salida desde donde se quedó el último barrido."
  ]
 },
 "underline-slide": {
  "title": "Subrayado deslizante",
  "trick": "Una sola marca del menú se estira hasta el enlace que señalas",
  "notes": [
   "Un único subrayado de navegación se desliza hasta el enlace bajo el cursor y vuelve a la página actual cuando el cursor se va.",
   "Sus dos extremos van en muelles separados, el delantero más rápido, así que se estira hacia el destino; se dibuja solo con translateX y scaleX."
  ]
 },
 "lit-border": {
  "title": "Borde iluminado",
  "trick": "Los bordes de las tarjetas de una cuadrícula oscura se encienden alrededor del cursor",
  "notes": [
   "Las tarjetas de una cuadrícula oscura se iluminan alrededor del cursor, y las vecinas reciben un reflejo en sus bordes más cercanos.",
   "Cada tarjeta coloca un radial-gradient en sus propias coordenadas; una máscara limita una copia a un borde de 1px mientras otra tiñe la superficie."
  ]
 },
 "dock-magnify": {
  "title": "Lupa del Dock",
  "trick": "Los iconos se hinchan bajo el cursor y apartan a sus vecinos",
  "notes": [
   "Los iconos del Dock se agrandan al pasar el cursor, más bajo él y cada vez menos en unos pocos vecinos.",
   "La escala sigue una caída en coseno con la distancia, y el desplazamiento de cada icono se calcula a partir de los nuevos tamaños para que la fila se ensanche exactamente lo que ha crecido; solo transforms."
  ]
 },
 "toggle": {
  "title": "Interruptor con muelle",
  "trick": "Toca un interruptor y su botón se estira al deslizarse, luego aterriza",
  "notes": [
   "Los interruptores de notificaciones cambian de uno en uno, y cada mando se estira en su recorrido y se redondea de golpe al llegar.",
   "El mando va sobre un muelle, con un scaleX anclado en su borde trasero que crece con la velocidad; el color del carril sigue la posición del mando, no un temporizador."
  ]
 },
 "like-burst": {
  "title": "Estallido de me gusta",
  "trick": "Toca el corazón y se aplasta, revienta y lanza un anillo de puntos",
  "notes": [
   "El corazón de un producto guardado se aplasta, se pasa de su tamaño y se asienta mientras salen un anillo y unos puntos.",
   "Todas las partes empiezan en el mismo fotograma, así que se lee como un único suceso, y las chispas eligen ángulos aleatorios nuevos cada vez."
  ]
 },
 "submit-success": {
  "title": "Del envío al éxito",
  "trick": "Toca Enviar y el botón se vuelve un spinner y luego un check verde",
  "notes": [
   "Un botón Enviar se estrecha hasta ser un círculo, gira mientras envía y luego se vuelve verde y dibuja una marca.",
   "El estrechamiento es un clip-path inset con un ease-out marcado y la marca se dibuja con stroke-dashoffset, así que un solo control muestra todos los estados."
  ]
 },
 "arc-spinner": {
  "title": "Spinner de arco",
  "trick": "Un anillo de carga cuyo trazo crece y mengua mientras gira",
  "notes": [
   "Un proceso de pago muestra un pequeño spinner en la línea de envío y luego uno más grande dentro del botón Pagar.",
   "El anillo gira mientras el trazo discontinuo crece y se encoge con periodos distintos, así que nunca se repite igual dos veces seguidas."
  ]
 },
 "skeleton": {
  "title": "Brillo de skeleton",
  "trick": "Bloques grises sostienen el diseño hasta que aparecen los elementos reales",
  "notes": [
   "Filas grises de marcador mantienen el diseño del cajón del carrito bajo un barrido de luz, y luego aparecen los artículos reales.",
   "Los marcadores tienen el tamaño de las filas reales, así que nada salta; cada fila hace un fundido cruzado sobre su propio marcador, 50 ms después de la de arriba."
  ]
 },
 "copy-tick": {
  "title": "Copiar a marca",
  "trick": "Toca Copiar y el icono se vuelve un check con la etiqueta Copiado",
  "notes": [
   "Al pulsar Copiar, el icono cambia por una marca que se dibuja sola y sube una pequeña etiqueta Copiado.",
   "Los iconos hacen un fundido cruzado desde un 95 % de escala, la marca se dibuja con stroke-dashoffset y, al cabo de un momento, todo vuelve discretamente a su estado inicial."
  ]
 },
 "password-strength": {
  "title": "Seguridad de la contraseña",
  "trick": "Un medidor se llena y las reglas se marcan mientras se escribe",
  "notes": [
   "Mientras se escribe sola una contraseña, un medidor de cuatro partes se llena y cambia de color y cada regla se va marcando.",
   "Los segmentos del medidor crecen con scaleX desde la izquierda, escalonados cada 40 ms, y nada cuenta hasta que la contraseña es lo bastante larga."
  ]
 },
 "hold-delete": {
  "title": "Mantener para borrar",
  "trick": "Mantén pulsado para llenar el botón de rojo; suelta antes para cancelar",
  "notes": [
   "Mantener pulsado un botón de borrar hace avanzar un relleno rojo sobre él; soltar antes de tiempo lo hace retroceder de golpe.",
   "El relleno es un clip-path sobre una copia roja, así que la etiqueta se vuelve blanca justo debajo; lineal mientras se mantiene y ease-out rápido al soltar, ambos desde el relleno actual."
  ]
 },
 "bell-badge": {
  "title": "Campana y contador",
  "trick": "Cada aviso nuevo la hace sonar y el contador aparece o sube",
  "notes": [
   "Cada notificación nueva hace sonar la campana y hace saltar o rodar el contador; abrir la campana lo pone a cero.",
   "El timbre es una rotación amortiguada alrededor del gancho de la campana, y el dígito viejo sube y sale mientras entra el nuevo."
  ]
 },
 "toast-stack": {
  "title": "Pila de toasts",
  "trick": "Los mensajes nuevos llegan delante y los anteriores retroceden y se apagan",
  "notes": [
   "Los toasts aparecen abajo a la derecha mientras los antiguos retroceden, más pequeños y más arriba, hasta que el más antiguo se desvanece.",
   "El transform de cada toast depende de su índice en la pila; al descartar el de delante sale deslizándose de lado y el resto avanza, todo con transiciones de transform y opacity."
  ]
 },
 "squash-bounce": {
  "title": "Rebote con aplastamiento y estiramiento",
  "trick": "Toca Añadir a la bolsa y una taza vuela dentro, aplastándose al caer",
  "notes": [
   "Toca Añadir a la bolsa y la miniatura de una taza describe un arco hasta el icono de la bolsa, se aplasta, rebota y cae dentro.",
   "Se estira en el sentido de su velocidad en el aire y se aplasta en el impacto conservando su área; cada rebote conserva una fracción de su energía."
  ]
 },
 "rubber-band": {
  "title": "Arrastre elástico",
  "trick": "Arrastra más allá de la última foto; se resiste y luego vuelve",
  "notes": [
   "Un visor de fotos se desliza más allá de su última foto, resistiéndose cada vez más, y vuelve con un muelle al soltar.",
   "Dentro del álbum la foto sigue al dedo 1:1; pasado el final, la fórmula de rubber-band de Apple reduce el seguimiento, y el muelle de vuelta arranca con la velocidad con la que se suelta."
  ]
 },
 "pendulum-wave": {
  "title": "Onda de péndulos",
  "trick": "Pesos luminosos se desacompasan, serpentean y vuelven a alinearse",
  "notes": [
   "Una fila de péndulos luminosos pasa del unísono a ondas viajeras y serpientes, y vuelve a alinearse.",
   "Cada péndulo oscila una vez más por ciclo que su vecino: ángulo = A·cos(2π·n·t / ciclo), con longitud ∝ 1 / frecuencia²."
  ]
 },
 "verlet-rope": {
  "title": "Cuerda Verlet",
  "trick": "Tira del cordón de la lámpara para encenderla, o dale un golpe para que se balancee",
  "notes": [
   "El cordón de una lámpara se balancea y da latigazos; un tirón enciende o apaga la luz.",
   "La integración de Verlet mueve cada punto según su último movimiento más la gravedad, y unas pocas pasadas de restricciones por fotograma restauran las longitudes de reposo entre vecinos; el interruptor es un muelle rígido."
  ]
 },
 "ball-collisions": {
  "title": "Colisiones de bolas",
  "trick": "Toca una burbuja para agrandarla y ver cómo aparta a las demás",
  "notes": [
   "Burbujas de temas se apiñan, y cada toque hace crecer una con un muelle para que aparte a las demás.",
   "Las burbujas se atraen suavemente hacia el centro; los solapamientos se separan según la masa, y las parejas que chocan intercambian velocidad a lo largo de la línea entre centros, con restitución inferior a 1."
  ]
 },
 "bottom-sheet": {
  "title": "Hoja inferior con puntos de anclaje",
  "trick": "Lanza el panel del mapa y salta a la parada más cercana",
  "notes": [
   "Una hoja de mapa con cafeterías cercanas se lanza entre las alturas de vistazo, media y completa.",
   "Al soltar, suma a su posición una breve proyección de su velocidad, elige el punto de anclaje más cercano y va hacia él con un muelle a esa velocidad; pasados los extremos, hace rubber-band."
  ]
 },
 "swipe-dismiss": {
  "title": "Deslizar para descartar",
  "trick": "Desliza una notificación fuera y las demás cierran el hueco",
  "notes": [
   "Las notificaciones lanzadas se van mientras el resto sube con un muelle para llenar el hueco; una arrastrada hacia atrás vuelve de golpe.",
   "La tarjeta sigue al dedo 1:1; si se suelta lo bastante lejos o rápido conserva su velocidad y se va; si no, un muelle la devuelve a su sitio."
  ]
 },
 "chat-heads": {
  "title": "Burbujas de chat",
  "trick": "Arrastra las burbujas; te siguen en cadena y se acoplan a un borde",
  "notes": [
   "Una pila de burbujas de chat arrastrada sigue a la primera y, al soltarla, vuela al borde más cercano.",
   "Cada burbuja es un muelle 2D que apunta a la burbuja de delante, así que el retraso se acumula a lo largo de la cadena; la velocidad del lanzamiento elige el borde donde se acopla."
  ]
 },
 "icon-jelly": {
  "title": "Icono de app de gelatina",
  "trick": "Arrástralo a otro hueco; se estira y tiembla al posarse",
  "notes": [
   "Un icono de app con pulsación larga se arrastra a otra posición, estirándose por el camino y tambaleándose al llegar.",
   "La posición y la forma son muelles separados: el muelle de forma persigue la velocidad del arrastre, así que el icono se estira a lo largo de su trayectoria y se pasa de redondo al detenerse."
  ]
 },
 "pull-refresh": {
  "title": "Tirar para actualizar",
  "trick": "Tira de la bandeja hacia abajo; se resiste, espera y vuelve",
  "notes": [
   "Al tirar hacia abajo de una bandeja de entrada crece un spinner; la lista se queda en un estante y luego entra el correo nuevo.",
   "El tirón sigue una curva de rubber-band, así que la resistencia aumenta con la distancia; pasado el umbral, el desplazamiento va con un muelle a un estante de 56 px y vuelve a 0 al terminar."
  ]
 },
 "shape-morph": {
  "title": "Transformación de formas",
  "trick": "Las portadas se funden en el contorno y el color de la siguiente canción",
  "notes": [
   "Al saltar de pista, la portada del álbum se transforma en la forma y el color de la siguiente mientras el título hace un fundido cruzado.",
   "Cada forma se guarda como 160 distancias desde el centro en ángulos fijos, así que cualquier forma se mezcla con otra punto a punto; un radio medio igual mantiene estable el área."
  ]
 },
 "icon-morph": {
  "title": "Transformación de iconos",
  "trick": "Toca y una flecha de descarga se vuelve un check, una lista una cuadrícula",
  "notes": [
   "Una flecha de descarga se pliega en una marca al guardar, y las barras de un icono de lista se reagrupan en una cuadrícula.",
   "La flecha y la marca tienen el mismo número de puntos, así que se mezclan punto a punto; el cambio de vista mezcla la posición y el tamaño de cada rectángulo."
  ]
 },
 "gooey": {
  "title": "Gotas viscosas",
  "trick": "Toca el botón de añadir y sus acciones brotan como un líquido",
  "notes": [
   "El botón de añadir de una app de notas exuda sus acciones una a una y las vuelve a absorber.",
   "Los círculos se desenfocan juntos y luego un filtro SVG de matriz de color dispara el contraste del alfa, convirtiendo el solapamiento suave en un puente líquido nítido; los iconos quedan por encima del filtro."
  ]
 },
 "line-draw": {
  "title": "Línea que se dibuja",
  "trick": "Los trazos de un gráfico recorren la semana, uno justo después del otro",
  "notes": [
   "Dos líneas en una tarjeta de analítica trazan la semana de izquierda a derecha, la segunda justo después de la primera.",
   "Iguala la longitud del guion y su desplazamiento al getTotalLength() del trazado y luego anima el desplazamiento a cero para que la línea se dibuje sola."
  ]
 },
 "liquid-button": {
  "title": "Botón líquido",
  "trick": "Pasa por encima y su borde ondula; pulsa para apretarlo",
  "notes": [
   "El borde del botón Realizar pedido ondula como un líquido al pasar el puntero y se comprime al pulsarlo.",
   "El contorno es un anillo de puntos, cada uno devuelto por un muelle al rectángulo redondeado; los vecinos comparten su desplazamiento, así que un empujón recorre el borde como una onda."
  ]
 },
 "play-pause": {
  "title": "De reproducir a pausa",
  "trick": "Toca y el triángulo se parte y se desliza en dos barras",
  "notes": [
   "Un triángulo de reproducir se divide en dos mitades que se deslizan directamente hasta las barras de pausa, y vuelta.",
   "El triángulo se corta en dos formas de cuatro puntos que corresponden a las dos barras de cuatro puntos, así que cada punto tiene pareja; la transformación usa ease-in-out."
  ]
 },
 "menu-close": {
  "title": "De menú a cerrar",
  "trick": "Toca y tres líneas se pliegan en una X mientras se abre el panel",
  "notes": [
   "Tres líneas se pliegan en una X y el panel del menú se despliega hacia abajo con sus enlaces llegando por turnos.",
   "Las líneas exteriores giran hasta las diagonales mientras la del medio se colapsa; un ligero giro disimula los fotogramas intermedios, y el panel usa un barrido de clip-path."
  ]
 },
 "chart-morph": {
  "title": "Transformación de gráfico",
  "trick": "Toca un periodo y la línea fluye hacia los nuevos datos",
  "notes": [
   "Cambiar entre semana, mes y trimestre transforma el gráfico de líneas y su área en los nuevos datos.",
   "Cada periodo se remuestrea a los mismos 48 puntos, así que cualquier periodo se mezcla con otro punto a punto; la línea, el área y el punto final comparten esos puntos."
  ]
 },
 "logo-draw": {
  "title": "Logotipo que se dibuja",
  "trick": "Una marca se traza como con una pluma y luego se rellena",
  "notes": [
   "Un logotipo se dibuja trazo a trazo y luego se rellena mientras el nombre sube letra a letra.",
   "Cada trazo recibe un guion tan largo como él mismo, desplazado en la misma cantidad, y luego animado a cero; los escalonados solapados hacen que se lea como una sola mano dibujando."
  ]
 },
 "button-menu": {
  "title": "De botón a menú",
  "trick": "Toca Compartir y se abre en una lista de opciones",
  "notes": [
   "Un botón Compartir se abre en su menú como una única superficie oscura y luego se cierra de nuevo en el botón.",
   "Un clip-path inset con esquinas redondeadas muestra solo la esquina del tamaño del botón y luego se abre al menú completo; los elementos siguen con un breve escalonado y son los primeros en irse."
  ]
 },
 "wave-collapse": {
  "title": "Colapso de función de onda",
  "trick": "Un mapa de islas se rellena solo; arrastra para borrar una zona y que vuelva a crecer",
  "notes": [
   "Un mapa de islas se escribe solo: las celdas sin resolver son todos los terrenos a la vez hasta que el algoritmo elige uno, y de ahí crecen costas, playas y crestas. Mantén pulsado y arrastra para disolver una zona y verla rehacerse.",
   "Las vecinas solo pueden diferir en un escalón de terreno. Colapsa la celda de menor entropía, sus vecinas pierden lo que ya no pueden ser, y una contradicción se repara disolviendo la zona de alrededor."
  ]
 },
 "mud-cracks": {
  "title": "Grietas de barro",
  "trick": "La arcilla mojada se seca en placas curvadas; arrastra para volver a mojar una zona",
  "notes": [
   "La arcilla húmeda y brillante se seca de forma desigual y se parte en placas de bordes curvados; las grietas se ensanchan al encogerse. Luego la lluvia la empapa y se cierran. Mantén pulsado y arrastra para mojar una zona.",
   "Al encoger por igual, la arcilla se rompe en polígonos, así que la red es un diagrama de Voronoi deformado con ruido; cada pared se abre desde el centro cuando se seca su zona, y una transformada de distancia sombrea huecos y bordes."
  ]
 }
};

// slider labels, keyed by the English label in anims/registry.js
export const LABELS = {
 "Seconds between drops": "Segundos entre gotas",
 "Magnet": "Imán",
 "On": "Encendido",
 "Off": "Apagado",
 "Vein density": "Densidad de venas",
 "Backlight": "Contraluz",
 "Plate size": "Tamaño de placa",
 "Cells per frame": "Celdas por fotograma",
 "Land": "Tierra",
 "Speed (1 = real time)": "Velocidad (1 = real)",
 "Amplitude (°)": "Amplitud (°)",
 "Size": "Tamaño",
 "Blades": "Briznas",
 "Gusts": "Ráfagas",
 "Wind (m/s)": "Viento (m/s)",
 "Choppiness": "Picado",
 "Sun height (°)": "Altura del sol (°)",
 "Loops per second": "Bucles por segundo",
 "Growth": "Crecimiento",
 "Fold spacing": "Separación de pliegues",
 "Dust": "Polvo",
 "Sun": "Sol",
 "Population": "Población",
 "Hold": "Pausa",
 "Flakes": "Copos",
 "Shake every (s)": "Agitar cada (s)",
 "Turn every (s)": "Pasar cada (s)",
 "Half twists": "Medias vueltas",
 "Band width": "Ancho de la cinta",
 "Fold": "Plegado",
 "Letter": "Carta",
 "Gate": "Ventana",
 "Accordion": "Acordeón",
 "Map": "Mapa",
 "4D perspective": "Perspectiva 4D",
 "Actions": "Acciones",
 "Activity": "Actividad",
 "Afterglow": "Resplandor",
 "Air drag": "Resistencia aire",
 "Amplitude": "Amplitud",
 "Angle (°)": "Ángulo (°)",
 "Aperture blades (0 = round)": "Láminas (0 = redondo)",
 "Arcs": "Arcos",
 "Arm twist": "Giro de brazos",
 "Arms": "Brazos",
 "Atoms": "Átomos",
 "Backdrop": "Fondo",
 "Balls": "Bolas",
 "Bands": "Bandas",
 "Bar duration (ms)": "Duración barra (ms)",
 "Bar follow": "Seguimiento barra",
 "Bars": "Barras",
 "Beads": "Cuentas",
 "Beads per second": "Cuentas por segundo",
 "Big circle": "Círculo mayor",
 "Birds": "Pájaros",
 "Blobs": "Gotas",
 "Blur": "Desenfoque",
 "Blur (px)": "Desenfoque (px)",
 "Boils / second": "Temblores / segundo",
 "Boost": "Impulso",
 "Bounce": "Rebote",
 "Branching": "Ramificación",
 "Breathing": "Respiración",
 "Brightness": "Brillo",
 "Bubbles": "Burbujas",
 "Build rate": "Ritmo de trazado",
 "Bursts / second": "Ráfagas / segundo",
 "Camera height": "Altura cámara",
 "Cap gravity": "Gravedad picos",
 "Cell (px)": "Celda (px)",
 "Cell size": "Tamaño celda",
 "Cell width (px)": "Ancho celda (px)",
 "Cells across": "Celdas a lo ancho",
 "Centre spread": "Apertura central",
 "Characters / second": "Caracteres / segundo",
 "Clock spread": "Dispersión relojes",
 "Cloth resolution": "Resolución tela",
 "Cloud cover": "Nubosidad",
 "Cohesion": "Cohesión",
 "Column delay (ms)": "Retardo columna (ms)",
 "Columns": "Columnas",
 "Comb": "Peine",
 "Contacts": "Contactos",
 "Contour levels": "Curvas de nivel",
 "Cooling": "Enfriamiento",
 "Coupling": "Acoplamiento",
 "Crease shading": "Sombra pliegues",
 "Crouch depth": "Agachado",
 "Curl": "Rizo",
 "Cursor pull": "Atracción cursor",
 "Curtains": "Cortinas",
 "Curvature": "Curvatura",
 "Cycle (s)": "Ciclo (s)",
 "Cycle speed": "Velocidad ciclo",
 "Damping": "Amortiguación",
 "Decay": "Decaimiento",
 "Delay per cell (ms)": "Retardo celda (ms)",
 "Density": "Densidad",
 "Depth": "Profundidad",
 "Detail": "Detalle",
 "Dim": "Atenuar",
 "Disk speed": "Velocidad disco",
 "Dispersion": "Dispersión",
 "Distance": "Distancia",
 "Dot pitch (px)": "Paso de punto (px)",
 "Dots": "Puntos",
 "Dots per column": "Puntos por columna",
 "Draw (ms)": "Trazo (ms)",
 "Drift": "Deriva",
 "Drips": "Goteos",
 "Drones": "Drones",
 "Drop every (s)": "Caída cada (s)",
 "Drop size": "Tamaño gota",
 "Duration (ms)": "Duración (ms)",
 "Dye persistence": "Persistencia tinte",
 "Ease": "Suavizado",
 "Echoes": "Ecos",
 "Edge sensitivity": "Sensib. bordes",
 "Embers": "Brasas",
 "Enter (ms)": "Entrada (ms)",
 "Exit (ms)": "Salida (ms)",
 "Exposure": "Exposición",
 "Falcon attacks": "Ataques halcón",
 "Feed": "Alimentación",
 "Field lines": "Líneas de campo",
 "Field scale": "Escala campo",
 "Filings": "Limaduras",
 "Film thickness": "Grosor película",
 "Fire (dispersion)": "Fuego (dispersión)",
 "Fireflies": "Luciérnagas",
 "Flame height": "Altura llama",
 "Flap time (ms)": "Giro de pala (ms)",
 "Flight speed": "Velocidad vuelo",
 "Flow": "Flujo",
 "Flow speed": "Velocidad flujo",
 "Focus pull": "Cambio de foco",
 "Foil": "Lámina",
 "Fold angle (°)": "Ángulo pliegue (°)",
 "Folds": "Pliegues",
 "Follow": "Seguimiento",
 "Force": "Fuerza",
 "Frames": "Fotogramas",
 "Frequency": "Frecuencia",
 "Gain": "Ganancia",
 "Gap (ms)": "Pausa (ms)",
 "Gas density": "Densidad gas",
 "Generations / s": "Generaciones / s",
 "Gloss": "Brillo",
 "Glow": "Resplandor",
 "Glyph size": "Tamaño glifo",
 "Grain size": "Tamaño grano",
 "Gravity": "Gravedad",
 "Grid (agents = grid²)": "Cuadrícula (agentes = lado²)",
 "Grid (grains = grid²)": "Cuadrícula (granos = lado²)",
 "Grid (particles = grid²)": "Cuadrícula (partículas = lado²)",
 "Grid (particles = size²)": "Cuadrícula (partículas = tamaño²)",
 "Grid lines": "Líneas cuadrícula",
 "Growth speed": "Crecimiento",
 "Harmonics": "Armónicos",
 "Hatch density": "Densidad trama",
 "Heart rate": "Pulso",
 "Heat": "Calor",
 "Heat persistence": "Persistencia calor",
 "Height": "Altura",
 "Hold (ms)": "Pausa (ms)",
 "Hold (s)": "Pausa (s)",
 "Holographic sheen": "Brillo holográfico",
 "Hop height": "Altura salto",
 "Hue": "Tono",
 "Index of refraction": "Índice refracción",
 "Inflation": "Inflado",
 "Ink load": "Carga de tinta",
 "Intensity": "Intensidad",
 "Item stagger (ms)": "Desfase elemento (ms)",
 "Iterations": "Iteraciones",
 "Iterations ×": "Iteraciones ×",
 "Jelly": "Gelatina",
 "Jelly hue": "Tono gelatina",
 "Jitter": "Temblor",
 "Jump ratio": "Razón de salto",
 "Kill": "Eliminación",
 "Landing overshoot": "Rebote aterrizaje",
 "Launch rate": "Ritmo lanzamiento",
 "Layers": "Capas",
 "Lean": "Inclinación",
 "Levels": "Niveles",
 "Lift": "Elevación",
 "Lights": "Luces",
 "Line width": "Grosor línea",
 "Lines": "Líneas",
 "Link distance": "Distancia enlace",
 "Link stagger (ms)": "Desfase enlace (ms)",
 "Magnet strength": "Fuerza imán",
 "Magnetic field": "Campo magnético",
 "Magnify": "Ampliación",
 "Max scale": "Escala máx.",
 "Max tilt (deg)": "Inclin. máx. (deg)",
 "Meter (ms)": "Medidor (ms)",
 "Mirrors": "Espejos",
 "Mist": "Neblina",
 "Morph (ms)": "Morfismo (ms)",
 "Morph (s)": "Morfismo (s)",
 "Move (ms)": "Movimiento (ms)",
 "Neck smoothness": "Suavidad cuello",
 "Nudge every (ms)": "Empujón cada (ms)",
 "Number swap (ms)": "Cambio número (ms)",
 "Page scale": "Escala página",
 "Panels": "Paneles",
 "Parallax": "Paralaje",
 "Particles": "Partículas",
 "Pause between gifts (ms)": "Pausa entre regalos (ms)",
 "Pen offset": "Desfase lápiz",
 "Pen speed (px/ms)": "Velocidad lápiz (px/ms)",
 "Pendulums": "Péndulos",
 "Persistence": "Persistencia",
 "Perspective (px)": "Perspectiva (px)",
 "Phase drift": "Deriva de fase",
 "Phosphor mask": "Máscara fósforo",
 "Pieces": "Piezas",
 "Pins across": "Agujas a lo ancho",
 "Pixel size": "Tamaño píxel",
 "Planets": "Planetas",
 "Pointer bloom": "Bloom del puntero",
 "Points": "Puntos",
 "Points (millions/frame)": "Puntos (millones/fotograma)",
 "Pop (ms)": "Aparición (ms)",
 "Pour": "Vertido",
 "Pour rate": "Ritmo vertido",
 "Power": "Potencia",
 "Power drift": "Deriva potencia",
 "Pressure": "Presión",
 "Pull": "Atracción",
 "Pulses": "Pulsos",
 "Push": "Empuje",
 "Radius (px)": "Radio (px)",
 "Rain": "Lluvia",
 "Range": "Alcance",
 "Range (px)": "Alcance (px)",
 "Rays": "Rayos",
 "Reading line": "Línea lectura",
 "Refraction": "Refracción",
 "Relief depth": "Profundidad relieve",
 "Resistance": "Resistencia",
 "Restitution": "Restitución",
 "Return stiffness": "Rigidez retorno",
 "Reynolds number": "Número de Reynolds",
 "Ring (ms)": "Timbre (ms)",
 "Ring glow": "Brillo anillo",
 "Rings": "Anillos",
 "Ripple": "Onda",
 "Ripple depth": "Profundidad onda",
 "Ripples": "Ondas",
 "Roll (ms)": "Giro (ms)",
 "Rows": "Filas",
 "Scale": "Escala",
 "Seam glow": "Brillo juntas",
 "Seeds": "Semillas",
 "Segments": "Segmentos",
 "Sensor angle": "Ángulo sensor",
 "Shade per card": "Sombra por tarjeta",
 "Shake": "Sacudida",
 "Shards": "Fragmentos",
 "Share that changes": "Proporción cambia",
 "Shear": "Cizalla",
 "Sheen bands": "Bandas de brillo",
 "Shimmer speed": "Velocidad destello",
 "Show speed": "Velocidad show",
 "Shrink per card": "Reducción por tarjeta",
 "Shrink per toast": "Reducción por aviso",
 "Side card shrink": "Reducción laterales",
 "Sides": "Lados",
 "Sides per tile": "Lados por pieza",
 "Skew": "Sesgo",
 "Slant (°)": "Inclinación (°)",
 "Slide (ms)": "Deslizar (ms)",
 "Slosh": "Vaivén",
 "Small circle": "Círculo menor",
 "Smoke lines": "Líneas de humo",
 "Snap (ms)": "Ajuste (ms)",
 "Snap back (ms)": "Retorno (ms)",
 "Softness": "Suavidad",
 "Sort passes / frame": "Pasadas / fotograma",
 "Sources": "Fuentes",
 "Sparks": "Chispas",
 "Species": "Especies",
 "Speed": "Velocidad",
 "Speed (°/s)": "Velocidad (°/s)",
 "Spikes": "Púas",
 "Spin": "Giro",
 "Splat radius": "Radio salpicadura",
 "Spread": "Dispersión",
 "Spring damping": "Amortig. resorte",
 "Spring stiffness": "Rigidez resorte",
 "Squash": "Aplastamiento",
 "Stagger (ms)": "Desfase (ms)",
 "Stars": "Estrellas",
 "Start scale": "Escala inicial",
 "Start spread (mrad)": "Dispersión inicial (mrad)",
 "Starting beads": "Cuentas iniciales",
 "Steering": "Dirección",
 "Step (ms)": "Paso (ms)",
 "Step (px)": "Paso (px)",
 "Steps / frame": "Pasos / fotograma",
 "Steps per letter": "Pasos por letra",
 "Stickiness": "Adherencia",
 "Stiffness": "Rigidez",
 "Strength": "Fuerza",
 "Stretch": "Estiramiento",
 "Strikes / second": "Rayos / segundo",
 "Stripe flow": "Flujo franjas",
 "Stroke (px)": "Trazo (px)",
 "Stroke stagger (ms)": "Desfase trazo (ms)",
 "Sun height": "Altura sol",
 "Surface glow": "Brillo superficie",
 "Swap (ms)": "Cambio (ms)",
 "Sweep (±°)": "Barrido (±°)",
 "Sweep speed": "Velocidad barrido",
 "Swing (deg)": "Oscilación (deg)",
 "Swirl": "Remolino",
 "Swirl strength": "Fuerza remolino",
 "Table tilt (deg)": "Inclin. mesa (deg)",
 "Tap rate": "Ritmo golpes",
 "Tempo": "Tempo",
 "Terrain scale": "Escala terreno",
 "Text delay (ms)": "Retardo texto (ms)",
 "Thickness": "Grosor",
 "Thread (px)": "Hilo (px)",
 "Threshold": "Umbral",
 "Throw (ms)": "Lanzamiento (ms)",
 "Tiles": "Baldosas",
 "Tiles across": "Piezas a lo ancho",
 "Tiles per corner": "Piezas por esquina",
 "Tilt": "Inclinación",
 "Tones": "Tonos",
 "Trail decay": "Decaimiento estela",
 "Trail length": "Longitud estela",
 "Trailing lag (ms)": "Retraso estela (ms)",
 "Tray tilt": "Inclin. bandeja",
 "Tube thickness": "Grosor tubo",
 "Tubes": "Tubos",
 "Turbulence": "Turbulencia",
 "Turns": "Vueltas",
 "Turntable speed": "Velocidad plato",
 "Twist": "Torsión",
 "Typing (ms per key)": "Tecleo (ms/tecla)",
 "Unzipping": "Desenrollado",
 "Viscosity": "Viscosidad",
 "Vortices": "Vórtices",
 "Wall scale": "Escala paredes",
 "Warp": "Distorsión",
 "Water share": "Proporción agua",
 "Wave strength": "Fuerza ola",
 "Waves": "Ondas",
 "Waves (symmetry)": "Ondas (simetría)",
 "Waves per height": "Ondas por altura",
 "Wind": "Viento",
 "Wobble": "Bamboleo",
 "Yarn relief": "Relieve hilo",
 "Zoom": "Zoom",
 "p (turns around)": "p (vueltas alrededor)",
 "q (turns through)": "q (vueltas a través)",
 "Background": "Fondo",
 "Dark": "Oscuro",
 "Clear": "Transparente"
};
