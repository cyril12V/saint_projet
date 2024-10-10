const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration du fichier de sortie
const outputFile = path.join(__dirname, 'saints_titles.txt');

// Fonction pour formater les dates en 'MM-DD-YYYY' ou 'DD-MM-YYYY' selon le calendrier
function formatDate(date, calendar = 'gregorian') {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = calendar === 'gregorian' ? date.getFullYear() : date.getFullYear() + 1725; // Ajuster l'année pour le calendrier copte
  return `${month}-${day}-${year}`;
}

// Fonction pour interroger l'API
async function fetchTitleForDate(date, calendar = 'gregorian') {
  const formattedDate = formatDate(date, calendar);
  const apiUrl = `https://api.katameros.app/readings/${calendar}/${formattedDate}?languageId=1`;

  try {
    const response = await axios.get(apiUrl);
    const sections = response.data.sections;

    // Trouver la section Synaxaire (ID: 10)
    const synaxariumSection = sections.find(section => section.id === 10);

    if (synaxariumSection && synaxariumSection.readings) {
      const reading = synaxariumSection.readings.find(reading => reading.id === 6);
      if (reading && reading.title) {
        return { date: formattedDate, title: reading.title };
      }
    }
    return { date: formattedDate, title: 'Titre non trouvé' };
  } catch (error) {
    console.error(`Erreur lors de la récupération des données pour ${formattedDate}:`, error.message);
    return { date: formattedDate, title: 'Erreur de récupération' };
  }
}

// Fonction pour interroger les deux calendriers et écrire les résultats dans un fichier
async function fetchAndSaveAllSaintTitles() {
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-12-31');
  let currentDate = new Date(startDate);
  let results = '';

  while (currentDate <= endDate) {
    // Récupérer les titres pour le calendrier grégorien
    const gregorianResult = await fetchTitleForDate(currentDate, 'gregorian');
    results += `Date Grégorienne: ${gregorianResult.date} - Titre: ${gregorianResult.title}\n`;

    // Récupérer les titres pour le calendrier copte
    const copticResult = await fetchTitleForDate(currentDate, 'coptic');
    results += `Date Copte: ${copticResult.date} - Titre: ${copticResult.title}\n`;

    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Écrire les résultats dans un fichier
  fs.writeFileSync(outputFile, results, 'utf-8');
  console.log(`Les titres des saints ont été sauvegardés dans le fichier: ${outputFile}`);
}

// Exécuter la fonction
fetchAndSaveAllSaintTitles();
