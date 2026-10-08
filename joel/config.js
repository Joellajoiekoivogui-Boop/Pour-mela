// Réglages du film de Joël.
//
// PHOTOS (facultatif) : dépose des photos de Joël dans le dossier photos/
// et liste-les ici, par exemple :
//   photos: ['photos/joel-1.jpg', 'photos/joel-2.jpg', 'photos/joel-3.jpg'],
// Elles apparaissent alors dans la scène « Les rêves », chacune dans un cadre
// de cinéma, puis se dissolvent en particules vers la suivante. Les photos ne
// sont jamais déformées ni retouchées : elles gardent leur apparence naturelle.
// Laisse la liste vide pour la version sans photo.
//
// Cadrage (facultatif) : au lieu d'un simple nom de fichier, on peut écrire
//   { src: 'photos/x.jpg', x: 0.5, y: 0.4, zoom: 1.5 }
// x et y (de 0 à 1) désignent le point à garder au centre du cadre, zoom
// rapproche la photo. La photo n'est jamais déformée.
window.JOEL = {
  // Une photo par mot : RÊVER, APPRENDRE, CRÉER, CONSTRUIRE, IMPACTER.
  photos: [
    { src: 'photos/joel-4.jpg', x: 0.52, y: 0.42, zoom: 1.9 },
    'photos/joel-2.jpg',
    'photos/joel-1.jpg',
    'photos/joel-3.jpg',
    { src: 'photos/joel-5.jpg', y: 0.45 },
  ],
};
