const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// List of Coptic Saints with correct names and dates
const saints = [
  { name: 'Saint Marc', date: '08-05-2023' }, 
  { name: 'Saint George', date: '01-05-2023' },
  { name: 'Saint Mina', date: '24-11-2023' },
  { name: 'Saint Antoine', date: '30-01-2023' },
  { name: 'Saint Athanase', date: '15-05-2023' },
  { name: 'Saint Bishoy', date: '15-07-2023' },
  { name: 'Saint Samuel', date: '17-12-2023' },
  { name: 'Saint Moise le Noir', date: '01-07-2023' },
  { name: 'Saint Shenouda', date: '14-07-2023' },
  { name: 'Saint Cyril', date: '10-07-2023' },
  // Continue with your other Coptic saints...
];

// Redirect root "/" to "index.html"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to display a specific saint's page
app.get('/saint/:name', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'saint.html'));
});

// API route to get the Synaxarium section (ID 10) for each saint
app.get('/api/saint/:name', async (req, res) => {
  const saintName = req.params.name;
  const saint = saints.find(s => s.name === saintName);

  if (!saint) {
    return res.status(404).send('Saint non trouvé');
  }

  const apiUrl = `https://api.katameros.app/readings/gregorian/${saint.date}?languageId=1`;

  try {
    const response = await axios.get(apiUrl);
    console.log('API Response:', response.data); // Log full API response to inspect data structure

    const sections = response.data.sections;

    // Recursive function to find the Synaxaire section (ID: 10)
    function findSectionById(sections, id) {
      for (let section of sections) {
        if (section.id === id) {
          return section;
        }
        if (section.subSections) {
          const foundInSubSection = findSectionById(section.subSections, id);
          if (foundInSubSection) {
            return foundInSubSection;
          }
        }
      }
      return null;
    }

    const synaxariumSection = findSectionById(sections, 10);

    if (synaxariumSection) {
      if (synaxariumSection.readings) {
        const synaxariumContent = synaxariumSection.readings.map(reading => reading.html).join('<br>');
        return res.json(synaxariumContent);
      } else {
        return res.status(404).send('Aucune lecture trouvée dans la section Synaxaire');
      }
    } else {
      return res.status(404).send('Section Synaxaire non trouvée pour cette date');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error.message);
    res.status(500).send('Erreur lors de la récupération des données');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
