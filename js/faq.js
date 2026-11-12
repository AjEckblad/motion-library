// The FAQ in both languages. Plain data: the app (js/i18n.js) and the static build (tools/build-static.mjs) both read it.
// Questions are written the way people ask them, and each answer leads with the answer.
export const FAQ = {
  en: [
    ['What is this?', 'A library of live web animations and effects. Each one is a single plain JavaScript file with no dependencies: hover a card to watch it, open it to read how it works, tune it with the sliders and take the code.'],
    ["How do I get started?", "Browse the library, find one you like and copy the code. It takes about 30 seconds. Or open an effect and copy the command next to “Install”, for example npx motion-library add confetti --pieces 300. Node.js 18 or newer is required."],
    ['Do the sliders change what npx installs?', 'Yes. Every slider you move is added to the command as a flag (--pieces 300), and the CLI writes those values into the file it copies. Reset the sliders and the command goes back to the defaults.'],
    ['Can I copy the code by hand instead?', 'Yes. Copy puts the file, with your slider values, on the clipboard; Download .html gives you a page that runs on its own. Import the default export, call it with a container element that has a size, and call the function it returns to clean up.'],
    ['Does it work with React, Vue or Svelte?', 'Yes. Call the function in your mount hook (useEffect, onMounted, onMount) with a ref to a sized element and return its cleanup. Prompt copies everything an AI coding assistant needs to fit it into your component.'],
    ['Which browsers?', 'Every current browser. WebGL pieces need WebGL (all modern browsers have it); a few use WebGL2. Serve your page from a local server or your dev server, since browsers block modules opened as files.'],
    ['Are they fast enough for phones?', 'Most run at 60 fps on a laptop and stay smooth on recent phones. The heaviest shaders have a quality or count slider: lower it for mobile, and only mount effects that are on screen.'],
    ["Is this really free?", "Yes. Everything is under the MIT-0 license. Use them anywhere, change them freely."],
  ],
  zh: [
    ['这是什么？', '一个可以实时预览的网页动画与特效库。每个效果都是一个无依赖的纯 JavaScript 文件：鼠标移到卡片上即可观看，打开后可以阅读原理、用滑块调整并拿走代码。'],
    ["怎样开始使用？", "浏览这个库，找到喜欢的效果，复制代码，大约 30 秒就能完成。也可以打开一个效果，复制“安装”旁边的命令，例如 npx motion-library add confetti --pieces 300。需要 Node.js 18 或更高版本。"],
    ['滑块会改变 npx 安装的内容吗？', '会。你调整过的每个滑块都会作为参数加到命令里（--pieces 300），CLI 会把这些数值写进复制的文件。重置滑块后，命令也会恢复默认值。'],
    ['可以手动复制代码吗？', '可以。“复制”会把带有你当前滑块数值的文件放到剪贴板；“下载 .html”会给你一个可以独立运行的页面。导入默认导出，传入一个有尺寸的容器元素来调用它，需要清理时调用它返回的函数。'],
    ['能用于 React、Vue 或 Svelte 吗？', '能。在挂载钩子（useEffect、onMounted、onMount）里用一个有尺寸元素的 ref 调用它，并返回它的清理函数。“提示词”会复制 AI 编程助手把它接入组件所需的全部信息。'],
    ['支持哪些浏览器？', '所有当前主流浏览器。WebGL 效果需要 WebGL（现代浏览器都支持），少数用到 WebGL2。请通过本地服务器或开发服务器打开页面，浏览器会阻止以文件方式打开的模块。'],
    ['手机上够流畅吗？', '大多数效果在笔记本上可以跑到 60 fps，在较新的手机上也很流畅。最重的着色器有画质或数量滑块：移动端调低一些，并且只挂载出现在屏幕上的效果。'],
    ["真的免费吗？", "是的。所有内容都采用 MIT-0 许可证。随处使用，随意修改。"],
  ],
  es: [
    ["¿Qué es esto?", "Una biblioteca de animaciones y efectos web en vivo. Cada uno es un único archivo de JavaScript puro sin dependencias: pasa el cursor por una tarjeta para verlo en marcha, ábrela para leer cómo funciona, ajústalo con los controles deslizantes y llévate el código."],
    ["¿Cómo empiezo?", "Explora la biblioteca, elige uno que te guste y copia el código. Te llevará unos 30 segundos. O abre un efecto y copia el comando que aparece junto a «Instalar», por ejemplo npx motion-library add confetti --pieces 300. Se necesita Node.js 18 o posterior."],
    ["¿Los controles cambian lo que instala npx?", "Sí. Cada control que mueves se añade al comando como un flag (--pieces 300), y la CLI escribe esos valores en el archivo que copia. Restablece los controles y el comando vuelve a los valores por defecto."],
    ["¿Puedo copiar el código a mano?", "Sí. Copiar pone el archivo, con los valores de tus controles, en el portapapeles; Descargar .html te da una página que funciona por sí sola. Importa la exportación por defecto, llámala con un elemento contenedor que tenga tamaño y llama a la función que devuelve para limpiar."],
    ["¿Funciona con React, Vue o Svelte?", "Sí. Llama a la función en tu hook de montaje (useEffect, onMounted, onMount) con una ref a un elemento con tamaño y devuelve su limpieza. Prompt copia todo lo que un asistente de programación con IA necesita para integrarlo en tu componente."],
    ["¿Qué navegadores?", "Todos los navegadores actuales. Las piezas WebGL necesitan WebGL (lo tienen todos los navegadores modernos); unas pocas usan WebGL2. Sirve tu página desde un servidor local o tu servidor de desarrollo, porque los navegadores bloquean los módulos abiertos como archivos."],
    ["¿Son lo bastante rápidas para móviles?", "La mayoría van a 60 fps en un portátil y siguen fluidas en móviles recientes. Los shaders más pesados tienen un control de calidad o de cantidad: bájalo para móvil y monta solo los efectos que estén en pantalla."],
    ["¿De verdad es gratis?", "Sí. Todo está bajo la licencia MIT-0. Úsalas donde quieras, modifícalas libremente."],
  ],
  fr: [
    ["Qu’est-ce que c’est ?", "Une bibliothèque d’animations et d’effets web en direct. Chacun tient dans un seul fichier JavaScript pur, sans dépendance : survolez une carte pour le voir tourner, ouvrez-la pour lire comment il fonctionne, réglez-le avec les curseurs et récupérez le code."],
    ["Comment commencer ?", "Parcourez la bibliothèque, choisissez un effet qui vous plaît et copiez le code. Cela prend environ 30 secondes. Ou ouvrez un effet et copiez la commande à côté de « Installer », par exemple npx motion-library add confetti --pieces 300. Node.js 18 ou plus récent est requis."],
    ["Les curseurs changent-ils ce que npx installe ?", "Oui. Chaque curseur que vous déplacez est ajouté à la commande sous forme d’option (--pieces 300), et la CLI écrit ces valeurs dans le fichier qu’elle copie. Réinitialisez les curseurs et la commande revient aux valeurs par défaut."],
    ["Puis-je plutôt copier le code à la main ?", "Oui. Copier place le fichier, avec vos valeurs de curseurs, dans le presse-papiers ; Télécharger .html vous donne une page qui fonctionne toute seule. Importez l’export par défaut, appelez-le avec un élément conteneur qui a une taille, puis appelez la fonction qu’il renvoie pour nettoyer."],
    ["Ça marche avec React, Vue ou Svelte ?", "Oui. Appelez la fonction dans votre hook de montage (useEffect, onMounted, onMount) avec une ref vers un élément dimensionné et renvoyez son nettoyage. Prompt copie tout ce dont un assistant de code IA a besoin pour l’intégrer à votre composant."],
    ["Quels navigateurs ?", "Tous les navigateurs actuels. Les pièces WebGL ont besoin de WebGL (tous les navigateurs modernes le prennent en charge) ; quelques-unes utilisent WebGL2. Servez votre page depuis un serveur local ou votre serveur de développement, car les navigateurs bloquent les modules ouverts comme fichiers."],
    ["Sont-elles assez rapides pour les téléphones ?", "La plupart tournent à 60 fps sur un ordinateur portable et restent fluides sur les téléphones récents. Les shaders les plus lourds ont un curseur de qualité ou de quantité : baissez-le pour le mobile, et ne montez que les effets visibles à l’écran."],
    ["Est-ce vraiment gratuit ?", "Oui. Tout est sous licence MIT-0. Utilisez-les partout, modifiez-les librement."],
  ],
};
