// French text for each animation: { id: { title, trick, notes } }. Missing ids fall back to English (js/i18n.js).
export const FR = {
 "snowflake": {
  "title": "Flocon de neige",
  "trick": "Gravner–Griffeath : la vapeur diffuse et gèle selon les voisins",
  "notes": [
   "La vapeur diffuse sur un réseau hexagonal ; un site du bord gèle quand sa couche liquide est assez épaisse, et les pointes dépassent les faces et se ramifient.",
   "Chaque boucle fait pousser un cristal différent parmi quatre jeux de paramètres ; size règle le grossissement, speed la vitesse de croissance."
  ]
 },
 "meadow": {
  "title": "Prairie",
  "trick": "Brins instanciés pliés par des rafales qui traversent le champ avec le vent",
  "notes": [
   "Un coteau d’herbes hautes à l’heure dorée : les rafales le parcourent en vagues qu’on peut suivre, et les brins s’illuminent là où le soleil bas les traverse. Déplacez le pointeur pour tourner le vent.",
   "Soixante mille brins partagent une même bande qui se plie ; chacun penche selon le vent à sa racine, une poussée constante plus des bandes de bruit qui avancent avec le vent, si bien que chaque rafale traverse le champ."
  ]
 },
 "ocean": {
  "title": "Pleine mer",
  "trick": "Océan FFT issu d’un spectre JONSWAP à large dispersion directionnelle ; écume là où la surface se replie",
  "notes": [
   "Une mer ouverte, grise et ventée, sous un ciel couvert : quatre FFT sur le GPU transforment à chaque image un spectre JONSWAP à large dispersion directionnelle en vagues de Gerstner, et l’écume naît là où la surface se replie et s’étire en traînées sous le vent.",
   "Le vent règle la hauteur des vagues et la fréquence des moutons, le clapot affûte les crêtes, le soleil est la hauteur du soleil caché derrière les nuages ; le pointeur déplace sa tache claire le long de l’horizon."
  ]
 },
 "honey-coil": {
  "title": "Miel versé",
  "trick": "Enroulement de corde liquide : boucles empilées qui s’enfoncent dans un dôme",
  "notes": [
   "Chaque nouvelle boucle est un tube posé sur celle du dessous ; elle s’enfonce, fond dans un champ de hauteurs et s’étale selon l’équation des films minces.",
   "Flow règle l’épaisseur du filet, loops les boucles par seconde, spread la vitesse d’affaissement du dôme ; faites glisser le pointeur pour coudre des boucles."
  ]
 },
 "diff-growth": {
  "title": "Croissance différentielle",
  "trick": "Repousser, aligner, couper les arêtes étirées : une ligne qui pousse se plisse",
  "notes": [
   "Une fine ligne d’encre pousse plus que le papier ne le permet et se plisse vers l’extérieur en un labyrinthe ramifié, avec des contours imbriqués à l’intérieur ; l’encre passe du bleu profond au vieux centre au vermillon sur le bord le plus neuf.",
   "Les nœuds repoussent leurs voisins proches, rejoignent le milieu de leurs deux voisins et coupent les arêtes étirées. Croissance règle la fréquence ; Espacement, la largeur des plis."
  ]
 },
 "stained-glass": {
  "title": "Vitrail",
  "trick": "Remonter la lumière jusqu’à une fonction de verre : taches colorées et rayons de poussière",
  "notes": [
   "Le soleil traverse une rangée de vitraux au plomb enchâssés dans les murs épais de la nef : des rayons colorés dans l’air poussiéreux et des taches sur les dalles polies qui glissent avec lui.",
   "Le vitrail est une fonction qui renvoie la couleur du verre ou le plomb ; le sol et chaque pas dans l’air la consultent le long de la lumière. Déplacez le pointeur pour bouger le soleil."
  ]
 },
 "lenia": {
  "title": "Lenia",
  "trick": "Convolution par noyau en anneau et cloche de croissance : Lenia, quatre espèces",
  "notes": [
   "De vraies créatures du catalogue Lenia de Bert Chan glissent, tournent, se heurtent et cicatrisent dans une goutte sous un microscope à fluorescence ; bougez pour faire la mise au point, glissez pour blesser.",
   "Chaque cellule fait la moyenne de ses voisines à travers un anneau doux, puis croît ou s’efface selon une cloche. Vitesse règle les pas par image ; Population, combien vivent."
  ]
 },
 "dynamic-island": {
  "title": "Île dynamique",
  "trick": "Une boîte noire découpée par trois ressorts : largeur, hauteur et rayon",
  "notes": [
   "Sur l’écran verrouillé, la pilule autour de la caméra devient un appel, sa minuterie, un lecteur de musique et un compte à rebours. Touchez-la pour ouvrir ou fermer le lecteur.",
   "La forme est un clip-path dont la largeur, la hauteur et le rayon sont des ressorts : elle dépasse un peu puis se pose, et tout changement la relance d’où elle est ; le contenu sort vite et entre un instant après, avec un court flou."
  ]
 },
 "snow-globe": {
  "title": "Boule à neige",
  "trick": "Une scène en ray marching vue à travers l’eau qui réfracte, avec de la neige qui se dépose",
  "notes": [
   "Une boule à neige remplie d’eau sur un socle tourné en noyer, avec une cabane en rondins sous la lune, des sapins enneigés, un bonhomme de neige et un réverbère ; de temps en temps on la secoue et la neige tourbillonne puis retombe. Faites-la glisser de côté pour la secouer.",
   "La scène est rendue par ray marching après que chaque rayon s’est courbé en entrant dans l’eau à travers le verre, elle paraît donc agrandie et s’enroule au bord ; les fenêtres projettent des flaques de lumière retracées à travers leurs ouvertures, et chaque flocon est placé en cherchant le rayon de l’œil qui se réfracte jusqu’à lui, si bien qu’il se cache derrière la cabane et les arbres."
  ]
 },
 "page-turn": {
  "title": "Tourner la page",
  "trick": "Chaque rangée pliée depuis le dos en courts segments : le papier ne s’étire jamais",
  "notes": [
   "Un livre ouvert tourne ses propres pages : chacune se soulève par le coin inférieur, se courbe par-dessus le dos et retombe. Faites glisser la page de droite pour la tourner vous-même.",
   "Chaque rangée de la page est une chaîne de courts segments, un peu plus inclinés vers le bord, si bien qu’elle se courbe sans s’étirer ; son ombre est projetée sur les pages du dessous."
  ]
 },
 "type-ribbon": {
  "title": "Ruban typographique",
  "trick": "Du texte sur un ruban de Möbius, orienté par transport parallèle",
  "notes": [
   "Un ruban de lettres grasses se tord dans l’espace en ruban de Möbius, et les mots le parcourent sans fin, reflétés dans un sol brillant.",
   "Le ruban suit le chemin sans tourner sur lui-même, puis reçoit exactement un demi-tour par tour, si bien que la ligne de texte couvre les deux faces en deux tours. Essayez 3 ou 5 demi-tours."
  ]
 },
 "curl-flow": {
  "title": "Champ de flux en bruit curl",
  "trick": "Bruit curl à divergence nulle : les particules ne s’agglutinent jamais",
  "notes": [
   "Les particules tourbillonnent en courants fluides qui laissent de douces traînées sans jamais s’amasser.",
   "Chaque particule suit le rotationnel d’un champ de bruit, sans sources ni puits ; un remplissage translucide à chaque image, au lieu d’un effacement, conserve les traînées."
  ]
 },
 "drone-show": {
  "title": "Spectacle de drones",
  "trick": "Changements de formation résolus comme un problème d’affectation : trier, puis échanger",
  "notes": [
   "Une flotte de drones décolle d’une barge et dessine des formations au-dessus d’une ville nocturne, reflétée dans la baie.",
   "Les positions de chaque formation sont attribuées aux drones par un tri par bandes, puis des échanges aléatoires ne sont gardés que s’ils raccourcissent le vol total, si bien qu’aucune trajectoire ne se croise."
  ]
 },
 "particle-life": {
  "title": "Vie de particules",
  "trick": "Table d’attraction asymétrique entre espèces : des amas quasi vivants émergent",
  "notes": [
   "Des particules colorées s’auto-organisent en cellules, en vers et en essaims chasseurs qui se dissolvent et se reforment ; faites glisser pour remuer.",
   "Chaque paire d’espèces s’attire ou se repousse selon une entrée d’une petite table asymétrique : le rouge peut chasser le vert pendant que le vert fuit ; les voisins sont trouvés via une grille."
  ]
 },
 "cloud-chamber": {
  "title": "Chambre à brouillard",
  "trick": "Traces de particules dessinées en traînées de gouttelettes qui gonflent, dérivent et s’estompent",
  "notes": [
   "Des traces de gouttelettes apparaissent dans une chambre brumeuse : courts traits droits des particules alpha, électrons en spirale et longues lignes de muons.",
   "Chaque trace est une liste de gouttelettes qui gonflent, dérivent et s’estompent ; les électrons bêta diffusent et s’enroulent dans le champ magnétique, en se resserrant à mesure qu’ils ralentissent."
  ]
 },
 "galaxy": {
  "title": "Galaxie spirale",
  "trick": "Étoiles sur des bras en spirale logarithmique, rotation différentielle et lumière additive",
  "notes": [
   "Une galaxie spirale tourne lentement, ses bras s’enroulant tandis que le noyau brillant s’épanouit.",
   "Les étoiles sont placées sur des bras en spirale logarithmique et dispersées pour que les bras se lisent comme une densité ; une courbe de rotation plate les enroule et les points additifs font briller le noyau."
  ]
 },
 "strange-attractor": {
  "title": "Attracteur étrange",
  "trick": "Particules qui intègrent l’attracteur d’Aizawa, avec traînées par canvas qui s’estompe",
  "notes": [
   "Des milliers de particules lumineuses parcourent l’attracteur d’Aizawa, une coque en forme de pomme traversée d’un axe, pendant que la caméra tourne.",
   "Les particules sont intégrées à chaque image avec les trois équations d’Aizawa puis projetées en 3D ; estomper légèrement le canvas au lieu de l’effacer laisse les traînées."
  ]
 },
 "physarum": {
  "title": "Un myxomycète cartographie Tokyo",
  "trick": "Détecter, tourner, avancer, déposer : des agents tracent des réseaux qui se renforcent",
  "notes": [
   "Un myxomycète tisse un réseau entre les villes autour de Tokyo, qui se resserre en lignes principales.",
   "Chaque agent sonde la piste devant à gauche, devant et devant à droite, tourne vers la plus forte et en dépose davantage ; la piste diffuse et s’atténue, si bien que seules les routes empruntées survivent."
  ]
 },
 "lightning": {
  "title": "Arcs électriques",
  "trick": "Déplacement du point médian, branches récursives, halo et rémanence",
  "notes": [
   "Des éclairs ramifiés frappent, refrappent en rafale et laissent une rémanence lumineuse.",
   "Déplacement du point médian : le milieu de chaque segment est poussé de côté au hasard et les moitiés sont à nouveau divisées, avec des fourches ; un trait large et flou sous un cœur blanc fin donne le halo."
  ]
 },
 "iron-filings": {
  "title": "Limaille de fer",
  "trick": "Des segments s’alignent sur le champ d’un aimant droit et sautent sur ses lignes de flux",
  "notes": [
   "Des limailles d’acier sur une feuille, au-dessus d’un aimant droit caché, sautent à chaque tapotement et se rangent en boucles classiques d’un pôle à l’autre ; faites glisser l’aimant.",
   "Chaque limaille s’aligne sur le champ local et est attirée vers la ligne de niveau la plus proche de la fonction de flux de l’aimant : la somme de la charge de chaque pôle multipliée par le cosinus de son angle avec l’axe du barreau."
  ]
 },
 "galton-board": {
  "title": "Planche de Galton",
  "trick": "Un pile ou face par bille, qui s’empile en courbe en cloche binomiale",
  "notes": [
   "Des billes tombent entre des clous en laiton et s’empilent en courbe en cloche, épousant la courbe théorique en pointillés.",
   "Chaque rangée est à peu près un pile ou face, donc les points d’arrivée suivent une loi binomiale ; les billes sont de vrais corps qui rebondissent et s’empilent grâce à un hachage spatial."
  ]
 },
 "pin-art": {
  "title": "Pin art",
  "trick": "Des aiguilles instanciées qui ne font qu’avancer, si bien que les empreintes restent",
  "notes": [
   "Une main, un visage et une onde surgissent en relief à travers des aiguilles d’acier ; appuyez pour les repousser.",
   "Des cylindres instanciés à tête bombée ne bougent que vers l’avant, si bien que les empreintes restent jusqu’à ce qu’un balayage les efface ; une lumière rasante fait que les aiguilles hautes ombrent les plus basses."
  ]
 },
 "confetti": {
  "title": "Confettis en papier 3D",
  "trick": "Écraser par cos(rotation) pour simuler une culbute 3D, couleur recto verso",
  "notes": [
   "Des confettis en papier jaillissent de deux canons, culbutent et redescendent en voletant.",
   "Mettre à l’échelle la hauteur de chaque pièce par le cosinus de son angle de rotation simule la culbute 3D, et le signe choisit la couleur du recto ou du verso ; une forte traînée et un battement les font redescendre."
  ]
 },
 "firefly-sync": {
  "title": "Lucioles synchronisées",
  "trick": "Oscillateurs couplés par impulsions : chaque éclair fait avancer un peu les voisines",
  "notes": [
   "Les lucioles d’une forêt finissent par clignoter à l’unisson ; le pointeur effraie les plus proches.",
   "Oscillateurs couplés par impulsions de Mirollo–Strogatz : chaque luciole est une horloge qui clignote puis se réinitialise, et chaque éclair qu’elle voit avance un peu son horloge."
  ]
 },
 "gpu-particles": {
  "title": "Particules GPU (262k)",
  "trick": "Les positions vivent dans une texture float ; un shader les déplace toutes",
  "notes": [
   "Un quart de million de particules s’écoulent dans un bruit curl 3D en filaments lumineux.",
   "Les positions vivent dans une texture float mise à jour par un fragment shader, en ping-pong entre deux textures ; au rendu, chacune est relue avec texelFetch et mélangée de façon additive."
  ]
 },
 "orbitals": {
  "title": "Orbitales de l’hydrogène",
  "trick": "Échantillonnage de Metropolis d’une fonction d’onde exacte, coloré selon la phase",
  "notes": [
   "Un nuage de points montre une orbitale de l’hydrogène, qui ondule en se transformant en la suivante.",
   "Échantillonnage de Metropolis : chaque point propose un pas et le garde avec une probabilité |ψ(new)|² ÷ |ψ(old)|² ; ψ est la solution exacte, colorée selon sa phase complexe."
  ]
 },
 "roche-limit": {
  "title": "Limite de Roche",
  "trick": "Au-delà de la limite de Roche, l’étirement de marée cisaille les débris en anneau",
  "notes": [
   "Une lune de débris spirale vers une géante de glace, se déchire en deux courants et s’enroule en anneau.",
   "Vingt mille particules subissent l’autogravité de la lune et la marée de la planète, qui croît en 1/d³ ; les débris intérieurs orbitent plus vite et cisaillent les courants en anneau."
  ]
 },
 "murmuration": {
  "title": "Murmuration d’étourneaux",
  "trick": "Nuée en 3D où chaque oiseau ne suit que ses sept plus proches voisins",
  "notes": [
   "Une nuée d’étourneaux s’étire et se replie, parcourue de vagues sombres quand un faucon pique.",
   "Des boids qui suivent un nombre fixe de sept plus proches voisins plutôt qu’un rayon, trouvés via une grille de hachage ; la peur passe de voisin en voisin, ce qui crée les vagues."
  ]
 },
 "states-of-matter": {
  "title": "États de la matière",
  "trick": "Atomes de Lennard-Jones et un thermostat : gaz, liquide, cristal",
  "notes": [
   "Les atomes refroidissent du gaz aux gouttelettes, puis à une flaque et à un cristal hexagonal, avant de fondre à nouveau.",
   "Forces de Lennard-Jones entre chaque paire, avec un thermostat qui ramène les vitesses vers une température cible décroissante ; les atomes sont colorés selon leur vitesse et des liaisons relient les voisins proches."
  ]
 },
 "calligraphy": {
  "title": "Pinceau de calligraphie",
  "trick": "Pinceau poil par poil, avec encre propre à chaque poil et traits secs",
  "notes": [
   "Un pinceau écrit 永 trait par trait, avec des stries sèches sur les longs traits et de l’encre accumulée dans les virages.",
   "Le pinceau compte quarante poils dans une empreinte en goutte qui tourne avec le trait et s’élargit avec la pression ; chacun porte sa propre encre et finit par s’assécher."
  ]
 },
 "harmonograph": {
  "title": "Harmonographe",
  "trick": "Sinus amortis additionnés près d’un rapport simple, légèrement désaccordés",
  "notes": [
   "Une plume trace une rosace qui dérive lentement et s’affine à mesure que l’oscillation s’éteint.",
   "La position de la plume est la somme de quatre sinus amortis aux fréquences proches d’un rapport simple comme 2:3 ; le léger désaccord fait précesser les boucles."
  ]
 },
 "chladni": {
  "title": "Plaque de Chladni",
  "trick": "Des grains sur GPU sautent selon la vibration locale et se posent sur les lignes nodales",
  "notes": [
   "Le sable sur une plaque de laiton vibrante forme des figures qui changent à mesure que le son monte.",
   "Chaque grain saute selon l’intensité de la vibration à son emplacement et glisse vers les lignes nodales de l’onde stationnaire ; 65 000 grains vivent dans une texture float sur le GPU."
  ]
 },
 "dla-crystal": {
  "title": "Croissance cristalline (DLA)",
  "trick": "Agrégation limitée par diffusion : des marcheurs aléatoires collent au contact",
  "notes": [
   "Un cristal corallien se ramifie à partir d’un germe jusqu’à remplir la vue.",
   "Agrégation limitée par diffusion : les marcheurs aléatoires collent au premier contact, et les pointes en captent davantage que les creux ; ils partent d’un cercle juste à l’extérieur du cristal."
  ]
 },
 "wind-tunnel": {
  "title": "Soufflerie",
  "trick": "Solveur de Boltzmann sur réseau en GPU qui lâche une allée de tourbillons de Kármán",
  "notes": [
   "Des filets de fumée longent un cylindre, une aile ou une plaque et s’enroulent en allée de tourbillons ; faites glisser l’obstacle.",
   "Un solveur de Boltzmann sur réseau D2Q9 : neuf populations par cellule se propagent et se relaxent vers l’équilibre ; l’advection de MacCormack garde les volutes de fumée nettes."
  ]
 },
 "fireworks": {
  "title": "Feu d’artifice",
  "trick": "Explosions de fusées avec gravité, traînée et cinq types de bombes",
  "notes": [
   "Les fusées éclatent en pivoines, saules, crossettes, bombes bicolores et paillettes ; cliquez pour en lancer une à cet endroit.",
   "Chaque étoile a une vitesse, une gravité et une traînée, avec des règles propres à chaque type de bombe ; les étoiles gardent leurs dernières positions, dessinées en traînées additives qui s’effilent."
  ]
 },
 "bokeh": {
  "title": "Bokeh",
  "trick": "Cercle de confusion : les disques grandissent avec la distance au plan de netteté",
  "notes": [
   "Des lumières floues dérivent en couches pendant que la mise au point glisse, rendant les unes nettes et les autres diffuses.",
   "Chaque lumière devient un disque en forme de diaphragme dont la taille dépend de sa distance au plan de netteté, sa luminosité étalée sur sa surface ; un seul sprite cerclé, mélangé de façon additive."
  ]
 },
 "nebula": {
  "title": "Nébuleuse",
  "trick": "Gaz en fbm avec domain warping, éclairé vers une étoile, avec bandes de poussière",
  "notes": [
   "Du gaz magenta et turquoise dérive autour d’une étoile brillante, strié de bandes de poussière sombres, sur fond d’étoiles scintillantes.",
   "Un bruit fractal avec domain warping plie le gaz en filaments ; soustraire un échantillon de densité pris en direction de l’étoile éclaire les faces tournées vers elle."
  ]
 },
 "ink-fluid": {
  "title": "Fluide d’encre",
  "trick": "Fluides stables : advecter, rotationnel, projeter, recommencer",
  "notes": [
   "L’encre tourbillonne et s’étale quand vous la poussez, et éclabousse d’elle-même.",
   "Un solveur Navier–Stokes sur GPU : la vitesse transporte le colorant, le confinement de vorticité entretient les tourbillons et une résolution de pression garde l’écoulement incompressible."
  ]
 },
 "liquid-distort": {
  "title": "Distorsion liquide d’image",
  "trick": "Décaler les lectures de texture avec un bruit en mouvement",
  "notes": [
   "Une image ondule comme de l’eau, plus fort là où le pointeur la traverse.",
   "Chaque pixel lit la texture à un point décalé par un bruit animé, et le décalage augmente près du pointeur."
  ]
 },
 "lava-lamp": {
  "title": "Lampe à lave",
  "trick": "Metaballs 3D en raymarching ; la chaleur fait la flottabilité",
  "notes": [
   "Une lampe à lave de chrome et de verre luit dans une pièce sombre : la cire gonfle sur l’ampoule, s’étire en un col puis se détache du fond, monte lentement, refroidit en haut et redescend, en fusionnant et se séparant.",
   "Tout est rendu en raymarching dans un seul shader : la cire est faite de metaballs 3D liées par un minimum lisse, et la chaleur de chaque bulle règle sa flottabilité ; la lumière se réfracte dans le verre et la cire luit là où elle est fine."
  ]
 },
 "fire-smoke": {
  "title": "Feu et fumée",
  "trick": "Combustion simulée : le gaz brûle et brille en corps noir",
  "notes": [
   "Un feu de camp la nuit, sur des bûches empilées : les flammes lèchent le bois et les braises, l’écorce carbonisée rougeoie dans ses fissures, la fumée et les étincelles montent.",
   "Le gaz du bois chaud brûle à vitesse fixe, donc la pointe des flammes marque l’endroit où il s’épuise ; tout ce qui est chaud brille selon la loi de Planck, et le charbon est fait de blocs de Voronoï éclairés par le feu."
  ]
 },
 "lava-flow": {
  "title": "Coulée de lave",
  "trick": "Lave simulée sur un volcan érodé, éclairée en corps noir",
  "notes": [
   "Un volcan au crépuscule : la lave rouge vif jaillit du cratère et dévale les ravines en chenaux incandescents, des radeaux de croûte sombre dérivant dessus, sa lueur sur les pentes et le panache.",
   "Une simulation d’épaisseur et de chaleur tourne sur la montagne en raymarching ; le cratère pulse, chaque plaque de croûte fige à son âge et suit le courant, et la couleur suit la loi de Planck."
  ]
 },
 "ferrofluid": {
  "title": "Ferrofluide",
  "trick": "Aiguilles de Rosensweig sur un aimant bloc : cônes concaves sur un réseau hexagonal, en ray marching comme des miroirs noirs",
  "notes": [
   "Une huile noire, brillante comme un miroir, forme une flaque sur une table de studio, grimpe sur un aimant carré nickelé et se hérisse en une couronne d’aiguilles fines, plus hautes sur les bords ; déplacez le pointeur pour faire glisser l’aimant dans la flaque (il entraîne l’huile), et cliquez ou touchez pour l’éteindre et voir fondre les aiguilles.",
   "Champ de distance en raymarching : la flaque fusionnée en douceur avec un film sur le bloc et des cônes concaves sur un réseau hexagonal (chaque échantillon ne visite que son point le plus proche et ses six voisins), éclairé uniquement par des reflets de studio."
  ]
 },
 "marbling": {
  "title": "Papier marbré",
  "trick": "Recherche inverse à travers peigne et tourbillon : la peinture ne bave jamais",
  "notes": [
   "Des bandes de peinture sont peignées et tourbillonnées comme sur un papier marbré ; le pointeur entraîne le stylet.",
   "Chaque pixel remonte à rebours les ondes du peigne et le tourbillon du stylet pour retrouver sa bande de peinture, si bien que la recherche inverse ne bave jamais."
  ]
 },
 "raindrops-glass": {
  "title": "Pluie sur une vitre",
  "trick": "Chaque goutte est une lentille montrant l’arrière-plan net et inversé",
  "notes": [
   "Des gouttes de pluie perlent et glissent sur une vitre devant une ville floue, chacune montrant une copie nette et inversée.",
   "Chaque goutte échantillonne la scène nette inversée et réduite, comme une minuscule lentille ; les grosses gouttes glissent par à-coups, absorbent les petites et laissent une traînée."
  ]
 },
 "dripping-text": {
  "title": "Texte qui dégouline",
  "trick": "Filtre gluant flou et seuil : les gouttes fusionnent avec les lettres, puis se détachent",
  "notes": [
   "Des gouttes gonflent sous les lettres, s’étirent, se détachent et s’accumulent en flaque.",
   "Les gouttes naissent sur les bords inférieurs du texte ; un flou suivi d’un seuil d’alpha net fond goutte et lettre en un seul contour liquide."
  ]
 },
 "mercury": {
  "title": "Mercure liquide",
  "trick": "Billes en metaballs qui fusionnent, se séparent et reflètent un environnement",
  "notes": [
   "Des billes de mercure roulent, fusionnent au contact et se séparent quand on les traverse vite.",
   "Les billes s’additionnent en un seul champ de metaballs que le shader transforme en hauteur et en normale ; la normale reflète un studio, et la fusion conserve surface et quantité de mouvement."
  ]
 },
 "billow-clouds": {
  "title": "Nuages de Kelvin–Helmholtz",
  "trick": "Une simulation de fluide cisaillé enroule d’elle-même les vagues de Kelvin–Helmholtz",
  "notes": [
   "Au coucher du soleil, une nappe de nuages s’enroule en une rangée de vagues déferlantes, puis se dissout en turbulence.",
   "Un fluide sur GPU avec cisaillement, poussée, confinement de vorticité et résolution de pression fait naître les vagues de Kelvin–Helmholtz ; le colorant est éclairé par une marche vers le soleil."
  ]
 },
 "paint-swirl": {
  "title": "Tourbillon de peinture",
  "trick": "Couleur advectée autour de tourbillons ; l’accrochage à la palette garde des bandes nettes",
  "notes": [
   "Des anneaux de peinture coulent de deux becs et s’enroulent en spirales nettes ; décrivez des cercles avec le pointeur pour mélanger.",
   "Advection semi-lagrangienne à travers des tourbillons de Lamb–Oseen avec un échantillonnage Catmull-Rom borné ; rapprocher chaque pixel de la couleur de peinture la plus proche garde des bandes nettes."
  ]
 },
 "sph-water": {
  "title": "Bassin d’eau SPH",
  "trick": "Vraies particules SPH, fondues en une surface, tracées à travers le verre",
  "notes": [
   "L’eau ballotte dans un aquarium de verre qui oscille : elle grimpe aux parois, mousse et projette des caustiques ; le pointeur l’incline.",
   "SPH à double relaxation de densité ; les particules sont projetées dans un champ flottant que chaque pixel parcourt en perspective : absorption, ménisque, surface de Fresnel et caustiques."
  ]
 },
 "portal": {
  "title": "Portail",
  "trick": "Les rayons qui traversent l’anneau finissent leur trajet dans un second monde",
  "notes": [
   "Une porte de pierre sculptée, dans un désert doré, ouvre sur une mer nocturne sous une planète à anneaux ; la caméra la traverse et revient.",
   "Les rayons parcourent le désert en raymarching ; celui qui franchit l’ouverture continue dans l’autre monde, si bien que la parallaxe est réelle."
  ]
 },
 "glass-lens": {
  "title": "Réfraction d’une lentille de verre",
  "trick": "Dévier la lecture selon la normale de la lentille, par couleur",
  "notes": [
   "Une lentille de verre suit le pointeur, déformant la scène avec une frange colorée sur son bord.",
   "Chaque pixel échantillonne la scène décalée par la normale de la surface de la lentille, avec le rouge, le vert et le bleu décalés légèrement différemment pour la dispersion."
  ]
 },
 "dust-bust": {
  "title": "Poussière au vent",
  "trick": "Surface SDF échantillonnée par des rayons aléatoires, dissoute point par point",
  "notes": [
   "Un buste en marbre se consume en poussière emportée par le vent, puis se reforme sur son socle.",
   "Le buste est un SDF de formes unies par smooth-min ; le GPU échantillonne 150 000 points de surface en lançant des rayons répartis uniformément, chacun stockant sa normale et son occlusion."
  ]
 },
 "cloth-reveal": {
  "title": "Dévoilement au drap",
  "trick": "Soie Verlet tendue sur des pointes coniques, puis tirée par un coin",
  "notes": [
   "Une soie rouge descend en flottant sur un socle et se pose sur des pointes cachées ; puis un coin est tiré et dévoile une étoile chromée.",
   "Des points Verlet avec contraintes d’étirement, de cisaillement et de flexion heurtent l’étoile, faite de douze cônes ; la soie est tracée en surface B-spline lisse."
  ]
 },
 "liquid-metal": {
  "title": "Métal liquide",
  "trick": "Goutte en minimum lissé qui se détache d’un bassin de hauteurs ; doubles reflets",
  "notes": [
   "Une goutte chromée surgit d’un bassin ondulant, s’étrangle, se détache et retombe en anneaux.",
   "Un minimum lissé relie un bassin en champ de hauteurs et une sphère qui oscille ; deux rebonds de réflexion permettent à chacun de refléter l’autre, et une lumière annulaire crée les bandes zébrées."
  ]
 },
 "mandelbulb": {
  "title": "Fractale Mandelbulb",
  "trick": "Orbites de puissance 8 en coordonnées sphériques, raymarching par estimation de distance",
  "notes": [
   "Une fractale Mandelbulb respire lentement et réorganise ses crevasses.",
   "Raymarching avec une estimation de distance tirée de la vitesse d’échappement de l’orbite ; le nombre de pas sert d’occlusion ambiante et un piège d’orbite choisit la couleur."
  ]
 },
 "infinite-tunnel": {
  "title": "Tunnel infini",
  "trick": "Tube en champ de distance sur un chemin sinueux, panneaux selon l’angle et la profondeur",
  "notes": [
   "La caméra file sans fin dans un tunnel courbe de panneaux biseautés parcouru d’impulsions lumineuses.",
   "Le SDF du tunnel est la distance au-delà de 1.5 unité d’un chemin courbe ; les panneaux viennent de l’angle autour de celui-ci et de la profondeur le long, décalés une rangée sur deux."
  ]
 },
 "glass-prism": {
  "title": "Prisme de verre",
  "trick": "Réfraction par canal avec réflexion totale interne pour la dispersion",
  "notes": [
   "Un prisme de verre qui tourne décompose un studio rayé en franges arc-en-ciel et projette un éventail de couleurs.",
   "Les rayons se réfractent en entrant, se réfléchissent totalement au-delà de l’angle critique et se réfractent en sortant, avec un indice légèrement différent par canal ; Fresnel ajoute des reflets rasants."
  ]
 },
 "point-globe": {
  "title": "Globe de points avec arcs",
  "trick": "Sphère de Fibonacci en points, continents en bruit, arcs de grand cercle",
  "notes": [
   "Un globe en pointillés tourne, avec des arcs qui sautent d’un point de terre à l’autre ; faites glisser pour le faire tourner.",
   "Des points en spirale d’angle d’or avec un bruit 3D pour les terres, tournés et divisés en perspective à la main sur un canvas 2D ; les arcs suivent des grands cercles."
  ]
 },
 "extruded-type": {
  "title": "Typographie extrudée en 3D",
  "trick": "Masque de texte empilé de l’arrière vers l’avant via une seule rotation 3D",
  "notes": [
   "Un mot massif en 3D tourne avec un balayage chromé sur sa face ; le pointeur l’oriente.",
   "Le masque du mot est tamponné des dizaines de fois de l’arrière vers l’avant, chacun décalé par la même rotation ; un plan orthographique n’est qu’une transformation affine 2D."
  ]
 },
 "holo-card": {
  "title": "Carte holographique",
  "trick": "Inclinaison CSS 3D sur ressort, foil en color-dodge, reflet qui suit la lumière",
  "notes": [
   "Une carte holographique s’incline vers le pointeur, son foil arc-en-ciel et son reflet glissant avec elle.",
   "rotateX et rotateY en CSS 3D sous perspective, pilotés par un ressort ; une couche de foil mélangée en color-dodge à travers un fin masque diagonal se lit comme holographique."
  ]
 },
 "torus-knot": {
  "title": "Nœud torique irisé",
  "trick": "Tube balayé le long d’un nœud (p, q) avec des repères en transport parallèle",
  "notes": [
   "Un tube irisé se tord en nœud torique, parcouru de rayures qui s’écoulent.",
   "Un cercle balayé le long d’un nœud torique (p, q), orienté par transport parallèle pour ne jamais se retourner, la torsion restante répartie uniformément pour refermer la jointure."
  ]
 },
 "jelly-cube": {
  "title": "Cube de gelée",
  "trick": "Treillis masses-ressorts pilotant une déformation libre ; absorption de la lumière selon l’épaisseur",
  "notes": [
   "Un cube de gelée atterrit, s’écrase et tremble ; attrapez-le et lancez-le, ou touchez-le pour le faire sauter.",
   "Un treillis masses-ressorts de 4×4×4 déforme un cube lisse par déformation libre de Bézier tricubique ; une passe de profondeur arrière donne l’épaisseur pour l’absorption colorée."
  ]
 },
 "neon-geodesic": {
  "title": "Sphère géodésique néon",
  "trick": "Icosphère filaire tracée en néon, halo tiré de copies réduites peu coûteuses",
  "notes": [
   "Une sphère géodésique néon tourne au-dessus d’un sol brillant tandis que des impulsions parcourent ses arêtes.",
   "Un icosaèdre subdivisé aux arêtes réparties en quatre bandes de profondeur ; le halo est le même dessin réduit au quart et au douzième puis réagrandi."
  ]
 },
 "path-spheres": {
  "title": "Sphères sur un nœud",
  "trick": "Sphères en lancer de rayons analytique, ombres douces et inter-réflexions",
  "notes": [
   "Des billes chromées et colorées glissent le long d’un nœud de trèfle, se reflétant entre elles et dans le sol.",
   "Intersections analytiques rayon–sphère et rayon–plan avec jusqu’à trois rebonds, sans raymarching ; les ombres douces viennent de la distance à laquelle le rayon d’ombre frôle chaque bille."
  ]
 },
 "sdf-morph": {
  "title": "Morphing de formes SDF",
  "trick": "Cinq fonctions de distance mélangées tour à tour, avec une torsion à chaque mi-parcours",
  "notes": [
   "Un objet chromé se transforme de sphère en cube, tore, octaèdre et sphère sculptée par un gyroïde.",
   "Deux fonctions de distance signée sont mélangées selon une proportion adoucie pendant que l’espace se tord autour de l’axe vertical, la torsion culminant à mi-chemin."
  ]
 },
 "paper-fold": {
  "title": "Pliage de papier",
  "trick": "Un arbre de charnières CSS 3D : le dernier pli emporte les autres",
  "notes": [
   "Une feuille imprimée se plie et se déplie sur un bureau : en lettre, en fenêtre, en accordéon ou en carte.",
   "Chaque pli est une charnière preserve-3d imbriquée, si bien que le dernier emporte les autres ; les rabats libres sont des chaînes de bandes qui se courbent en tournant, et chaque pli suit la trajectoire à secousse minimale d’une main."
  ]
 },
 "menger-sponge": {
  "title": "Éponge de Menger",
  "trick": "Une boîte moins une croix, répétée en repliant l’espace à chaque niveau",
  "notes": [
   "Une éponge de Menger en laiton tourne dans un studio, ses tunnels s’assombrissant vers l’intérieur.",
   "Un seul SDF de boîte et une courte boucle : replier l’espace en cellules avec mod et soustraire une croix trois fois plus fine à chaque niveau ; la profondeur offre une occlusion ambiante gratuite."
  ]
 },
 "gyroid": {
  "title": "Vol dans un gyroïde",
  "trick": "Feuille de gyroïde épaissie, avec un tube creusé le long du trajet de la caméra",
  "notes": [
   "La caméra traverse sans fin les parois d’un labyrinthe organique qui changent de teinte et se perdent dans le brouillard.",
   "Les parois sont la valeur absolue du gyroïde moins une épaisseur, dont on soustrait un tube le long du trajet ; le raymarcher avance à 70 % car la distance n’est pas exacte."
  ]
 },
 "black-hole": {
  "title": "Trou noir",
  "trick": "Chaque rayon suit l’équation exacte de la lumière autour du trou",
  "notes": [
   "Gargantua tel que le film l’a dessiné : un disque blanc et fin qui s’arque au-dessus et au-dessous de l’ombre, un anneau de photons très fin, des étoiles étirées au bord.",
   "Chaque rayon suit l’équation de l’orbite de la lumière, u″ + u = 3Mu², et lit le disque à chaque traversée ; la rotation décale l’ombre."
  ]
 },
 "tesseract": {
  "title": "Tesseract",
  "trick": "Une rotation rigide en 4D projetée en 3D retourne le cube comme un gant",
  "notes": [
   "Un cube chromé à quatre dimensions se retourne comme un gant en tournant.",
   "Seize sommets à ±1 tournent dans des plans incluant w, puis une division de perspective selon w les projette en 3D, si bien que le cube intérieur engloutit l’extérieur."
  ]
 },
 "soap-bubble": {
  "title": "Bulle de savon",
  "trick": "Interférences en couche mince d’une épaisseur qui s’écoule et tourbillonne",
  "notes": [
   "Une bulle de savon flotte et ondule tandis que des couleurs irisées tourbillonnent à sa surface.",
   "Interférences en couche mince selon l’épaisseur, l’angle et la longueur d’onde ; l’épaisseur s’écoule sous la gravité et est brassée par un bruit, avec des reflets de Fresnel sur les deux parois."
  ]
 },
 "terrain-flyover": {
  "title": "Survol de terrain",
  "trick": "Des couches de bruit amorties par la pente sculptent des crêtes d’érosion",
  "notes": [
   "La caméra survole des crêtes enneigées, des parois rocheuses et un lac dans une brume qui s’épaissit.",
   "Champ de hauteurs en raymarching fait de couches de bruit amorties par la pente cumulée (l’astuce de la dérivée) pour des crêtes d’érosion ; les rayons avancent d’une fraction de leur hauteur au-dessus du sol."
  ]
 },
 "volumetric-clouds": {
  "title": "Nuages volumétriques",
  "trick": "Parcourir une densité de bruit, avec une seconde marche vers le soleil",
  "notes": [
   "La caméra dérive à travers des nuages ensoleillés aux ventres sombres, aux sommets lumineux et aux bords fins qui brillent.",
   "Un rayon parcourt une couche de densité de bruit selon la loi de Beer, et une courte seconde marche vers le soleil à chaque pas donne l’auto-ombrage."
  ]
 },
 "gem": {
  "title": "Diamant taille brillant",
  "trick": "Intersection de plans de facettes, réflexion totale interne, dispersion par canal",
  "notes": [
   "Un diamant taille brillant tourne sous des rampes lumineuses, lançant des éclats blancs et des feux colorés.",
   "La pierre est l’intersection de 49 demi-espaces ; les rayons rebondissent par réflexion totale interne, avec un indice de réfraction légèrement différent par canal de couleur."
  ]
 },
 "klein-bottle": {
  "title": "Bouteille de Klein",
  "trick": "Maillage paramétrique en hologramme additif, auto-intersection transparente",
  "notes": [
   "Une bouteille de Klein holographique tourne, son col traversant sa propre paroi.",
   "Un maillage paramétrique dessiné de façon additive avec des faces discrètes, des bords lumineux et des lignes de grille lissées par fwidth, sans tri en profondeur."
  ]
 },
 "inflated-type": {
  "title": "Typographie gonflée",
  "trick": "Une membrane sous pression résolue dans les glyphes donne un profil de ballon",
  "notes": [
   "Un mot se gonfle comme un ballon en aluminium avec un rebond élastique, puis se dégonfle.",
   "Une transformée de distance des lettres amorce une membrane sous pression dont la racine carrée donne une hauteur arrondie, rendue en raymarching avec une couleur de couche mince selon l’angle."
  ]
 },
 "melting-logo": {
  "title": "Logo chromé qui fond",
  "trick": "Texte en champ de distance fondu en lisant le champ depuis plus haut",
  "notes": [
   "Des lettres chromées s’affaissent en flaque, puis se redressent en mot avec un rebond.",
   "Un champ de distance 2D du mot est extrudé et rendu en raymarching ; pour la fonte, le champ est lu plus haut et mélangé à une copie floutée, avec des coulures sous les surplombs."
  ]
 },
 "dna-helix": {
  "title": "Double hélice d’ADN",
  "trick": "Sprites de sphères pré-ombrées triés de l’arrière vers l’avant, sans moteur 3D",
  "notes": [
   "Une double hélice d’ADN tourne pendant qu’une fourche de réplication l’ouvre et la referme.",
   "Des points en 3D sont tournés, projetés et dessinés de l’arrière vers l’avant en sprites de sphères pré-ombrées ; le second brin est décalé de 140°, ce qui forme les sillons."
  ]
 },
 "fractal-tree": {
  "title": "Arbre fractal en 3D",
  "trick": "Ramification récursive en trois selon l’angle d’or, poussée niveau par niveau",
  "notes": [
   "Un arbre en 3D pousse niveau par niveau, se balance au vent et perd ses pétales.",
   "Chaque branche se divise en trois plus courtes, tournées selon l’angle d’or et inclinées vers l’extérieur, pour une couronne uniforme ; les branches sont dessinées du plus loin au plus proche."
  ]
 },
 "shatter": {
  "title": "Éclatement et rembobinage",
  "trick": "Éclats de Voronoi en toile d’araignée ; le temps ralentit, s’arrête, recule",
  "notes": [
   "Une bille d’acier traverse une vitre dichroïque devant un anneau de lumière ; les éclats s’ouvrent au ralenti, restent suspendus, puis rembobinent et se ressoudent.",
   "Des germes sur anneaux et secteurs tracent des fissures en toile d’araignée ; chaque éclat biseauté suit une trajectoire balistique exacte, donc le retour arrière est parfait ; un film mince change de couleur selon l’angle."
  ]
 },
 "crt-monitor": {
  "title": "Moniteur CRT",
  "trick": "Faisceau d’électrons simulé, décroissance du phosphore et bandes de grille d’ouverture",
  "notes": [
   "Un vieux CRT s’allume, démarre, joue tout seul à Breakout puis s’éteint en un point.",
   "Un canvas de 320×240 avec persistance du phosphore alimente une passe de tube qui bombe la vitre, dessine des lignes de faisceau dont la largeur suit la luminosité et des bandes RGB filtrées par boîte."
  ]
 },
 "cmyk-halftone": {
  "title": "Similigravure CMJN",
  "trick": "Trames de points tournées (C15° M75° Y0° K45°) imprimées en lumière",
  "notes": [
   "Des sphères colorées dérivent et s’impriment en trames de demi-teintes tournées qui forment des rosettes ; le curseur fait éclore les points.",
   "Chaque séparation est une grille à son angle classique ; chaque pixel trouve sa cellule, échantillonne en son centre et dessine un point dont la taille suit la couverture d’encre."
  ]
 },
 "reaction-diffusion": {
  "title": "Réaction–diffusion",
  "trick": "Gray–Scott : deux réactifs, alimentation et élimination",
  "notes": [
   "Taches, rayures et motifs coralliens poussent et se déplacent sur la surface.",
   "Une réaction–diffusion de type Gray-Scott sur GPU, plusieurs pas par image ; deux réactifs diffusent à des vitesses différentes et les taux d’alimentation et d’élimination fixent le motif."
  ]
 },
 "guilloche": {
  "title": "Spirographe guilloché",
  "trick": "Une hypotrochoïde, dessinée en ruban de sept lignes",
  "notes": [
   "Des rosaces gravées façon billet de banque, faites de fines lignes en boucle.",
   "Des hypotrochoïdes, un point sur un petit cercle qui roule dans un grand, se refermant pour des rapports entiers ; sept copies légèrement décalées donnent l’aspect gravé."
  ]
 },
 "rgb-glitch": {
  "title": "Glitch RGB",
  "trick": "Décaler les canaux de couleur, déplacer des tranches",
  "notes": [
   "Une image se sépare en canaux de couleur tandis que des tranches sautent de côté par rafales aléatoires.",
   "Chaque canal de couleur est dessiné séparément en mélange additif et décalé ; lors de rafales imprévisibles, des tranches horizontales se décalent et les lignes de balayage tremblent."
  ]
 },
 "domain-warp": {
  "title": "Marbre en domain warping",
  "trick": "Bruit échantillonné à des coordonnées déformées par du bruit : f(p + g(p + h(p)))",
  "notes": [
   "Des filaments marbrés et fumeux se plient et s’écoulent sans fin.",
   "Domain warping : un bruit lu en un point poussé par un bruit lu en un point lui-même poussé ; les vecteurs de poussée intermédiaires choisissent les couleurs, si bien que la teinte suit les plis."
  ]
 },
 "truchet": {
  "title": "Flux de Truchet",
  "trick": "Tuiles aléatoires en quarts d’arc qui se raccordent toujours, flux en damier",
  "notes": [
   "Des tirets s’écoulent sur des chemins sinueux qui changent de route quand une tuile pivote.",
   "Tuiles de Truchet de deux arcs en quart de cercle d’orientations aléatoires ; inverser le sens du flux en damier garde les tirets continus d’une tuile à l’autre."
  ]
 },
 "kaleidoscope": {
  "title": "Kaléidoscope",
  "trick": "Angle polaire replié dans un seul secteur en miroir",
  "notes": [
   "Un kaléidoscope d’éclats de verre tourne lentement, baigné d’une fuite de lumière chaude.",
   "Coordonnées polaires avec l’angle replié dans un secteur et mis en miroir à ses bords ; le secteur contient des cellules de Voronoi mobiles, avec une échelle par canal pour les franges colorées."
  ]
 },
 "dither": {
  "title": "Tramage ordonné",
  "trick": "Tramage ordonné avec une matrice de seuils de Bayer 8×8",
  "notes": [
   "Une petite scène 3D rendue en deux tons d’encre épais qui se lisent comme un gris doux.",
   "La luminosité de chaque pixel est comparée à un seuil d’une matrice de Bayer 8×8 ; rendre en basse résolution et agrandir sans lissage garde la grille nette."
  ]
 },
 "pen-sketch": {
  "title": "Croquis à la plume",
  "trick": "Hachures superposées selon l’éclairage ; contours aux sauts de profondeur et de normale",
  "notes": [
   "Des solides en plâtre sur un plateau tournant, dessinés à l’encre bleu-noir frémissante avec des hachures qui s’épaississent dans l’ombre.",
   "Une passe de G-buffer stocke lumière, profondeur et normale ; la passe plume trace les contours aux sauts et superpose des directions de hachures selon l’obscurité, redessinées une image sur deux."
  ]
 },
 "ascii-render": {
  "title": "Rendu ASCII",
  "trick": "La luminosité choisit un glyphe, les bords choisissent - / | \\ selon leur direction",
  "notes": [
   "Une éponge de Menger tourne au-dessus d’un sol, dessinée uniquement en caractères ambrés.",
   "Raymarching par cellule de caractère ; les cellules de bord choisissent - / | \\ grâce à un tenseur de structure de Sobel, les autres prennent un glyphe dans une rampe de luminosité d’un atlas pré-dessiné."
  ]
 },
 "pixel-sort": {
  "title": "Tri de pixels",
  "trick": "Tri par transposition pair-impair sur GPU dans les segments lumineux de chaque colonne",
  "notes": [
   "Un coucher de soleil orageux fond tandis que le ciel lumineux coule en traînées triées, puis s’écoule.",
   "Les segments de pixels au-dessus du seuil dans chaque colonne sont triés par luminosité par transposition pair-impair, dix passes par image, pour que le tri soit visible."
  ]
 },
 "hyperbolic-tiling": {
  "title": "Pavage hyperbolique",
  "trick": "Replier les pixels dans un triangle par réflexions ; glisser par transformation de Möbius",
  "notes": [
   "Un motif d’étoiles entrelacées en tuiles heptagonales s’écoule sans fin vers le bord d’un disque de Poincaré.",
   "Chaque pixel est replié dans un triangle fondamental par rotations, symétries et inversions de cercle ; le nombre de retournements décide du dessus-dessous aux croisements."
  ]
 },
 "op-art-moire": {
  "title": "Moiré op art",
  "trick": "Deux fines grilles d’anneaux battent en larges franges de moiré rapides",
  "notes": [
   "Deux séries d’anneaux fins se superposent en amples franges de moiré ; le pointeur déplace l’un des centres.",
   "Chaque série d’anneaux est une rayure à 50 % de la distance, lissée par fwidth ; leur produit, fortement contrasté, donne des coïncidences claires et des entrelacs sombres."
  ]
 },
 "bauhaus": {
  "title": "Composition Bauhaus",
  "trick": "Tuiles primaires qui se recomposent par des interpolations adoucies et décalées",
  "notes": [
   "Une affiche Bauhaus de tuiles colorées dont un tiers des figures changent en vague.",
   "Chaque changement est un quart de tour, un rétrécissement-agrandissement ou un balayage du fond, avec des départs décalés de 70 ms ; cinq couleurs gardent chaque image dans la grille."
  ]
 },
 "memphis": {
  "title": "Motif Memphis",
  "trick": "Confettis Memphis sur grille perturbée, en boucle continue sur trois plans de parallaxe",
  "notes": [
   "Gribouillis, zigzags et points Memphis dérivent sur un fond sombre ; le pointeur décale trois plans de profondeur.",
   "Les formes sont distribuées une par cellule d’une grille perturbée pour ne jamais s’agglutiner, et les positions bouclent par modulo sur une étendue plus large que la scène."
  ]
 },
 "phyllotaxis": {
  "title": "Phyllotaxie",
  "trick": "Graines à l’angle d’or, rayon ∝ √âge : pourquoi 137.5° s’empile parfaitement",
  "notes": [
   "Des graines poussent vers l’extérieur dans un capitule de tournesol tandis que l’angle oscille autour de 137.508°, ouvrant des rayons. De gauche à droite, l’angle passe de 130.5° à 144.5°, avec un cran à 137.508°.",
   "La graine j se place à l’angle j·α et au rayon c·√(âge), pour une surface constante par graine ; colorer selon l’indice mod 21 fait ressortir chaque bras de spirale."
  ]
 },
 "rose-curve": {
  "title": "Courbe rosace",
  "trick": "r = cos(kθ) tracée par une plume comète, k glissant entre des fractions",
  "notes": [
   "Une plume lumineuse trace une rosace polaire, la garde un instant, puis se transforme en la suivante. Le pointeur choisit le rapport n/d : en horizontal pour n, en vertical pour d.",
   "Avec k = n/d, la courbe se ferme après d·π tours quand n·d est impair, et 2d·π sinon ; trois traits d’un même tracé en mélange lighter donnent le halo."
  ]
 },
 "superformula": {
  "title": "Superformule",
  "trick": "Contours de la superformule de Gielis mélangés rayon par rayon, en échos rubanés",
  "notes": [
   "Une étoile se transforme en carré, engrenage, triangle et fleur, laissant derrière elle des échos imbriqués qui s’estompent. Le pointeur règle la symétrie et l’acuité, de l’étoile hérissée à la fleur arrondie.",
   "La superformule de Gielis échantillonnée sur 720 angles et normalisée ; le morphing s’adoucit rayon par rayon, et chaque écho est une image précédente dessinée un peu plus petite."
  ]
 },
 "hex-wave": {
  "title": "Vague hexagonale",
  "trick": "Prismes en nid d’abeille soulevés par des anneaux qui se propagent et une houle",
  "notes": [
   "Des anneaux de prismes hexagonaux soulevés et lumineux se propagent sur une houle lente ; cliquez ou bougez pour lâcher des anneaux.",
   "Chaque cellule additionne des bosses gaussiennes en anneau selon sa distance, passées par tanh pour fixer hauteur et couleur ; peindre les rangées de haut en bas gère l’occlusion."
  ]
 },
 "wave-lines": {
  "title": "Lignes d’onde",
  "trick": "Harmoniques déphasées d’une ligne à l’autre ; crêtes à lignes cachées dérivant en diagonale",
  "notes": [
   "Une pile de lignes fines se soulève en crêtes qui descendent en diagonale puis s’aplanissent. Le pointeur pince les lignes vers le haut en un pic lumineux.",
   "Chaque ligne additionne des harmoniques sinusoïdales dont la phase avance par ligne à des rythmes différents ; remplir sous chaque ligne avant de la tracer masque les crêtes de derrière."
  ]
 },
 "starburst": {
  "title": "Rayons de soleil",
  "trick": "Éventails de rayons contrarotatifs et anneaux en zoom, combinés en mode difference",
  "notes": [
   "Un soleil de rayons tourne, scintille et s’écoule vers l’extérieur à travers des bandes de couleur. Le pointeur déplace un second éventail, et les deux se croisent en arcs de moiré.",
   "Deux éventails de secteurs contrarotatifs et des anneaux à espacement logarithmique combinés en mode difference ; un espacement à rapport constant fait du mouvement vers l’extérieur un zoom infini."
  ]
 },
 "spiral": {
  "title": "Spirale logarithmique",
  "trick": "Des spirales logarithmiques qui tournent donnent un zoom infini vers l’intérieur",
  "notes": [
   "Des spirales or et bleu tissent un treillis de losanges qui s’écoule sans fin vers un centre lumineux. Le pointeur est un second pôle d’où jaillissent les spirales.",
   "Dans l’espace log-polaire, une spirale logarithmique est une droite : chaque famille est donc une rayure de N·θ + k·log r, tracée en lignes fines avec fwidth."
  ]
 },
 "tartan": {
  "title": "Tartan tissé",
  "trick": "Vrai sergé 2/2 par pixel : un sett en miroir sur la chaîne et la trame",
  "notes": [
   "Un gros plan de tartan tissé glisse en diagonale, chaque fil et chaque côte du sergé visibles.",
   "Un seul sett en miroir dans une texture d’un pixel sert à la chaîne et à la trame ; une règle de sergé 2/2, la chaîne dessus quand (i + j) mod 4 < 2, choisit le fil visible."
  ]
 },
 "clifford-attractor": {
  "title": "Attracteur de Clifford",
  "trick": "Un million d’orbites GPU par image dans un tampon de densité en tone mapping logarithmique",
  "notes": [
   "Un ruban de lumière soyeux qui se croise lui-même change de forme au gré de ses quatre paramètres. Les coordonnées x et y du pointeur fixent deux coefficients et remodèlent l’attracteur sous votre main.",
   "Chaque sommet itère l’application de Clifford 24 fois depuis un départ haché de gl_VertexID, puis est projeté de façon additive dans un tampon half-float qui s’estompe, converti par log(1 + k·n)."
  ]
 },
 "barnsley-fern": {
  "title": "Fougère de Barnsley",
  "trick": "Jeu du chaos à quatre transformations affines, ombré selon le nombre d’impacts",
  "notes": [
   "Une fougère se forme à partir de points épars : d’abord le contour, puis les folioles et les nervures. Le pointeur est le vent : la fougère s’incline et s’enroule vers lui.",
   "Le jeu du chaos à quatre transformations affines pondérées, tracé dans un compteur d’impacts par pixel qui indexe une rampe de couleurs ; le nombre de points par image croît de façon exponentielle."
  ]
 },
 "sierpinski": {
  "title": "Jeu du chaos",
  "trick": "Des sauts aléatoires vers les sommets convergent vers le triangle de Sierpinski",
  "notes": [
   "Un point qui saute à mi-chemin vers des sommets aléatoires dessine un triangle de Sierpinski aux couleurs imbriquées. Le pointeur tire le sommet le plus proche et la figure se reforme autour.",
   "Le jeu du chaos avec comptage des impacts et sommes de couleurs par pixel ; chaque impact est teinté selon les deux derniers sommets, l’adresse du point, si bien que chaque sous-copie reçoit sa teinte."
  ]
 },
 "dragon-curve": {
  "title": "Courbe du dragon",
  "trick": "Chaque pli copie la courbe et l’ouvre en la faisant pivoter de 90°",
  "notes": [
   "Un dragon de Heighway se déplie pli après pli jusqu’à 8 192 segments, puis se replie. De gauche à droite, chaque pli s’ouvre de 60° à 150°, avec un cran à 90°.",
   "Chaque étape ajoute les points existants dans l’ordre inverse, tournés autour du dernier point d’un angle de pli adouci de 0 à 90°, pendant que la vue contre-tourne."
  ]
 },
 "dot-matrix-wave": {
  "title": "Vague en matrice de points",
  "trick": "Un disque par cellule, dimensionné et coloré par des vagues roulantes",
  "notes": [
   "Une grille de points respire en bandes ondulantes ; le curseur soulève un dôme brûlant entouré d’une douve.",
   "Chaque pixel trouve sa cellule, échantillonne en son centre un champ de hauteurs d’ondes planes et circulaires, et dessine un disque anticrénelé dont la taille et la couleur en dépendent."
  ]
 },
 "metaballs": {
  "title": "Metaballs",
  "trick": "Champs en inverse du carré additionnés, seuillés en une seule surface",
  "notes": [
   "Des bulles brillantes dérivent et se fondent les unes dans les autres avec des cols doux ; le curseur est aussi une bulle.",
   "Chaque bulle ajoute r² / d² à un champ dont la surface est à 1 ; le gradient exact du champ éclaire chaque pixel et lisse le bord."
  ]
 },
 "aurora-ribbons": {
  "title": "Rideaux d’aurore",
  "trick": "Rideaux de lumière plissés : ourlets brillants, rayons de bruit étiré, couleur selon l’altitude",
  "notes": [
   "Des rideaux d’aurore verte se plissent et dérivent dans un ciel étoilé, chatoyant en violet vers le haut. Le pointeur soulève le rideau le plus proche en un pli lumineux.",
   "Chaque rideau pend d’une courbe de bruit courbée par des sinus, plus brillant là où la pente du pli approche zéro (vu par la tranche) ; la lumière décroît de façon exponentielle avec la hauteur."
  ]
 },
 "ripple-grid": {
  "title": "Grille d’ondes",
  "trick": "Des ondes annulaires amorties déplacent les coordonnées où la grille est dessinée",
  "notes": [
   "Une grille fine flotte comme du papier millimétré sur l’eau, des anneaux se propageant depuis les clics et les mouvements.",
   "Les déplacements radiaux des trains d’ondes sont additionnés par pixel et la grille est dessinée au point déplacé, avec des dérivées en espace écran pour des lignes d’un pixel."
  ]
 },
 "voronoi-cells": {
  "title": "Cellules de Voronoi",
  "trick": "Distances aux deux germes les plus proches ; parois là où F2 − F1 ≈ 0",
  "notes": [
   "Une mosaïque de verre aux cellules dérivantes, dont les parois lumineuses glissent et changent de partenaire. Le pointeur est un germe de plus, qui écarte ses voisins.",
   "Chaque pixel examine les germes voisins en 3 × 3 pour F1 et F2 ; diviser F2 − F1 par son gradient exact garde aux parois une largeur régulière en pixels."
  ]
 },
 "quasicrystal": {
  "title": "Quasi-cristal",
  "trick": "N ondes planes tournées et additionnées : ordonné, symétrique, jamais répété",
  "notes": [
   "Des anneaux dorés et des rosaces à cinq branches s’épanouissent vers l’extérieur en un motif qui ne se répète jamais. Le pointeur décale les phases des ondes : les rosaces fondent et se reforment.",
   "Cinq ondes en rayures à k · 36° sont additionnées, ce qui donne une interférence quasi périodique ; décaler toutes les phases ensemble la fait s’écouler vers l’extérieur, et une onde triangulaire la replie en anneaux."
  ]
 },
 "topographic": {
  "title": "Courbes de niveau",
  "trick": "Isolignes d’un relief de bruit changeant, nettes au pixel près grâce à fwidth",
  "notes": [
   "Les courbes de niveau d’un paysage qui change lentement se resserrent sur les pentes et se referment en anneaux sur les sommets. Le pointeur soulève une colline que les courbes encerclent ; appuyez pour creuser une cuvette.",
   "Un bruit en domain warping donne l’altitude ; la distance à la courbe la plus proche, divisée par fwidth, se mesure en pixels, si bien que chaque ligne reste aussi nette sur terrain raide que sur terrain doux."
  ]
 },
 "interference": {
  "title": "Interférence d’ondes",
  "trick": "Sources ponctuelles additionnées en ondes complexes : franges fixes, crêtes mobiles",
  "notes": [
   "Deux sources d’ondes se croisent en bandes claires et lignes nodales noires ; bougez le curseur pour déplacer une source.",
   "En chaque pixel, chaque source ajoute un nombre complexe de phase k · distance et d’amplitude 1/√distance ; le module de la somme donne les franges fixes, sa partie réelle tournée l’onde en mouvement."
  ]
 },
 "plasma": {
  "title": "Plasma",
  "trick": "Quatre sinus additionnés, sur une rampe sombre-clair-sombre plutôt qu’un arc-en-ciel",
  "notes": [
   "Des lobes néon gonflent, fusionnent et se replient, corail chaud d’un côté et bleu glacier de l’autre. Les anneaux se propagent depuis le pointeur.",
   "La recette de la demoscene : en chaque pixel, additionner des sinus selon x, y, une diagonale et un cercle ; un cosinus porte la somme sur une rampe sombre-clair-sombre, d’où un bord éclairé pour chaque lobe."
  ]
 },
 "heatmap": {
  "title": "Carte de chaleur",
  "trick": "Un champ qui dérive, échantillonné par cellule, sur une palette thermique perceptuelle",
  "notes": [
   "Une grille de cellules arrondies rougeoie du noir au cramoisi puis au jaune pâle tandis que des points chauds dérivent. Le pointeur laisse une chaleur qui se répand et refroidit lentement.",
   "Un bruit en domain warping plus des gaussiennes errantes, échantillonné au centre de chaque cellule et passé dans une palette de type inferno à luminosité croissante régulière ; les cellules sont des carrés arrondis en SDF."
  ]
 },
 "julia-set": {
  "title": "Ensemble de Julia",
  "trick": "z → z² + c, avec c glissant le long du bord de l’ensemble de Mandelbrot",
  "notes": [
   "Une fractale lumineuse se transforme sans fin : des lobes épais fondent en spirales, puis en dentelle et en poussière, avant de revenir. Bougez le pointeur pour diriger c vous-même.",
   "Chaque pixel itère z → z² + c pendant que c parcourt le bord de la cardioïde de Mandelbrot ; une estimation de distance en pixels garde les filaments les plus fins nets au pixel près."
  ]
 },
 "brians-brain": {
  "title": "Brian’s Brain",
  "trick": "Automate cellulaire à trois états : allumé, réfractaire, éteint ; des planeurs partout",
  "notes": [
   "Des vaisseaux filent sur la grille, se percutent et en engendrent de nouveaux, laissant des traînées bleues qui refroidissent ; faites glisser pour peindre des cellules.",
   "Une cellule s’allume quand exactement deux de ses huit voisines sont allumées, puis doit mourir et se reposer un tour ; ce repos forcé maintient tout en mouvement."
  ]
 },
 "langtons-ant": {
  "title": "Fourmi de Langton",
  "trick": "Droite sur vide, gauche sur plein, inverser, avancer : puis une autoroute",
  "notes": [
   "Une fourmi gribouille le chaos pendant environ dix mille pas, puis construit une autoroute diagonale bien droite.",
   "Tourner à droite sur une case vide et à gauche sur une case pleine, l’inverser, avancer ; le chaos finit toujours dans un cycle de 104 pas. Les cases sont colorées selon leur dernier passage."
  ]
 },
 "falling-sand": {
  "title": "Sable qui tombe",
  "trick": "Automate cellulaire : le sable tombe et glisse en diagonale, l’eau s’étale sur les côtés",
  "notes": [
   "Un sable fin aux tons de désert coule depuis le curseur, s’entasse sur les corniches et se dépose en dunes stratifiées ; de temps en temps, un filet d’eau dévale, stagne dans les creux et assombrit le sable qu’il imbibe.",
   "Une grille de grains parcourue de bas en haut : chacun tombe de plus en plus vite ou glisse en diagonale, l’eau s’étale aussi sur les côtés et s’infiltre, et les blocs de 32 cellules immobiles se mettent en veille."
  ]
 },
 "doom-fire": {
  "title": "Feu de Doom",
  "trick": "Le feu du Doom PlayStation : la chaleur monte, dévie et refroidit au hasard",
  "notes": [
   "Un mur de feu en gros pixels ondule, faiblit puis rugit de nouveau ; faites glisser pour ajouter de la chaleur n’importe où.",
   "Des valeurs de chaleur de 0–36 montent d’une rangée inférieure brûlante : chaque cellule se copie vers le haut, décalée de côté et refroidie par un même nombre aléatoire, puis une rampe de 37 couleurs la transforme en flamme."
  ]
 },
 "water-ripple": {
  "title": "Ondes sur l’eau",
  "trick": "Équation d’onde en champ de hauteurs sur GPU, qui réfracte une grille",
  "notes": [
   "De temps en temps une goutte tombe dans l’eau claire et envoie un anneau lent qui courbe la grille en dessous ; faites glisser pour un sillage, cliquez pour une grosse goutte.",
   "L’équation des ondes sur deux textures flottantes en ping-pong : chaque cellule se rapproche de la moyenne de ses voisines (plus lentement que le maximum stable, pour qu’on puisse suivre les anneaux) moins sa hauteur précédente, amortie ; la pente réfracte la grille et la courbure ajoute des caustiques."
  ]
 },
 "double-pendulum": {
  "title": "Doubles pendules",
  "trick": "Chaos : des pendules écartés d’une fraction de milliradian divergent totalement",
  "notes": [
   "Neuf doubles pendules oscillent en un seul tracé blanc, puis s’ouvrent soudain en éventail de couleurs qui ne s’accordent plus jamais. Le pointeur tient le pivot : les pendules se balancent depuis votre main.",
   "Ils partent à une fraction de milliradian d’écart et sont intégrés par Runge–Kutta 4 sur les équations complètes ; le chaos double l’écart à chaque oscillation. Les traînées additives rendent blanc le tracé commun."
  ]
 },
 "orbits": {
  "title": "Orbites à N corps",
  "trick": "Chaque corps attire tous les autres ; l’intégration leapfrog garde les orbites fermées",
  "notes": [
   "Des planètes tournent autour de soleils jumeaux en rosaces qui pivotent lentement, traversées par des comètes ; cliquez pour lâcher une planète.",
   "Gravité en inverse du carré adoucie entre chaque paire, intégrée en leapfrog (demi-impulsion, dérive, demi-impulsion), un schéma symplectique qui garde les orbites fermées ; l’attraction du couple binaire les fait précesser."
  ]
 },
 "vortex": {
  "title": "Vortex d’évacuation",
  "trick": "Vortex de Lamb–Oseen avec aspiration ; la rotation différentielle enroule la couleur en bras",
  "notes": [
   "Des milliers de traînées spiralent vers une bonde qui suit le curseur, leurs couleurs enroulées en bras spiraux.",
   "Un vortex de Lamb–Oseen : un tourbillon tangentiel qui décroît en 1/r hors d’un cœur lisse, plus une légère aspiration vers l’intérieur ; les particules gardent la couleur de leur secteur d’origine, que les anneaux intérieurs cisaillent en spirales."
  ]
 },
 "plexus": {
  "title": "Plexus",
  "trick": "Points dérivants reliés par des lignes qui s’estompent avec la distance, via une grille",
  "notes": [
   "Des points dérivants tissent un maillage de lignes fines, et le curseur rassemble les plus proches en liens chaleureux.",
   "Les points se relient à leurs voisins dans un rayon donné, en s’estompant avec la longueur, trouvés via une grille uniforme de la largeur d’un lien ; les lignes sont regroupées en quelques niveaux d’opacité, un tracé par niveau."
  ]
 },
 "matrix-rain": {
  "title": "Pluie numérique",
  "trick": "Glyphes qui tombent avec des queues qui s’effacent, tamponnés depuis un atlas en cache",
  "notes": [
   "Des colonnes de katakana inversés et de chiffres ruissellent, chacune menée par une tête blanche et une queue verte qui s’efface.",
   "Chaque glyphe est dessiné une seule fois avec fillText dans un atlas à la résolution de l’appareil, puis tamponné avec drawImage : des milliers par image restent nets et peu coûteux."
  ]
 },
 "starfield-warp": {
  "title": "Champ d’étoiles en distorsion",
  "trick": "Étoiles projetées en perspective dont la traînée s’allonge avec la vitesse",
  "notes": [
   "Les étoiles jaillissent d’un point de fuite : des points en croisière, de longues traînées en distorsion ; le pointeur dirige.",
   "Chaque étoile 3D est dessinée comme une ligne entre sa dernière position projetée (x/z, y/z) et l’actuelle, si bien que la vitesse allonge les traînées gratuitement ; les lignes sont regroupées par couleur."
  ]
 },
 "oscilloscope": {
  "title": "Oscilloscope",
  "trick": "Faisceau Lissajous X-Y, luminosité selon la vitesse et rémanence du phosphore",
  "notes": [
   "Un tracé vert de CRT dessine des figures de Lissajous qui dérivent sur un réticule, laissant une rémanence de phosphore qui s’estompe. L’horizontale choisit le rapport de fréquences, la verticale la phase.",
   "Deux générateurs de sinus pilotent x et y ; la luminosité de chaque segment est inverse à sa longueur, comme avec un vrai faisceau, et chaque image n’efface qu’en partie la précédente."
  ]
 },
 "copper-bars": {
  "title": "Copper bars",
  "trick": "Rampes de couleur par ligne de balayage sur un tambour, en couleur 12 bits",
  "notes": [
   "Des barres horizontales brillantes passent les unes au-dessus et au-dessous des autres sur un reflet ondulant, en aplats comme sur Amiga.",
   "Chaque barre suit un cercle en hauteur et en profondeur, et chaque ligne de balayage affiche la barre la plus en avant qui la couvre ; les couleurs sont ramenées à 16 niveaux par canal."
  ]
 },
 "checker-tunnel": {
  "title": "Tunnel en damier",
  "trick": "Angle et rayon inverse comme coordonnées de texture : un damier plat devient un tube",
  "notes": [
   "Un tunnel en damier infini, qui se tord et se courbe, défile à toute allure et se perd dans l’obscurité.",
   "L’angle de chaque pixel devient u et 1/distance devient v, enroulant un damier plat en tube ; un filtrage par boîte avec les dérivées écran garde les cases nettes jusqu’au point de fuite."
  ]
 },
 "rotozoom": {
  "title": "Rotozoom",
  "trick": "Une seule lecture de texture via une matrice de rotation et d’échelle qui respire",
  "notes": [
   "Un motif XOR de carrés imbriqués tourne et zoome en avant et en arrière sur tout l’écran.",
   "Les coordonnées de chaque pixel passent par une matrice de rotation et d’échelle qui change à chaque image, puis lisent une texture x ^ y de 256×256 ; les mipmaps évitent le scintillement en dézoom."
  ]
 },
 "seven-segment": {
  "title": "Horloge sept segments",
  "trick": "Segments hexagonaux biseautés, halo quand ils sont allumés, fantômes éteints",
  "notes": [
   "Une horloge LED en direct avec centièmes, cadran incliné, segments éteints à peine visibles et deux-points qui clignotent.",
   "Chaque chiffre compte sept barres hexagonales à onglet allumées d’après un masque de bits par chiffre, avec des transitions douces ; le halo est une passe de shadow-blur par niveau de luminosité."
  ]
 },
 "led-matrix": {
  "title": "Enseigne LED à matrice de points",
  "trick": "Texte bitmap 5×7 qui avance d’une colonne de LED à la fois, avec bloom par LED",
  "notes": [
   "Un texte ambré défile sur un panneau de LED rondes, avec des points fantômes et un bloom doux.",
   "Le CPU rastérise une police 5×7 dans une minuscule texture allumé/éteint ; le shader dessine chaque LED comme une lentille au cœur brûlant et ajoute ses huit voisines en bloom."
  ]
 },
 "radar-sweep": {
  "title": "Balayage radar",
  "trick": "Décroissance du phosphore en exp(−angle depuis le passage du faisceau)",
  "notes": [
   "Un faisceau radar tourne au-dessus des cercles de distance, et les échos s’embrasent à son passage puis s’éteignent.",
   "Rien ne s’accumule d’une image à l’autre : chaque pixel calcule de combien le faisceau a tourné depuis son passage et brille selon une exponentielle de cette valeur ; les échos ne sont mis à jour qu’au balayage."
  ]
 },
 "ekg": {
  "title": "Moniteur cardiaque",
  "trick": "Battements PQRST gaussiens écrits sur place derrière une barre d’effacement",
  "notes": [
   "Un tracé vert d’ECG s’écrit à travers l’écran, effaçant un espace juste devant la plume.",
   "Chaque battement additionne des bosses gaussiennes pour l’onde P, le pic QRS et l’onde T, écrites de gauche à droite dans un tampon fixe ; rien ne défile."
  ]
 },
 "audio-bars": {
  "title": "Analyseur de spectre",
  "trick": "Spectre synthétisé, barres à attaque rapide, capuchons de crête qui tombent par gravité",
  "notes": [
   "Des barres segmentées du vert au rouge dansent sur un rythme, chacune coiffée d’un capuchon de crête qui reste suspendu puis tombe.",
   "Un spectre synthétique (pente de bruit rose plus grosse caisse, caisse claire, charleston et notes) fait monter les barres vite et redescendre lentement ; les capuchons tiennent un tiers de seconde, puis tombent par gravité."
  ]
 },
 "neon-pipes": {
  "title": "Tubes néon",
  "trick": "Cœur brûlant, verre coloré et bloom en pyramide de mipmaps",
  "notes": [
   "Des tubes néon colorés serpentent lentement sur un mur sombre, chacun avec un cœur blanc brûlant et un halo doux.",
   "Le bloom est tracé dans un tampon au quart de la résolution, réduit de moitié deux fois encore, puis chaque niveau est réagrandi de façon additive : un flou bon marché sans filtre."
  ]
 },
 "crosshair-hud": {
  "title": "HUD de visée",
  "trick": "Réticule sur ressort amorti, règles sur les bords, crochets qui se referment pour verrouiller",
  "notes": [
   "Un réticule de visée suit le pointeur avec des relevés en direct, et des crochets se resserrent pour verrouiller les cibles.",
   "Le réticule poursuit le pointeur sur un ressort à amortissement critique, si bien qu’il se pose sans dépassement ; chaque filet est calé sur la grille de pixels de l’appareil."
  ]
 },
 "fade-scale": {
  "title": "Fondu et zoom",
  "trick": "Les cartes montent depuis 94 % de leur taille, jamais depuis zéro",
  "notes": [
   "Touchez un filtre de la boutique : les fiches produit partent vite, puis les nouvelles apparaissent tour à tour.",
   "Chaque carte entre depuis 94 % de sa taille et transparente, avec un ease-out marqué ; la sortie est plus courte que l’entrée, si bien que les nouveaux résultats n’attendent jamais les anciens."
  ]
 },
 "stagger-grid": {
  "title": "Grille décalée",
  "trick": "Le délai augmente avec la distance au toucher",
  "notes": [
   "Touchez une pastille d’un nuancier et toutes les pastilles prennent une nuance de sa couleur, en une vague qui se propage.",
   "Le délai de chaque pastille est sa distance au toucher multipliée par un petit pas par cellule (20 à 40 ms) : une seule règle transforme des dizaines de changements en une seule onde."
  ]
 },
 "easing-race": {
  "title": "Course de courbes d’easing",
  "trick": "Même distance, même durée, quatre courbes d’easing",
  "notes": [
   "Quatre interrupteurs de facturation basculent ensemble sur la même distance et la même durée ; seule la courbe d’easing change.",
   "Linéaire, ease-in, un ease-out marqué et un ressort, côte à côte ; dans le premier dixième de seconde, l’ease-out est presque arrivé, d’où son impression de réactivité."
  ]
 },
 "card-flip": {
  "title": "Retournement de carte 3D",
  "trick": "rotateY sur ressort, face arrière masquée",
  "notes": [
   "Au paiement, l’aperçu de la carte se retourne quand le champ CVC prend le focus, puis revient.",
   "Deux faces dos à dos avec backface-visibility hidden et une perspective sur le parent ; un ressort pilote l’angle, qui dépasse légèrement avant de se poser."
  ]
 },
 "anticipation": {
  "title": "Anticipation et continuité",
  "trick": "S’accroupir avant le saut, osciller après l’atterrissage",
  "notes": [
   "Un produit saute dans l’icône du sac, en s’accroupissant d’abord et en s’étirant en vol, tandis que l’anse continue de se balancer.",
   "L’accroupissement est l’anticipation et le balancement de l’anse après l’arrêt du sac est la continuité, deux courbes amorties calculées à chaque image ; sans elles, le saut semble poussé plutôt que sauté."
  ]
 },
 "list-reorder": {
  "title": "Réordonner une liste (FLIP)",
  "trick": "Réordonnancement FLIP ; les lignes qui montent passent au-dessus de celles qui descendent",
  "notes": [
   "Le classement d’un club de course se réordonne par distance, allure ou dénivelé, et chaque coureur glisse vers sa nouvelle place.",
   "FLIP : mesurer chaque ligne, réordonner, transformer chacune vers son ancienne place et animer jusqu’à zéro ; les lignes qui montent passent au-dessus de celles qui descendent."
  ]
 },
 "add-remove": {
  "title": "Ajouter et retirer",
  "trick": "L’espace se referme après le départ de l’élément et s’ouvre avant son retour",
  "notes": [
   "Un article retiré du panier s’efface, puis les lignes du dessous comblent l’espace ; Annuler inverse les deux étapes.",
   "Les lignes n’animent jamais leur hauteur : elles sont mesurées avant et après puis glissées avec un transform décalé (FLIP), et partir avant de se replier évite tout saut."
  ]
 },
 "number-ticker": {
  "title": "Compteur de chiffres",
  "trick": "Chaque chiffre est une bande 0–9 qui roule jusqu’à sa valeur",
  "notes": [
   "Une carte de chiffre d’affaires change de période et chaque chiffre roule vers sa nouvelle valeur comme un compteur kilométrique.",
   "Chaque chiffre est une bande 0–9 derrière une fenêtre d’une ligne aux bords estompés ; seul translateY bouge, avec un léger décalage de gauche à droite pour une lecture en un seul balayage."
  ]
 },
 "accordion-faq": {
  "title": "FAQ en accordéon",
  "trick": "Hauteur vers une valeur mesurée, texte un temps après",
  "notes": [
   "Les questions sur la livraison s’ouvrent une à une : le panneau de réponse s’agrandit, le précédent se ferme, le chevron pivote.",
   "Le panneau anime sa hauteur jusqu’à la hauteur mesurée de la réponse, jamais jusqu’à auto ; le texte apparaît un temps après le début de l’ouverture et part en premier à la fermeture."
  ]
 },
 "tab-swap": {
  "title": "Changement d’onglet",
  "trick": "Une copie découpée des onglets ; le bord avant bouge en premier",
  "notes": [
   "Une pastille sombre glisse jusqu’à l’onglet produit choisi et le contenu en dessous fait un fondu enchaîné.",
   "La pastille est une copie sombre de la rangée d’onglets découpée à l’onglet actif : animer la découpe déplace en même temps le fond et la couleur du libellé ; le bord avant mène."
  ]
 },
 "push-slide": {
  "title": "Glissement poussé",
  "trick": "Le nouvel écran pousse ; l’ancien dérive plus lentement",
  "notes": [
   "Dans les Réglages du téléphone, Notifications entre en poussant depuis la droite et Retour le fait ressortir.",
   "Le nouvel écran parcourt toute la largeur tandis que l’ancien se déplace de 30 % et s’assombrit, sur une même courbe façon iOS ; l’écart de vitesse se lit comme de la profondeur."
  ]
 },
 "circle-reveal": {
  "title": "Dévoilement circulaire",
  "trick": "Un cercle en clip-path grandit depuis le point touché",
  "notes": [
   "Toucher Sombre répand le thème sombre en cercle depuis votre doigt ; cliquez pour choisir l’origine.",
   "Le nouvel écran est au-dessus, découpé par un cercle de rayon 0 au point touché, qui grandit jusqu’à couvrir le coin le plus éloigné."
  ]
 },
 "staircase-wipe": {
  "title": "Balayage en escalier",
  "trick": "Des barres couvrent en décalé, la page change sans être vue",
  "notes": [
   "Suivant fait descendre tour à tour des barres colorées sur une page de boutique, qui révèlent la collection suivante en partant.",
   "Les barres couvrent la page, le contenu change pendant qu’il est caché, et les barres poursuivent leur descente au lieu de revenir ; elles prennent la couleur de la collection suivante."
  ]
 },
 "shared-expand": {
  "title": "Expansion d’élément partagé",
  "trick": "FLIP avec une échelle uniforme et une découpe",
  "notes": [
   "Une photo produit touchée grandit depuis sa carte jusqu’à l’en-tête de la page, puis rétrécit au retour.",
   "FLIP depuis le rectangle de la carte : placer la photo comme en-tête, la transformer pour la ramener sur la carte, animer jusqu’à zéro ; une échelle uniforme et une découpe évitent tout étirement."
  ]
 },
 "view-transition": {
  "title": "Morphing View Transitions",
  "trick": "Le navigateur transforme les view-transition-name correspondants",
  "notes": [
   "La pochette et le nom d’un album grandissent jusqu’à l’en-tête de l’album ouvert, puis rétrécissent au retour.",
   "document.startViewTransition() capture l’écran, applique le changement du DOM et fait passer chaque élément partageant un view-transition-name d’une boîte à l’autre ; le reste fait un fondu enchaîné, sans code d’animation."
  ]
 },
 "ios-sheet": {
  "title": "Feuille iOS",
  "trick": "La page recule pendant que la feuille monte",
  "notes": [
   "Choisir la taille fait monter une feuille pendant que la page derrière rétrécit, arrondit ses coins et s’assombrit.",
   "La feuille bouge en translateY, la page en scale avec un clip-path pour ses coins, sous un calque noir qui s’estompe, le tout sur une même courbe de tiroir."
  ]
 },
 "lightbox-zoom": {
  "title": "Zoom en lightbox",
  "trick": "Le recadrage carré s’ouvre sur la photo entière",
  "notes": [
   "Une photo touchée grandit depuis son carré jusqu’à une visionneuse plein écran ; balayez vers le bas et elle regagne sa place.",
   "La vignette est un recadrage centré : la photo s’agrandit uniformément pendant qu’un clip-path ouvre le recadrage sur le cadre entier, un FLIP avec seulement transform et clip-path."
  ]
 },
 "directional-tabs": {
  "title": "Onglets directionnels",
  "trick": "Le contenu arrive du côté de l’onglet choisi",
  "notes": [
   "Choisir une catégorie plus à droite fait glisser les produits depuis la droite ; revenir en arrière les fait venir de la gauche.",
   "L’ancien contenu s’efface en partant dans l’autre sens, le nouveau entre depuis une fraction de la largeur, et le soulignement glisse en s’étirant vers le nouveau libellé."
  ]
 },
 "blur-crossfade": {
  "title": "Fondu enchaîné flou",
  "trick": "Un bref flou masque l’image doublée",
  "notes": [
   "Passer une catégorie de la boutique de la grille à la liste fond une mise en page dans l’autre.",
   "L’ancienne vue s’efface en se floutant et en rétrécissant un peu ; la nouvelle apparaît ensuite, floue et un peu plus grande au départ. Le flou masque l’image doublée ; restez sous 20 px."
  ]
 },
 "card-stack-swipe": {
  "title": "Pile de cartes à balayer",
  "trick": "Glisser, tamponner, lancer ; la pile remonte sur ressort",
  "notes": [
   "Les photos sont glissées à droite pour les garder ou à gauche pour les supprimer, puis lancées, et la carte suivante remonte.",
   "Pendant le glissement, la carte s’incline selon son décalage et un tampon GARDER ou SUPPRIMER apparaît ; le lancer finit en ease-out et les cartes de derrière se placent sur ressorts."
  ]
 },
 "letter-rise": {
  "title": "Lettres qui montent en décalé",
  "trick": "Les lettres montent sur ressort depuis une ligne découpée, à 40 ms d’écart",
  "notes": [
   "Le nom d’un compositeur monte lettre par lettre depuis une ligne découpée, puis la date et le programme suivent.",
   "Chaque lettre est dans une ligne en overflow hidden, avec son propre ressort décalé ; le léger dépassement semble composé à la main, et la sortie utilise un décalage plus serré."
  ]
 },
 "scramble": {
  "title": "Décodage brouillé",
  "trick": "Les caractères défilent en glyphes aléatoires, puis se fixent de gauche à droite",
  "notes": [
   "Un titre et une empreinte de clé défilent en glyphes aléatoires puis se fixent, lettre par lettre.",
   "Chaque caractère parcourt des glyphes aléatoires jusqu’à son tour dans l’ordre de lecture, puis se fixe sur la vraie lettre ; une police à chasse fixe empêche la ligne de bouger."
  ]
 },
 "vf-wave": {
  "title": "Vague de police variable",
  "trick": "Une sinusoïde parcourt la graisse et la chasse d’une police variable",
  "notes": [
   "Une vague de graisse et de chasse traverse un mot pendant que des curseurs d’axes suivent la lettre repérée.",
   "Chaque lettre lit un sinus décalé selon son indice et règle font-variation-settings ; les boutons et remplissages des curseurs sont des transforms, si bien que les relevés ne déclenchent jamais de layout."
  ]
 },
 "typewriter": {
  "title": "Machine à écrire",
  "trick": "Frappe avec délais aléatoires entre les touches et pauses à la ponctuation",
  "notes": [
   "Un champ de recherche tape des exemples de voyages, les découpe en filtres qui surgissent, puis efface le texte.",
   "Le délai de chaque frappe varie au hasard autour de la vitesse de base, la ponctuation ajoute une pause, le curseur ne clignote qu’au repos et l’effacement va plus vite que la frappe."
  ]
 },
 "line-mask": {
  "title": "Dévoilement par masque de ligne",
  "trick": "Les lignes montent une à une depuis derrière un bord de découpe",
  "notes": [
   "Un titre sur trois lignes monte ligne par ligne, puis la signature suit et la photo se dévoile de bas en haut.",
   "Chaque ligne est dans une boîte en overflow hidden, son texte part donc sous le bord ; décaler par ligne respecte les retours à la ligne de la rédaction, et la sortie prend moitié moins de temps."
  ]
 },
 "split-flap": {
  "title": "Tableau à palettes",
  "trick": "Chaque caractère parcourt l’alphabet, une palette à la fois",
  "notes": [
   "Un tableau des départs fait basculer ses lignes vers le vol suivant, chaque caractère parcourant l’alphabet palette par palette.",
   "Chaque cellule a quatre moitiés : l’ancienne moitié haute se rabat sur la ligne de pli, puis la nouvelle moitié basse tombe ; les colonnes démarrent à quelques millisecondes d’écart et se posent en une vague irrégulière."
  ]
 },
 "odometer": {
  "title": "Compteur kilométrique",
  "trick": "Des roues de chiffres tournent et les retenues se propagent vers la gauche",
  "notes": [
   "Le total en direct d’une association grimpe à chaque don pendant qu’une carte de fil d’actualité glisse.",
   "Chaque chiffre est une roue 0–9 déplacée par transform, qui ne tourne que lorsque sa voisine de droite passe de 9 à 0 : les retenues se propagent vers la gauche ; les chiffres tabulaires gardent le nombre stable."
  ]
 },
 "rotating-word": {
  "title": "Mot rotatif",
  "trick": "Un mot défile dans une fente découpée, avec un léger flou",
  "notes": [
   "Le dernier mot d’un titre passe par familles, colocs, clubs et équipes, et le calendrier à côté suit.",
   "Le mot monte dans une fente découpée avec quelques pixels de flou pendant qu’un soulignement apparaît ; il termine une ligne alignée à gauche, si bien que rien d’autre ne bouge."
  ]
 },
 "highlighter": {
  "title": "Surligneur",
  "trick": "Un trait de surligneur irrégulier passe derrière les phrases clés",
  "notes": [
   "Un surlignage passe derrière trois phrases d’une page de Walden, un trait par ligne.",
   "Chaque ligne reçoit sa propre bande SVG aux bords ondulés, aux extrémités biseautées et légèrement inclinée, révélée par un balayage en clip-path à vitesse de plume constante."
  ]
 },
 "text-circle": {
  "title": "Texte en cercle",
  "trick": "Un texte sur un cercle SVG tourne et rejoint en douceur une vitesse cible",
  "notes": [
   "Un anneau de texte tourne lentement autour d’une flèche, accélérant parfois ; survolez-le pour le faire tourner vous-même.",
   "Le texte suit un cercle SVG avec textPath, étiré pour tomber juste, et sa vitesse rejoint en douceur une cible, si bien qu’il ne saccade jamais."
  ]
 },
 "parallax": {
  "title": "Calques en parallaxe",
  "trick": "Les calques bougent à des vitesses qui diminuent avec la profondeur",
  "notes": [
   "Au défilement, les montagnes lointaines bougent à peine, la crête proche suit presque le rythme et le titre flotte entre les deux.",
   "Chaque calque est repoussé vers le bas d’une part du défilement, si bien que sa vitesse nette diminue avec la distance ; c’est cet écart de vitesse qui se lit comme de la profondeur."
  ]
 },
 "scrub-reveal": {
  "title": "Dévoilement au défilement",
  "trick": "Les mots s’allument un à un, pilotés par le défilement",
  "notes": [
   "Une phrase produit reste épinglée et s’allume mot après mot pendant que la page défile.",
   "La progression dans la zone épinglée pilote l’opacité de chaque mot, décalée selon sa place dans la phrase, si bien qu’elle suit le défilement exactement dans les deux sens."
  ]
 },
 "pinned-track": {
  "title": "Piste horizontale épinglée",
  "trick": "Le défilement vertical fait glisser latéralement une rangée sticky",
  "notes": [
   "Une section de portfolio reste épinglée pendant que le défilement fait glisser une rangée de projets sur le côté, avec compteur et barre de progression.",
   "Une section haute contient un cadre en position: sticky ; la progression à travers elle pilote directement le décalage de la rangée, et la hauteur de la section fixe le rythme."
  ]
 },
 "zoom-through": {
  "title": "Zoom traversant",
  "trick": "Une échelle exponentielle fait traverser la vue par la contreforme d’une lettre",
  "notes": [
   "Saturne apparaît dans le O de LOOK, et le défilement agrandit le mot jusqu’à traverser la lettre.",
   "Le mot s’agrandit de façon exponentielle autour de la contreforme du O, ce qui se lit comme une avancée régulière ; les contreformes sont des trous en clip-path evenodd, si bien que le ciel est visible dès le départ."
  ]
 },
 "velocity-skew": {
  "title": "Bandeau incliné par la vitesse",
  "trick": "La vitesse de défilement accélère le bandeau et l’incline",
  "notes": [
   "Des bandeaux promo défilent en continu, et un coup de défilement rapide les fait filer et s’incliner avant de se stabiliser.",
   "La vitesse de défilement est lissée, ajoutée à la vitesse de dérive et convertie en skew, si bien que l’inclinaison monte et se pose au lieu de tressauter."
  ]
 },
 "reading-progress": {
  "title": "Progression de lecture",
  "trick": "Une barre de progression en scaleX adoucie, plus les minutes de lecture restantes",
  "notes": [
   "Une barre fine se remplit à mesure que vous lisez, et les minutes restantes décomptent en glissant dans le sens du défilement.",
   "La barre est un seul élément mis à l’échelle en x et adouci vers la vraie position, si bien que les à-coups du défilement ne se voient jamais ; les minutes viennent des mots encore sous la ligne de flottaison."
  ]
 },
 "sticky-stack": {
  "title": "Pile de cartes sticky",
  "trick": "Des cartes sticky s’empilent ; chacune recule quand la suivante arrive",
  "notes": [
   "Chaque carte d’étape se fixe un peu plus bas que la précédente, et les cartes recouvertes rétrécissent et s’assombrissent.",
   "position: sticky gère l’empilement ; la profondeur de chaque carte dépend du chemin parcouru par les suivantes, ce qui pilote une échelle depuis le bord supérieur et un assombrissement."
  ]
 },
 "timeline-draw": {
  "title": "Frise chronologique dessinée",
  "trick": "Une ligne pilotée par le défilement se dessine et déclenche les jalons à son passage",
  "notes": [
   "Une ligne télégraphique en cuivre se dessine le long de la page au défilement, et chaque année apparaît à son arrivée.",
   "La ligne est pilotée par un bord de clip-path calé sur une ligne de lecture fixe du viewport, avec une pointe lumineuse ; les jalons, eux, sont déclenchés et entrent en douceur une seule fois."
  ]
 },
 "sequence-scrub": {
  "title": "Séquence d’images au défilement",
  "trick": "La position de défilement choisit l’image d’une séquence",
  "notes": [
   "Une chaussure de course fait un tour complet image par image au défilement, à côté de notes de caractéristiques qui changent.",
   "Un petit maillage 3D en ombrage plat dessiné en code est mis en cache sous forme d’images à la première utilisation ; la position de défilement choisit l’image, sans interpolation entre elles."
  ]
 },
 "snap-gallery": {
  "title": "Galerie aimantée",
  "trick": "Défilement aimanté ; la carte centrale grandit, les voisines s’assombrissent",
  "notes": [
   "Une rangée de photos de nuit s’aimante carte par carte, la carte centrale grandissant pendant que ses voisines s’assombrissent.",
   "L’échelle et l’assombrissement viennent de la distance de chaque carte au centre à chaque image, si bien qu’ils suivent le défilement en plein geste ; le scroll snapping CSS stabilise un vrai balayage."
  ]
 },
 "magnetic": {
  "title": "Bouton magnétique",
  "trick": "Attiré vers le curseur, le libellé encore plus",
  "notes": [
   "Deux boutons d’inscription penchent vers le curseur qui approche, chaque libellé penchant un peu plus que son bouton.",
   "L’attraction est maximale au centre et s’annule au bord du rayon, et les deux positions passent par des ressorts : rien ne saute à la prise ni au relâchement."
  ]
 },
 "ripple": {
  "title": "Onde au clic",
  "trick": "Un cercle s’étend depuis le point exact de l’appui",
  "notes": [
   "Appuyer sur un bouton de tarifs envoie un cercle doux depuis le point exact touché, et le bouton s’enfonce.",
   "Le cercle est dimensionné pour atteindre le coin le plus éloigné, grandit avec un ease-out marqué et s’estompe ; il démarre sur pointerdown, pas au relâchement."
  ]
 },
 "tilt": {
  "title": "Carte inclinable 3D",
  "trick": "La carte se tourne vers le pointeur, le reflet suit",
  "notes": [
   "Une carte d’article survolée se tourne vers le curseur, se soulève légèrement et un reflet doux la parcourt.",
   "La position du curseur sur la carte pilote rotateX et rotateY via des ressorts, l’ombre et le reflet suivant les mêmes valeurs ; elle revient à plat quand le curseur la quitte."
  ]
 },
 "cursor-trail": {
  "title": "Traînée du curseur",
  "trick": "Chaque point poursuit le précédent",
  "notes": [
   "Un ruban chaleureux suit le curseur, s’effilant et s’enroulant à chaque geste.",
   "Le premier point est sur le curseur et chacun des autres rejoint en douceur celui qui le précède ; le ruban est opaque et se fond dans la couleur de la page, si bien que les jointures ne forment jamais de perles."
  ]
 },
 "spotlight": {
  "title": "Dévoilement au projecteur",
  "trick": "Un masque doux suit le curseur sur un calque sombre",
  "notes": [
   "Un trou rond et doux dans un voile sombre suit le curseur et révèle dessous un aperçu de calendrier coloré.",
   "Un masque radial-gradient sur le voile se déplace avec le curseur, lissé pour que la lumière traîne légèrement derrière ; pas besoin de canvas."
  ]
 },
 "image-follow": {
  "title": "Image qui suit",
  "trick": "Un aperçu suit le curseur et change à chaque ligne",
  "notes": [
   "Survoler une ligne de projet affiche son aperçu à côté du curseur, qui traîne derrière et penche dans le mouvement.",
   "L’aperçu rejoint le curseur en douceur et s’incline selon sa vitesse ; les images partagent une bande dans un cadre fixe, et changer de ligne fait glisser la bande, si bien qu’il ne disparaît jamais."
  ]
 },
 "directional-fill": {
  "title": "Remplissage directionnel",
  "trick": "Le remplissage entre et sort par où le curseur est passé",
  "notes": [
   "Le remplissage sombre d’un bouton entre du côté par lequel le curseur arrive et sort du côté par lequel il repart.",
   "Une copie remplie du bouton est révélée avec un clip-path inset depuis le bord d’entrée, puis se replie vers le bord de sortie depuis l’endroit où s’est arrêté le dernier balayage."
  ]
 },
 "underline-slide": {
  "title": "Soulignement glissant",
  "trick": "Un seul soulignement voyage d’un lien à l’autre et s’étire",
  "notes": [
   "Un unique soulignement de navigation glisse vers le lien survolé et revient à la page courante quand le curseur s’en va.",
   "Ses deux extrémités suivent des ressorts distincts, celle de tête plus rapide, si bien qu’il s’étire vers la cible ; dessiné uniquement avec translateX et scaleX."
  ]
 },
 "lit-border": {
  "title": "Bordure éclairée",
  "trick": "Les bords des cartes captent une lumière qui suit le curseur",
  "notes": [
   "Les cartes d’une grille sombre s’éclairent autour du curseur, leurs voisines recevant un reflet sur leurs bords les plus proches.",
   "Chaque carte place un radial-gradient dans ses propres coordonnées ; un masque limite une copie à une bordure de 1px pendant qu’une autre teinte la surface."
  ]
 },
 "dock-magnify": {
  "title": "Loupe du Dock",
  "trick": "Les icônes grossissent autour du curseur et s’écartent",
  "notes": [
   "Les icônes du Dock grossissent au passage du curseur, au maximum dessous et de moins en moins sur quelques voisines.",
   "L’échelle suit une décroissance en cosinus selon la distance, et le décalage de chaque icône est calculé à partir des nouvelles tailles pour que la rangée s’élargisse exactement de ce qu’elle a grandi ; uniquement des transforms."
  ]
 },
 "toggle": {
  "title": "Interrupteur à ressort",
  "trick": "Le bouton s’étire pendant sa course",
  "notes": [
   "Les interrupteurs de notifications basculent un à un, chaque bouton s’étirant dans sa course et reprenant sa forme ronde à l’arrivée.",
   "Le bouton suit un ressort, avec un scaleX ancré à son bord arrière qui grandit avec la vitesse ; la couleur du rail suit la position du bouton, pas un minuteur."
  ]
 },
 "like-burst": {
  "title": "Explosion de like",
  "trick": "Écrasement, pop, anneau et étincelles sur un même temps",
  "notes": [
   "Le cœur d’un produit enregistré s’écrase, dépasse sa taille normale et se pose pendant qu’un anneau et des points jaillissent.",
   "Chaque élément démarre à la même image pour se lire comme un seul événement, et les étincelles prennent de nouveaux angles aléatoires à chaque fois."
  ]
 },
 "submit-success": {
  "title": "De l’envoi au succès",
  "trick": "Le bouton devient spinner, le spinner devient coche",
  "notes": [
   "Un bouton Envoyer se resserre en cercle, tourne pendant l’envoi, puis passe au vert et trace une coche.",
   "Le resserrement est un clip-path inset avec un ease-out marqué et la coche se trace avec stroke-dashoffset : un seul contrôle montre tous les états."
  ]
 },
 "arc-spinner": {
  "title": "Spinner en arc",
  "trick": "L’arc s’allonge et se raccourcit en tournant",
  "notes": [
   "Un paiement affiche un petit spinner sur la ligne de livraison, puis un plus grand dans le bouton Payer.",
   "L’anneau tourne pendant que son tiret s’allonge et se raccourcit, sur des périodes décalées, si bien qu’il ne se répète jamais deux fois de suite à l’identique."
  ]
 },
 "skeleton": {
  "title": "Skeleton scintillant",
  "trick": "Un balayage de lumière signale le chargement, puis le contenu apparaît",
  "notes": [
   "Des lignes grises de substitution tiennent la mise en page d’un tiroir de panier sous un balayage lumineux, puis les vrais articles apparaissent.",
   "Les éléments de substitution ont la taille des vraies lignes, rien ne saute donc ; chaque ligne fait un fondu enchaîné sur son propre substitut, 50 ms après celle du dessus."
  ]
 },
 "copy-tick": {
  "title": "Copier vers coche",
  "trick": "L’icône de copie devient une coche, avec une étiquette Copié",
  "notes": [
   "Appuyer sur Copier remplace l’icône par une coche qui se dessine, et une petite étiquette Copié s’élève.",
   "Les icônes font un fondu enchaîné depuis 95 % de leur taille, la coche se trace avec stroke-dashoffset et, après un instant, tout revient discrètement à l’état initial."
  ]
 },
 "password-strength": {
  "title": "Robustesse du mot de passe",
  "trick": "Jauge et liste de règles mises à jour à chaque frappe",
  "notes": [
   "Pendant qu’un mot de passe se tape tout seul, une jauge en quatre segments se remplit et change de couleur, et chaque règle se coche.",
   "Les segments de la jauge grandissent en scaleX depuis la gauche, décalés de 40 ms, et rien ne compte tant que le mot de passe n’est pas assez long."
  ]
 },
 "hold-delete": {
  "title": "Maintenir pour supprimer",
  "trick": "Remplissage lent pendant l’appui, retour rapide au relâchement",
  "notes": [
   "Maintenir un bouton de suppression fait avancer un remplissage rouge ; relâcher trop tôt le fait revenir d’un coup.",
   "Le remplissage est un clip-path sur une copie rouge, si bien que le libellé devient blanc exactement en dessous ; linéaire pendant l’appui, ease-out rapide au relâchement, tous deux depuis le remplissage actuel."
  ]
 },
 "bell-badge": {
  "title": "Cloche et pastille",
  "trick": "La cloche sonne, le compteur défile",
  "notes": [
   "Chaque nouvelle notification fait sonner la cloche et sauter ou défiler la pastille ; ouvrir la cloche la remet à zéro.",
   "La sonnerie est une rotation amortie autour du crochet de la cloche, et l’ancien chiffre glisse vers le haut et sort pendant que le nouveau entre."
  ]
 },
 "toast-stack": {
  "title": "Pile de toasts",
  "trick": "Les nouveaux toasts devant, les anciens reculent",
  "notes": [
   "Les toasts montent en bas à droite pendant que les anciens reculent, plus petits et plus haut, jusqu’à ce que le plus ancien s’efface.",
   "Le transform de chaque toast dépend de son rang dans la pile ; fermer celui de devant le fait glisser sur le côté et les autres avancent, le tout en transitions de transform et d’opacity."
  ]
 },
 "squash-bounce": {
  "title": "Rebond écrasé-étiré",
  "trick": "S’étirer avec la vitesse, s’écraser à l’impact",
  "notes": [
   "Touchez Ajouter au panier et la vignette d’une tasse décrit un arc jusqu’à l’icône du panier, s’écrase, rebondit et tombe dedans.",
   "Elle s’étire dans le sens de sa vitesse en vol et s’écrase à l’impact en conservant son aire ; chaque rebond garde une fraction de son énergie."
  ]
 },
 "rubber-band": {
  "title": "Glissement élastique",
  "trick": "La résistance augmente au-delà du bord, retour sur ressort au relâchement",
  "notes": [
   "Une visionneuse photo est balayée au-delà de sa dernière photo, résistant de plus en plus, puis revient sur ressort au relâchement.",
   "Dans l’album, la photo suit le doigt en 1:1 ; au-delà de la fin, la formule de rubber-band d’Apple réduit le suivi, et le ressort de retour part avec la vitesse du relâchement."
  ]
 },
 "pendulum-wave": {
  "title": "Vague de pendules",
  "trick": "Longueurs réglées pour que la rangée se synchronise et se désynchronise",
  "notes": [
   "Une rangée de pendules lumineux passe de l’unisson à des vagues et des serpentins, puis se réaligne.",
   "Chaque pendule fait une oscillation de plus par cycle que son voisin : angle = A·cos(2π·n·t / cycle), avec longueur ∝ 1 / fréquence²."
  ]
 },
 "verlet-rope": {
  "title": "Corde Verlet",
  "trick": "Les points se souviennent d’où ils étaient ; les longueurs sont imposées",
  "notes": [
   "Le cordon d’une lampe se balance et fouette ; une traction allume ou éteint la lumière.",
   "L’intégration de Verlet déplace chaque point selon son dernier mouvement plus la gravité, puis quelques passes de contraintes par image rétablissent les longueurs de repos entre voisins ; l’interrupteur est un ressort raide."
  ]
 },
 "ball-collisions": {
  "title": "Collisions de billes",
  "trick": "Impulsions élastiques le long de la ligne des centres",
  "notes": [
   "Des bulles de sujets se serrent les unes contre les autres, et chaque toucher en fait grossir une sur ressort pour qu’elle écarte les autres.",
   "Les bulles sont attirées doucement vers le centre ; les chevauchements sont séparés selon la masse, et les paires qui se heurtent échangent leur vitesse le long de la ligne des centres, avec une restitution inférieure à 1."
  ]
 },
 "bottom-sheet": {
  "title": "Bottom sheet à crans",
  "trick": "Viser avec le lancer, puis rejoindre sur ressort le cran le plus proche",
  "notes": [
   "Une feuille de carte avec les cafés à proximité est lancée entre les hauteurs aperçu, moitié et plein écran.",
   "Au relâchement, elle ajoute à sa position une courte anticipation de sa vitesse, choisit le cran le plus proche et le rejoint sur ressort à cette vitesse ; au-delà des extrémités, effet rubber-band."
  ]
 },
 "swipe-dismiss": {
  "title": "Balayer pour fermer",
  "trick": "S’envoler avec le lancer, effet élastique dans le mauvais sens",
  "notes": [
   "Les notifications balayées s’en vont tandis que les autres remontent sur ressort pour combler l’espace ; celle tirée à l’envers revient d’un coup.",
   "La carte suit le doigt en 1:1 ; relâchée assez loin ou assez vite, elle garde sa vitesse et part, sinon un ressort la ramène à sa place."
  ]
 },
 "chat-heads": {
  "title": "Bulles de discussion",
  "trick": "Chaque bulle poursuit celle de devant sur son propre ressort",
  "notes": [
   "Une pile de bulles de discussion déplacée suit la première et, au relâchement, file vers le bord le plus proche.",
   "Chaque bulle est un ressort 2D qui vise la bulle de devant, si bien que le retard s’accumule le long de la chaîne ; la vitesse du lancer choisit le bord d’ancrage."
  ]
 },
 "icon-jelly": {
  "title": "Icône d’app en gelée",
  "trick": "Un second ressort transforme la vitesse en étirement",
  "notes": [
   "Une icône d’app pressée longuement est déplacée vers un nouvel emplacement, s’étirant en route et tremblant à l’arrivée.",
   "Position et forme sont des ressorts distincts : le ressort de forme suit la vitesse du glissement, si bien que l’icône s’étire le long de sa trajectoire et dépasse la forme ronde à l’arrêt."
  ]
 },
 "pull-refresh": {
  "title": "Tirer pour actualiser",
  "trick": "Traction élastique, palier, retour sur ressort",
  "notes": [
   "Tirer une boîte de réception vers le bas fait grandir un spinner ; la liste marque un palier, puis le nouveau courrier glisse.",
   "La traction suit une courbe de rubber-band, la résistance augmente donc avec la distance ; passé le seuil, le décalage rejoint sur ressort un palier de 56 px, puis revient à 0 une fois terminé."
  ]
 },
 "shape-morph": {
  "title": "Morphing de forme",
  "trick": "Chaque forme correspond aux mêmes 160 rayons polaires",
  "notes": [
   "Passer au morceau suivant transforme la pochette en la forme et la couleur du suivant pendant un fondu enchaîné du titre.",
   "Chaque forme est stockée sous forme de 160 distances au centre à angles fixes, si bien que toute forme se mélange à une autre point par point ; un rayon moyen égal garde l’aire stable."
  ]
 },
 "icon-morph": {
  "title": "Morphing d’icône",
  "trick": "Deux icônes dessinées avec les mêmes points, interpolées",
  "notes": [
   "Une flèche de téléchargement se replie en coche à l’enregistrement, et les barres d’une icône de liste se regroupent en grille.",
   "La flèche et la coche ont le même nombre de points, elles se mélangent donc point par point ; le changement de vue interpole la position et la taille de chaque rectangle."
  ]
 },
 "gooey": {
  "title": "Bulles gluantes",
  "trick": "Flou, puis seuil d’alpha net",
  "notes": [
   "Le bouton d’ajout d’une app de notes fait suinter ses actions une à une, puis les réabsorbe.",
   "Les cercles sont floutés ensemble, puis un filtre SVG de matrice de couleurs pousse le contraste de l’alpha et transforme le chevauchement doux en pont liquide net ; les icônes restent au-dessus du filtre."
  ]
 },
 "line-draw": {
  "title": "Tracé de ligne",
  "trick": "stroke-dasharray égal à la longueur du tracé",
  "notes": [
   "Deux lignes sur une carte d’analytique tracent la semaine de gauche à droite, la seconde juste après la première.",
   "Régler la longueur du tiret et son décalage sur le getTotalLength() du tracé, puis animer le décalage jusqu’à zéro pour que la ligne se dessine."
  ]
 },
 "liquid-button": {
  "title": "Bouton liquide",
  "trick": "Points du contour sur ressorts, poussés par le pointeur",
  "notes": [
   "Le contour du bouton Commander ondule comme un liquide au passage du pointeur et se resserre à l’appui.",
   "Le contour est un anneau de points, chacun ramené par un ressort vers le rectangle arrondi ; les voisins partagent leur décalage, si bien qu’une poussée fait le tour du bord comme une onde."
  ]
 },
 "play-pause": {
  "title": "De lecture à pause",
  "trick": "Deux moitiés à quatre points d’un triangle glissent en deux barres",
  "notes": [
   "Un triangle de lecture se scinde en deux moitiés qui glissent directement vers les barres de pause, et inversement.",
   "Le triangle est coupé en deux formes à quatre points correspondant aux deux barres à quatre points : chaque point a son partenaire ; le morphing utilise un ease-in-out."
  ]
 },
 "menu-close": {
  "title": "De menu à fermer",
  "trick": "Trois lignes à deux points, celle du milieu se réduit à un point",
  "notes": [
   "Trois lignes se replient en X et le panneau du menu se déroule vers le bas, ses liens arrivant tour à tour.",
   "Les lignes extérieures pivotent jusqu’aux diagonales pendant que celle du milieu se rétracte ; une légère rotation masque les images intermédiaires, et le panneau utilise un balayage en clip-path."
  ]
 },
 "chart-morph": {
  "title": "Morphing de graphique",
  "trick": "Chaque jeu de données rééchantillonné sur les mêmes 48 points",
  "notes": [
   "Passer de la semaine au mois puis au trimestre transforme la courbe et son aire vers les nouvelles données.",
   "Chaque période est rééchantillonnée sur les mêmes 48 points, si bien que toute période se mélange à une autre point par point ; la ligne, l’aire et le point final partagent ces points."
  ]
 },
 "logo-draw": {
  "title": "Logo tracé",
  "trick": "Longueur du tiret = longueur du tracé, puis amener le décalage à zéro",
  "notes": [
   "Un logo se dessine trait par trait, puis se remplit pendant que le nom monte lettre par lettre.",
   "Chaque trait reçoit un tiret aussi long que lui, décalé d’autant, puis animé jusqu’à zéro ; des décalages qui se chevauchent donnent l’impression d’une seule main qui dessine."
  ]
 },
 "button-menu": {
  "title": "Du bouton au menu",
  "trick": "Une seule surface, un clip-path arrondi qui s’ouvre depuis le coin du bouton",
  "notes": [
   "Un bouton Partager s’ouvre en menu comme une seule surface sombre, puis se referme en bouton.",
   "Un clip-path inset aux coins arrondis ne montre que le coin de la taille du bouton, puis s’ouvre sur le menu complet ; les éléments suivent avec un court décalage et partent en premier."
  ]
 },
 "watch-movement": {
  "title": "Mouvement de montre",
  "trick": "Balancier, échappement, rouage : le tic est le pas de la roue d’échappement",
  "notes": [
   "Un calibre à remontage manuel vu par son fond : le balancier oscille, son spiral respire, et chaque passage libère la roue d’échappement d’un cran. Maintenez appuyé pour le remonter ; bougez pour l’incliner dans la lumière.",
   "À chaque alternance l’ancre bascule et la roue d’échappement avance d’une demi-dent ; le rouage démultiplie par 16, 7,5 et 8. Vitesse 1 = temps réel, 28 800 alternances par heure."
  ]
 },
 "wave-collapse": {
  "title": "Effondrement de fonction d’onde",
  "trick": "Effondrer la case la plus incertaine, puis propager ce que ses voisines peuvent être",
  "notes": [
   "Une carte d’îles s’écrit toute seule : les cases non résolues sont tous les terrains à la fois jusqu’à ce que le solveur en choisisse un, et côtes, plages et crêtes poussent de là. Maintenez et glissez pour dissoudre une zone et la regarder repousser.",
   "Deux voisines ne diffèrent que d’un palier de terrain au plus. La case d’entropie la plus basse s’effondre, ses voisines perdent ce qu’elles ne peuvent plus être, et une contradiction se répare en dissolvant la zone autour."
  ]
 },
 "mud-cracks": {
  "title": "Craquelures de boue",
  "trick": "Des parois de Voronoï déformées se fendent au passage du front de séchage",
  "notes": [
   "L’argile mouillée et brillante sèche inégalement et se fend en plaques aux bords relevés, les fentes s’élargissant à mesure qu’elle rétrécit ; puis la pluie la détrempe et les fentes se referment. Maintenez et glissez pour mouiller une zone.",
   "Un retrait uniforme casse l’argile en polygones : le réseau est donc un diagramme de Voronoï déformé par du bruit ; chaque paroi s’ouvre depuis son milieu quand sa zone sèche, et une transformée de distance ombre les fentes et les bords relevés."
  ]
 }
};

// slider labels, keyed by the English label in anims/registry.js
export const LABELS = {
 "Ripple speed": "Vitesse des ondes",
 "Magnet": "Aimant",
 "On": "Allumé",
 "Off": "Éteint",
 "Vein density": "Densité des nervures",
 "Backlight": "Contre-jour",
 "Plate size": "Taille des plaques",
 "Cells per frame": "Cases par image",
 "Land": "Terre",
 "Speed (1 = real time)": "Vitesse (1 = réel)",
 "Amplitude (°)": "Amplitude (°)",
 "Size": "Taille",
 "Blades": "Brins",
 "Gusts": "Rafales",
 "Wind (m/s)": "Vent (m/s)",
 "Choppiness": "Clapot",
 "Sun height (°)": "Hauteur du soleil (°)",
 "Loops per second": "Boucles par seconde",
 "Growth": "Croissance",
 "Fold spacing": "Espacement des plis",
 "Dust": "Poussière",
 "Sun": "Soleil",
 "Population": "Population",
 "Hold": "Pause",
 "Flakes": "Flocons",
 "Shake every (s)": "Secouer toutes les (s)",
 "Turn every (s)": "Tourner toutes les (s)",
 "Half twists": "Demi-tours",
 "Band width": "Largeur du ruban",
 "Fold": "Pliage",
 "Letter": "Lettre",
 "Gate": "Fenêtre",
 "Accordion": "Accordéon",
 "Map": "Carte",
 "4D perspective": "Perspective 4D",
 "Actions": "Actions",
 "Activity": "Activité",
 "Afterglow": "Rémanence",
 "Air drag": "Traînée d’air",
 "Amplitude": "Amplitude",
 "Angle (°)": "Angle (°)",
 "Aperture blades (0 = round)": "Lamelles (0 = rond)",
 "Arcs": "Arcs",
 "Arm twist": "Torsion des bras",
 "Arms": "Bras",
 "Atoms": "Atomes",
 "Backdrop": "Arrière-plan",
 "Balls": "Billes",
 "Bands": "Bandes",
 "Bar duration (ms)": "Durée barre (ms)",
 "Bar follow": "Suivi barre",
 "Bars": "Barres",
 "Beads": "Perles",
 "Beads per second": "Perles par seconde",
 "Big circle": "Grand cercle",
 "Birds": "Oiseaux",
 "Blobs": "Blobs",
 "Blur": "Flou",
 "Blur (px)": "Flou (px)",
 "Boils / second": "Tremblés / seconde",
 "Boost": "Boost",
 "Bounce": "Rebond",
 "Branching": "Ramification",
 "Breathing": "Respiration",
 "Brightness": "Luminosité",
 "Bubbles": "Bulles",
 "Build rate": "Vitesse de tracé",
 "Bursts / second": "Salves / seconde",
 "Camera height": "Hauteur caméra",
 "Cap gravity": "Gravité des pics",
 "Cell (px)": "Cellule (px)",
 "Cell size": "Taille cellule",
 "Cell width (px)": "Largeur cellule (px)",
 "Cells across": "Cellules en largeur",
 "Centre spread": "Écart central",
 "Characters / second": "Caractères / seconde",
 "Clock spread": "Écart des horloges",
 "Cloth resolution": "Résolution tissu",
 "Cloud cover": "Nébulosité",
 "Cohesion": "Cohésion",
 "Column delay (ms)": "Délai colonne (ms)",
 "Columns": "Colonnes",
 "Comb": "Peigne",
 "Contacts": "Contacts",
 "Contour levels": "Courbes de niveau",
 "Cooling": "Refroidissement",
 "Coupling": "Couplage",
 "Crease shading": "Ombre des plis",
 "Crouch depth": "Accroupi",
 "Curl": "Boucle",
 "Cursor pull": "Attraction curseur",
 "Curtains": "Rideaux",
 "Curvature": "Courbure",
 "Cycle (s)": "Cycle (s)",
 "Cycle speed": "Vitesse cycle",
 "Damping": "Amortissement",
 "Decay": "Déclin",
 "Delay per cell (ms)": "Délai cellule (ms)",
 "Density": "Densité",
 "Depth": "Profondeur",
 "Detail": "Détail",
 "Dim": "Assombrir",
 "Disk speed": "Vitesse disque",
 "Dispersion": "Dispersion",
 "Distance": "Distance",
 "Dot pitch (px)": "Pas des points (px)",
 "Dots": "Points",
 "Dots per column": "Points par colonne",
 "Draw (ms)": "Tracé (ms)",
 "Drift": "Dérive",
 "Drips": "Coulures",
 "Drones": "Drones",
 "Drop every (s)": "Chute toutes les (s)",
 "Drop size": "Taille goutte",
 "Duration (ms)": "Durée (ms)",
 "Dye persistence": "Persistance teinture",
 "Ease": "Lissage",
 "Echoes": "Échos",
 "Edge sensitivity": "Sensib. contours",
 "Embers": "Braises",
 "Enter (ms)": "Entrée (ms)",
 "Exit (ms)": "Sortie (ms)",
 "Exposure": "Exposition",
 "Falcon attacks": "Attaques faucon",
 "Feed": "Apport",
 "Field lines": "Lignes de champ",
 "Field scale": "Échelle champ",
 "Filings": "Limaille",
 "Film thickness": "Épaisseur film",
 "Fire (dispersion)": "Feu (dispersion)",
 "Fireflies": "Lucioles",
 "Flame height": "Hauteur flamme",
 "Flap time (ms)": "Bascule (ms)",
 "Flight speed": "Vitesse de vol",
 "Flow": "Flux",
 "Flow speed": "Vitesse flux",
 "Focus pull": "Mise au point",
 "Foil": "Feuille",
 "Fold angle (°)": "Angle de pli (°)",
 "Folds": "Plis",
 "Follow": "Suivi",
 "Force": "Force",
 "Frames": "Images",
 "Frequency": "Fréquence",
 "Gain": "Gain",
 "Gap (ms)": "Écart (ms)",
 "Gas density": "Densité gaz",
 "Generations / s": "Générations / s",
 "Gloss": "Brillance",
 "Glow": "Halo",
 "Glyph size": "Taille glyphe",
 "Grain size": "Taille grain",
 "Gravity": "Gravité",
 "Grid (agents = grid²)": "Grille (agents = grille²)",
 "Grid (grains = grid²)": "Grille (grains = grille²)",
 "Grid (particles = grid²)": "Grille (particules = grille²)",
 "Grid (particles = size²)": "Grille (particules = taille²)",
 "Grid lines": "Lignes de grille",
 "Growth speed": "Vitesse croissance",
 "Harmonics": "Harmoniques",
 "Hatch density": "Densité hachures",
 "Heart rate": "Pouls",
 "Heat": "Chaleur",
 "Heat persistence": "Persistance chaleur",
 "Height": "Hauteur",
 "Hold (ms)": "Maintien (ms)",
 "Hold (s)": "Maintien (s)",
 "Holographic sheen": "Reflet holographique",
 "Hop height": "Hauteur saut",
 "Hue": "Teinte",
 "Index of refraction": "Indice de réfraction",
 "Inflation": "Gonflement",
 "Ink load": "Charge d’encre",
 "Intensity": "Intensité",
 "Item stagger (ms)": "Décalage élément (ms)",
 "Iterations": "Itérations",
 "Iterations ×": "Itérations ×",
 "Jelly": "Gélatine",
 "Jelly hue": "Teinte gélatine",
 "Jitter": "Tremblement",
 "Jump ratio": "Ratio de saut",
 "Kill": "Élimination",
 "Landing overshoot": "Rebond d’atterrissage",
 "Launch rate": "Cadence de tir",
 "Layers": "Couches",
 "Lean": "Inclinaison",
 "Levels": "Niveaux",
 "Lift": "Élévation",
 "Lights": "Lumières",
 "Line width": "Épaisseur trait",
 "Lines": "Lignes",
 "Link distance": "Distance liens",
 "Link stagger (ms)": "Décalage liens (ms)",
 "Magnet strength": "Force aimant",
 "Magnetic field": "Champ magnétique",
 "Magnify": "Grossissement",
 "Max scale": "Échelle max",
 "Max tilt (deg)": "Incl. max (deg)",
 "Meter (ms)": "Jauge (ms)",
 "Mirrors": "Miroirs",
 "Mist": "Brume",
 "Morph (ms)": "Morphing (ms)",
 "Morph (s)": "Morphing (s)",
 "Move (ms)": "Déplacement (ms)",
 "Neck smoothness": "Fluidité du cou",
 "Nudge every (ms)": "Coup toutes les (ms)",
 "Number swap (ms)": "Changement nombre (ms)",
 "Page scale": "Échelle page",
 "Panels": "Panneaux",
 "Parallax": "Parallaxe",
 "Particles": "Particules",
 "Pause between gifts (ms)": "Pause entre cadeaux (ms)",
 "Pen offset": "Décalage stylo",
 "Pen speed (px/ms)": "Vitesse stylo (px/ms)",
 "Pendulums": "Pendules",
 "Persistence": "Persistance",
 "Perspective (px)": "Perspective (px)",
 "Phase drift": "Dérive de phase",
 "Phosphor mask": "Masque phosphore",
 "Pieces": "Pièces",
 "Pins across": "Épingles en largeur",
 "Pixel size": "Taille pixel",
 "Planets": "Planètes",
 "Pointer bloom": "Bloom du pointeur",
 "Points": "Points",
 "Points (millions/frame)": "Points (millions/image)",
 "Pop (ms)": "Apparition (ms)",
 "Pour": "Versement",
 "Pour rate": "Débit versement",
 "Power": "Puissance",
 "Power drift": "Dérive puissance",
 "Pressure": "Pression",
 "Pull": "Attraction",
 "Pulses": "Impulsions",
 "Push": "Poussée",
 "Radius (px)": "Rayon (px)",
 "Rain": "Pluie",
 "Range": "Portée",
 "Range (px)": "Portée (px)",
 "Rays": "Rayons",
 "Reading line": "Ligne de lecture",
 "Refraction": "Réfraction",
 "Relief depth": "Profondeur relief",
 "Resistance": "Résistance",
 "Restitution": "Restitution",
 "Return stiffness": "Raideur retour",
 "Reynolds number": "Nombre de Reynolds",
 "Ring (ms)": "Sonnerie (ms)",
 "Ring glow": "Halo anneau",
 "Rings": "Anneaux",
 "Ripple": "Ondulation",
 "Ripple depth": "Profondeur ondes",
 "Ripples": "Ondes",
 "Roll (ms)": "Défilement (ms)",
 "Rows": "Lignes",
 "Scale": "Échelle",
 "Seam glow": "Halo jointures",
 "Seeds": "Graines",
 "Segments": "Segments",
 "Sensor angle": "Angle capteur",
 "Shade per card": "Ombre par carte",
 "Shake": "Secousse",
 "Shards": "Éclats",
 "Share that changes": "Part qui change",
 "Shear": "Cisaillement",
 "Sheen bands": "Bandes de reflet",
 "Shimmer speed": "Vitesse miroitement",
 "Show speed": "Vitesse spectacle",
 "Shrink per card": "Réduction par carte",
 "Shrink per toast": "Réduction par toast",
 "Side card shrink": "Réduction latérales",
 "Sides": "Côtés",
 "Sides per tile": "Côtés par tuile",
 "Skew": "Inclinaison",
 "Slant (°)": "Inclinaison (°)",
 "Slide (ms)": "Glissement (ms)",
 "Slosh": "Ballottement",
 "Small circle": "Petit cercle",
 "Smoke lines": "Filets de fumée",
 "Snap (ms)": "Calage (ms)",
 "Snap back (ms)": "Retour (ms)",
 "Softness": "Souplesse",
 "Sort passes / frame": "Passes / image",
 "Sources": "Sources",
 "Sparks": "Étincelles",
 "Species": "Espèces",
 "Speed": "Vitesse",
 "Speed (°/s)": "Vitesse (°/s)",
 "Spikes": "Pointes",
 "Spin": "Rotation",
 "Splat radius": "Rayon éclaboussure",
 "Spread": "Dispersion",
 "Spring damping": "Amortiss. ressort",
 "Spring stiffness": "Raideur ressort",
 "Squash": "Écrasement",
 "Stagger (ms)": "Décalage (ms)",
 "Stars": "Étoiles",
 "Start scale": "Échelle initiale",
 "Start spread (mrad)": "Écart initial (mrad)",
 "Starting beads": "Perles initiales",
 "Steering": "Direction",
 "Step (ms)": "Pas (ms)",
 "Step (px)": "Pas (px)",
 "Steps / frame": "Pas / image",
 "Steps per letter": "Pas par lettre",
 "Stickiness": "Adhérence",
 "Stiffness": "Raideur",
 "Strength": "Force",
 "Stretch": "Étirement",
 "Strikes / second": "Éclairs / seconde",
 "Stripe flow": "Flux des rayures",
 "Stroke (px)": "Trait (px)",
 "Stroke stagger (ms)": "Décalage traits (ms)",
 "Sun height": "Hauteur soleil",
 "Surface glow": "Halo surface",
 "Swap (ms)": "Changement (ms)",
 "Sweep (±°)": "Balayage (±°)",
 "Sweep speed": "Vitesse balayage",
 "Swing (deg)": "Balancement (deg)",
 "Swirl": "Tourbillon",
 "Swirl strength": "Force tourbillon",
 "Table tilt (deg)": "Incl. table (deg)",
 "Tap rate": "Cadence tapes",
 "Tempo": "Tempo",
 "Terrain scale": "Échelle terrain",
 "Text delay (ms)": "Délai texte (ms)",
 "Thickness": "Épaisseur",
 "Thread (px)": "Fil (px)",
 "Threshold": "Seuil",
 "Throw (ms)": "Lancer (ms)",
 "Tiles": "Carreaux",
 "Tiles across": "Tuiles en largeur",
 "Tiles per corner": "Tuiles par coin",
 "Tilt": "Inclinaison",
 "Tones": "Tons",
 "Trail decay": "Déclin traînée",
 "Trail length": "Longueur traînée",
 "Trailing lag (ms)": "Retard traînée (ms)",
 "Tray tilt": "Incl. plateau",
 "Tube thickness": "Épaisseur tube",
 "Tubes": "Tubes",
 "Turbulence": "Turbulence",
 "Turns": "Tours",
 "Turntable speed": "Vitesse plateau",
 "Twist": "Torsion",
 "Typing (ms per key)": "Frappe (ms/touche)",
 "Unzipping": "Ouverture",
 "Viscosity": "Viscosité",
 "Vortices": "Vortex",
 "Wall scale": "Échelle parois",
 "Warp": "Distorsion",
 "Water share": "Part d’eau",
 "Wave strength": "Force vagues",
 "Waves": "Ondes",
 "Waves (symmetry)": "Ondes (symétrie)",
 "Waves per height": "Ondes par hauteur",
 "Wind": "Vent",
 "Wobble": "Oscillation",
 "Yarn relief": "Relief du fil",
 "Zoom": "Zoom",
 "p (turns around)": "p (tours autour)",
 "q (turns through)": "q (tours à travers)"
};
