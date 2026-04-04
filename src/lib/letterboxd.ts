// Letterboxd CSV export parser
// Users export from: letterboxd.com/settings/data/ → Export Your Data
// The "watched.csv" file has columns: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date

export interface LetterboxdEntry {
  title: string;
  year: string;
  letterboxd_uri: string;
  rating: string;
}

export function parseLetterboxdCSV(csvText: string): LetterboxdEntry[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  const nameIdx = header.findIndex(h => h === 'name');
  const yearIdx = header.findIndex(h => h === 'year');
  const uriIdx = header.findIndex(h => h.includes('letterboxd uri') || h.includes('url'));
  const ratingIdx = header.findIndex(h => h === 'rating');

  if (nameIdx === -1) {
    // Fallback: maybe it's just a list of titles (one per line, no header)
    return lines.map(line => ({
      title: line,
      year: '',
      letterboxd_uri: '',
      rating: '',
    }));
  }

  const results: LetterboxdEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const title = cols[nameIdx]?.trim();
    if (!title) continue;

    results.push({
      title,
      year: yearIdx >= 0 ? (cols[yearIdx]?.trim() ?? '') : '',
      letterboxd_uri: uriIdx >= 0 ? (cols[uriIdx]?.trim() ?? '') : '',
      rating: ratingIdx >= 0 ? (cols[ratingIdx]?.trim() ?? '') : '',
    });
  }

  return results;
}

// Simple CSV line parser that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
