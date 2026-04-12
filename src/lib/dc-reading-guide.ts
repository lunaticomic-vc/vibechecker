export interface ReadingGuideEntry {
  title: string;
  writer: string;
  artist?: string;
  year: string;
  era: DCEra;
  format: ComicFormat;
  issueCount?: string;
  description: string;
  character?: string;
  event?: string;
  imprint?: string;
}

export type DCEra = 'pre-crisis' | 'post-crisis' | 'new-52' | 'rebirth' | 'infinite-frontier' | 'dawn-of-dc' | 'dc-all-in' | 'black-label';
export type ComicFormat = 'single' | 'tpb' | 'hardcover' | 'omnibus' | 'graphic-novel';

export const ERA_LABELS: Record<DCEra, string> = {
  'pre-crisis': 'Pre-Crisis',
  'post-crisis': 'Post-Crisis',
  'new-52': 'New 52',
  'rebirth': 'Rebirth',
  'infinite-frontier': 'Infinite Frontier',
  'dawn-of-dc': 'Dawn of DC',
  'dc-all-in': 'DC All In',
  'black-label': 'Black Label',
};

export const ERA_COLORS: Record<DCEra, string> = {
  'pre-crisis': 'bg-amber-50 text-amber-700 border-amber-200',
  'post-crisis': 'bg-blue-50 text-blue-700 border-blue-200',
  'new-52': 'bg-red-50 text-red-700 border-red-200',
  'rebirth': 'bg-sky-50 text-sky-700 border-sky-200',
  'infinite-frontier': 'bg-violet-50 text-violet-700 border-violet-200',
  'dawn-of-dc': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'dc-all-in': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'black-label': 'bg-zinc-100 text-zinc-700 border-zinc-300',
};

export type GuideCharacter = 'batman' | 'superman' | 'wonder-woman' | 'flash' | 'green-lantern' | 'aquaman' | 'justice-league' | 'teen-titans' | 'swamp-thing' | 'constantine';

export const CHARACTER_LABELS: Record<GuideCharacter, string> = {
  'batman': 'Batman',
  'superman': 'Superman',
  'wonder-woman': 'Wonder Woman',
  'flash': 'Flash',
  'green-lantern': 'Green Lantern',
  'aquaman': 'Aquaman',
  'justice-league': 'Justice League',
  'teen-titans': 'Teen Titans',
  'swamp-thing': 'Swamp Thing',
  'constantine': 'Constantine',
};

export const CHARACTER_ICONS: Record<GuideCharacter, string> = {
  'batman': '◆',
  'superman': '◇',
  'wonder-woman': '★',
  'flash': '✦',
  'green-lantern': '◉',
  'aquaman': '⊹',
  'justice-league': '✸',
  'teen-titans': '▽',
  'swamp-thing': '❧',
  'constantine': '♠',
};

// Curated reading orders by character — essential runs only, ordered chronologically
export const CHARACTER_GUIDES: Record<GuideCharacter, ReadingGuideEntry[]> = {
  batman: [
    { title: 'Batman: Year One', writer: 'Frank Miller', artist: 'David Mazzucchelli', year: '1987', era: 'post-crisis', format: 'tpb', issueCount: '4 issues', description: 'The definitive Batman origin. Bruce Wayne returns to Gotham and becomes the Dark Knight alongside Jim Gordon\'s rise through the GCPD.', character: 'batman' },
    { title: 'The Long Halloween', writer: 'Jeph Loeb', artist: 'Tim Sale', year: '1996', era: 'post-crisis', format: 'tpb', issueCount: '13 issues', description: 'A year-long murder mystery with Holiday killer striking on each holiday. Features the fall of Harvey Dent and early rogues gallery.', character: 'batman' },
    { title: 'Dark Victory', writer: 'Jeph Loeb', artist: 'Tim Sale', year: '1999', era: 'post-crisis', format: 'tpb', issueCount: '13 issues', description: 'Sequel to Long Halloween. A new serial killer, the Hangman, while Bruce meets Dick Grayson. The first Robin origin story.', character: 'batman' },
    { title: 'The Killing Joke', writer: 'Alan Moore', artist: 'Brian Bolland', year: '1988', era: 'post-crisis', format: 'graphic-novel', description: 'The Joker\'s ambiguous origin and his attempt to prove anyone can go mad. Dark, philosophical, and genre-defining.', character: 'batman' },
    { title: 'Arkham Asylum: A Serious House on Serious Earth', writer: 'Grant Morrison', artist: 'Dave McKean', year: '1989', era: 'post-crisis', format: 'graphic-novel', description: 'Surreal, psychological horror as Batman enters Arkham after inmates take over. Painted art creates a dreamlike nightmare.', character: 'batman' },
    { title: 'Knightfall', writer: 'Various', artist: 'Various', year: '1993', era: 'post-crisis', format: 'tpb', issueCount: '~100 issues', description: 'Bane breaks Batman\'s back. Azrael takes over the cowl and descends into violence, forcing Bruce\'s return.', character: 'batman' },
    { title: 'No Man\'s Land', writer: 'Various', artist: 'Various', year: '1999', era: 'post-crisis', format: 'tpb', issueCount: '80+ issues', description: 'Gotham is devastated by an earthquake and cut off from the US. Batman and allies fight to reclaim the city block by block.', character: 'batman' },
    { title: 'Hush', writer: 'Jeph Loeb', artist: 'Jim Lee', year: '2002', era: 'post-crisis', format: 'tpb', issueCount: '12 issues', description: 'A mysterious new villain manipulates Batman\'s rogues gallery. Jim Lee\'s art at its peak with a tour of the entire Batman world.', character: 'batman' },
    { title: 'Under the Red Hood', writer: 'Judd Winick', artist: 'Doug Mahnke', year: '2005', era: 'post-crisis', format: 'tpb', issueCount: '12 issues', description: 'Jason Todd returns from the dead as the Red Hood, challenging Batman\'s no-kill rule. Emotionally devastating.', character: 'batman' },
    { title: 'Batman & Son / Batman and Robin', writer: 'Grant Morrison', year: '2006', era: 'post-crisis', format: 'tpb', issueCount: '~40 issues', description: 'Morrison\'s epic run introducing Damian Wayne, the Batman of Zur-En-Arrh, and Dick Grayson as Batman.', character: 'batman' },
    { title: 'Court of Owls / City of Owls', writer: 'Scott Snyder', artist: 'Greg Capullo', year: '2011', era: 'new-52', format: 'tpb', issueCount: '11 issues', description: 'A secret society has controlled Gotham for centuries. Snyder & Capullo\'s run begins with this masterpiece that redefines Batman\'s relationship with his city.', character: 'batman' },
    { title: 'Death of the Family', writer: 'Scott Snyder', artist: 'Greg Capullo', year: '2012', era: 'new-52', format: 'tpb', issueCount: '5 issues', description: 'The Joker returns with his face cut off, targeting the entire Bat-family. Psychological horror at its finest.', character: 'batman' },
    { title: 'Zero Year', writer: 'Scott Snyder', artist: 'Greg Capullo', year: '2013', era: 'new-52', format: 'tpb', issueCount: '12 issues', description: 'Snyder\'s New 52 origin for Batman. Vibrant, neon-lit, and different from Year One in the best way.', character: 'batman' },
    { title: 'Endgame', writer: 'Scott Snyder', artist: 'Greg Capullo', year: '2014', era: 'new-52', format: 'tpb', issueCount: '6 issues', description: 'The Joker declares war on all of Gotham. Reveals his possible immortal nature. The definitive Batman vs Joker finale.', character: 'batman' },
    { title: 'Batman (Tom King run)', writer: 'Tom King', artist: 'Various', year: '2016', era: 'rebirth', format: 'tpb', issueCount: '85 issues', description: 'An emotional, literary take on Batman. The Bat/Cat romance, the War of Jokes and Riddles, Knightmares. Divisive but deeply personal.', character: 'batman' },
    { title: 'Batman: White Knight', writer: 'Sean Murphy', year: '2017', era: 'black-label', format: 'tpb', issueCount: '8 issues', description: 'What if Joker was cured and became Gotham\'s savior while Batman was the real threat? Gorgeous art and a fresh perspective.', character: 'batman', imprint: 'Black Label' },
    { title: 'The Batman Who Laughs', writer: 'Scott Snyder', artist: 'Jock', year: '2018', era: 'rebirth', format: 'tpb', issueCount: '7 issues', description: 'A Bruce Wayne infected by Joker toxin from the Dark Multiverse. Horror-tinged and deeply unsettling.', character: 'batman' },
    { title: 'Batman: The Imposter', writer: 'Mattson Tomlin', artist: 'Andrea Sorrentino', year: '2021', era: 'black-label', format: 'tpb', issueCount: '3 issues', description: 'Grounded, Year Two-era story. A copycat killer and a psychologist investigating Batman. Cinematic and noir.', character: 'batman', imprint: 'Black Label' },
  ],
  superman: [
    { title: 'All-Star Superman', writer: 'Grant Morrison', artist: 'Frank Quitely', year: '2005', era: 'post-crisis', format: 'tpb', issueCount: '12 issues', description: 'Superman is dying from solar overexposure. His final days are spent being the most Superman he can be. The definitive Superman story.', character: 'superman' },
    { title: 'Superman: Birthright', writer: 'Mark Waid', artist: 'Leinil Francis Yu', year: '2003', era: 'post-crisis', format: 'tpb', issueCount: '12 issues', description: 'A modern retelling of Superman\'s origin. Clark as a journalist finding his purpose. Emotional and deeply human.', character: 'superman' },
    { title: 'Superman: Secret Identity', writer: 'Kurt Busiek', artist: 'Stuart Immonen', year: '2004', era: 'post-crisis', format: 'tpb', issueCount: '4 issues', description: 'In our world, a boy named Clark Kent discovers he has Superman\'s powers. A quiet, beautiful meditation on identity and growing up.', character: 'superman' },
    { title: 'Kingdom Come', writer: 'Mark Waid', artist: 'Alex Ross', year: '1996', era: 'post-crisis', format: 'tpb', issueCount: '4 issues', description: 'Superman returns from retirement in a dark future where violent anti-heroes have taken over. Alex Ross\'s painted art is breathtaking.', character: 'superman' },
    { title: 'Superman: Red Son', writer: 'Mark Millar', artist: 'Dave Johnson', year: '2003', era: 'post-crisis', format: 'graphic-novel', issueCount: '3 issues', description: 'What if Kal-El landed in the Soviet Union instead of Kansas? A brilliant Elseworlds political thriller.', character: 'superman' },
    { title: 'Action Comics (Morrison run)', writer: 'Grant Morrison', artist: 'Rags Morales', year: '2011', era: 'new-52', format: 'tpb', issueCount: '18 issues', description: 'Young Superman in a t-shirt and jeans fighting corporate greed. Morrison brings Golden Age populist energy to the New 52.', character: 'superman' },
    { title: 'Superman: Rebirth (Tomasi/Gleason)', writer: 'Peter Tomasi', artist: 'Patrick Gleason', year: '2016', era: 'rebirth', format: 'tpb', issueCount: '45 issues', description: 'Superman as a father raising Jon Kent. Warm, hopeful, and adventurous. The best modern Superman run.', character: 'superman' },
    { title: 'Superman: Up in the Sky', writer: 'Tom King', artist: 'Andy Kubert', year: '2019', era: 'rebirth', format: 'tpb', issueCount: '6 issues', description: 'Superman travels across the galaxy to save one kidnapped girl. Each issue examines why he never gives up.', character: 'superman' },
  ],
  'wonder-woman': [
    { title: 'Wonder Woman by George Pérez', writer: 'George Pérez', year: '1987', era: 'post-crisis', format: 'tpb', issueCount: '62 issues', description: 'The definitive post-Crisis Wonder Woman. Deep Greek mythology, Diana as ambassador of peace. The foundation everything builds on.', character: 'wonder-woman' },
    { title: 'Wonder Woman: The Hiketeia', writer: 'Greg Rucka', artist: 'J.G. Jones', year: '2002', era: 'post-crisis', format: 'graphic-novel', description: 'Diana grants sanctuary to a woman hunted by Batman. Greek tragedy structure with real moral weight.', character: 'wonder-woman' },
    { title: 'Wonder Woman by Greg Rucka (Vol 1)', writer: 'Greg Rucka', year: '2003', era: 'post-crisis', format: 'tpb', issueCount: '25 issues', description: 'Diana as ambassador and warrior. Political intrigue, Medusa fight, and the most grounded take on WW.', character: 'wonder-woman' },
    { title: 'Wonder Woman: The Circle', writer: 'Gail Simone', year: '2008', era: 'post-crisis', format: 'tpb', issueCount: '30 issues', description: 'Simone writes Diana with warmth and fury. Gorilla warriors, secret Amazon conspiracies, and Diana at her most compassionate.', character: 'wonder-woman' },
    { title: 'Wonder Woman by Brian Azzarello', writer: 'Brian Azzarello', artist: 'Cliff Chiang', year: '2011', era: 'new-52', format: 'tpb', issueCount: '35 issues', description: 'Reimagines WW through Greek mythology horror. The Olympian gods are terrifying and beautiful. Best New 52 series alongside Batman.', character: 'wonder-woman' },
    { title: 'Wonder Woman by Greg Rucka (Rebirth)', writer: 'Greg Rucka', artist: 'Liam Sharp / Nicola Scott', year: '2016', era: 'rebirth', format: 'tpb', issueCount: '25 issues', description: 'Alternating arcs — "The Lies" (present) and "Year One" (origin). Rucka returns to deconstruct and rebuild Diana beautifully.', character: 'wonder-woman' },
  ],
  flash: [
    { title: 'The Flash by Mark Waid', writer: 'Mark Waid', year: '1992', era: 'post-crisis', format: 'tpb', issueCount: '~100 issues', description: 'Wally West defines the Speed Force and steps out of Barry\'s shadow. "Born to Run" through "The Return of Barry Allen" — essential.', character: 'flash' },
    { title: 'The Flash by Geoff Johns', writer: 'Geoff Johns', year: '2000', era: 'post-crisis', format: 'tpb', issueCount: '~60 issues', description: 'Introduces the Rogues as a code-bound family. Blitz, Rogue War, and emotional character work that made Wally iconic.', character: 'flash' },
    { title: 'The Flash: Rebirth', writer: 'Geoff Johns', artist: 'Ethan Van Sciver', year: '2009', era: 'post-crisis', format: 'tpb', issueCount: '6 issues', description: 'Barry Allen returns from the dead and rediscovers his connection to the Speed Force. Setup for Flashpoint.', character: 'flash' },
    { title: 'Flashpoint', writer: 'Geoff Johns', artist: 'Andy Kubert', year: '2011', era: 'post-crisis', format: 'tpb', issueCount: '5 issues', description: 'Barry wakes up in a world where everything is wrong. Thomas Wayne is Batman. The event that triggered the New 52.', character: 'flash', event: 'Flashpoint' },
    { title: 'The Flash by Francis Manapul', writer: 'Francis Manapul', year: '2011', era: 'new-52', format: 'tpb', issueCount: '25 issues', description: 'Visually stunning. Manapul\'s page layouts are inventive and kinetic. Barry rebuilds his life in the New 52.', character: 'flash' },
    { title: 'The Flash by Joshua Williamson', writer: 'Joshua Williamson', year: '2016', era: 'rebirth', format: 'tpb', issueCount: '101 issues', description: 'The longest Flash run ever. Speed Force storms, Godspeed, Flash War, and great Wally West moments.', character: 'flash' },
  ],
  'green-lantern': [
    { title: 'Green Lantern: Rebirth', writer: 'Geoff Johns', artist: 'Ethan Van Sciver', year: '2004', era: 'post-crisis', format: 'tpb', issueCount: '6 issues', description: 'Hal Jordan returns as Green Lantern. The start of Johns\' decade-long GL epic. Reintroduces the emotional spectrum.', character: 'green-lantern' },
    { title: 'Green Lantern: Sinestro Corps War', writer: 'Geoff Johns', year: '2007', era: 'post-crisis', format: 'tpb', issueCount: '11 issues', description: 'Sinestro builds his own corps powered by fear. An epic space war that redefined what GL could be.', character: 'green-lantern', event: 'Sinestro Corps War' },
    { title: 'Blackest Night', writer: 'Geoff Johns', artist: 'Ivan Reis', year: '2009', era: 'post-crisis', format: 'tpb', issueCount: '8 issues', description: 'The dead rise as Black Lanterns. Every color of the emotional spectrum unites. The culmination of Johns\' entire GL saga.', character: 'green-lantern', event: 'Blackest Night' },
    { title: 'Green Lantern by Grant Morrison', writer: 'Grant Morrison', artist: 'Liam Sharp', year: '2018', era: 'rebirth', format: 'tpb', issueCount: '12 issues', description: 'Weird, cosmic, Silver Age-inspired GL. Hal as a space cop solving bizarre cases. Morrison at their most imaginative.', character: 'green-lantern' },
  ],
  aquaman: [
    { title: 'Aquaman by Peter David', writer: 'Peter David', year: '1994', era: 'post-crisis', format: 'tpb', issueCount: '46 issues', description: 'The run that made Aquaman a badass. Long hair, hook hand, and Atlantean political intrigue.', character: 'aquaman' },
    { title: 'Aquaman by Geoff Johns', writer: 'Geoff Johns', artist: 'Ivan Reis', year: '2011', era: 'new-52', format: 'tpb', issueCount: '25 issues', description: 'Directly addresses "Aquaman is lame" and proves otherwise. The Trench, Throne of Atlantis, and Arthur as a reluctant king.', character: 'aquaman' },
    { title: 'Aquaman by Kelly Sue DeConnick', writer: 'Kelly Sue DeConnick', year: '2018', era: 'rebirth', format: 'tpb', issueCount: '15 issues', description: 'Arthur loses his memory and washes up in a mysterious village. Mythic, lyrical, and deeply weird in the best way.', character: 'aquaman' },
  ],
  'justice-league': [
    { title: 'JLA by Grant Morrison', writer: 'Grant Morrison', artist: 'Howard Porter', year: '1997', era: 'post-crisis', format: 'tpb', issueCount: '41 issues', description: 'The Big Seven together against cosmic threats. Morrison treats the League as modern mythology. New World Order through World War III.', character: 'justice-league' },
    { title: 'JLA: Tower of Babel', writer: 'Mark Waid', artist: 'Howard Porter', year: '2000', era: 'post-crisis', format: 'tpb', issueCount: '4 issues', description: 'Ra\'s al Ghul steals Batman\'s contingency plans to neutralize every Justice League member. Trust is shattered.', character: 'justice-league' },
    { title: 'Identity Crisis', writer: 'Brad Meltzer', artist: 'Rags Morales', year: '2004', era: 'post-crisis', format: 'tpb', issueCount: '7 issues', description: 'A murder mystery that exposes dark secrets the League has kept hidden. Controversial but gripping.', character: 'justice-league' },
    { title: 'Justice League by Geoff Johns', writer: 'Geoff Johns', artist: 'Jim Lee', year: '2011', era: 'new-52', format: 'tpb', issueCount: '50 issues', description: 'The New 52 starting point. The League forms for the first time, leading to Trinity War and Darkseid War.', character: 'justice-league' },
    { title: 'Justice League by Scott Snyder', writer: 'Scott Snyder', artist: 'Jorge Jiménez', year: '2018', era: 'rebirth', format: 'tpb', issueCount: '39 issues', description: 'Cosmic-scale storytelling. The Totality, the Legion of Doom, and the source of the Multiverse. Wild and ambitious.', character: 'justice-league' },
  ],
  'teen-titans': [
    { title: 'The New Teen Titans by Marv Wolfman & George Pérez', writer: 'Marv Wolfman', artist: 'George Pérez', year: '1980', era: 'pre-crisis', format: 'tpb', issueCount: '~130 issues', description: 'The run that made Teen Titans a top-tier book. Introduced Deathstroke, Raven, Starfire, Cyborg. "The Judas Contract" is iconic.', character: 'teen-titans' },
    { title: 'Teen Titans by Geoff Johns', writer: 'Geoff Johns', artist: 'Mike McKone', year: '2003', era: 'post-crisis', format: 'tpb', issueCount: '50 issues', description: 'Tim Drake Robin leads a new generation. Ties directly into Identity Crisis and Infinite Crisis. Great team dynamics.', character: 'teen-titans' },
  ],
  'swamp-thing': [
    { title: 'Saga of the Swamp Thing by Alan Moore', writer: 'Alan Moore', artist: 'Stephen Bissette', year: '1984', era: 'pre-crisis', format: 'tpb', issueCount: '43 issues', description: 'Moore reinvents Swamp Thing as a plant elemental who thinks he was human. Horror, ecology, and transcendence. Changed comics forever.', character: 'swamp-thing' },
    { title: 'Swamp Thing by Scott Snyder', writer: 'Scott Snyder', artist: 'Yanick Paquette', year: '2011', era: 'new-52', format: 'tpb', issueCount: '18 issues', description: 'The Green vs The Rot. Alec Holland resists and then embraces being Swamp Thing. Gorgeous and horrific.', character: 'swamp-thing' },
    { title: 'Swamp Thing by Ram V', writer: 'Ram V', artist: 'Mike Perkins', year: '2021', era: 'infinite-frontier', format: 'tpb', issueCount: '16 issues', description: 'Levi Kamei becomes the new Swamp Thing. Atmospheric, philosophical, and beautifully written.', character: 'swamp-thing' },
  ],
  constantine: [
    { title: 'Hellblazer: Original Sins', writer: 'Jamie Delano', year: '1988', era: 'post-crisis', format: 'tpb', issueCount: '9 issues', description: 'The start of Hellblazer. John Constantine battles demons, addiction, and Thatcher-era Britain. Raw and political.', character: 'constantine' },
    { title: 'Hellblazer: Dangerous Habits', writer: 'Garth Ennis', year: '1991', era: 'post-crisis', format: 'tpb', issueCount: '6 issues', description: 'Constantine gets lung cancer and cons his way out of Hell. The basis for the Keanu Reeves film. Peak Constantine.', character: 'constantine' },
    { title: 'Hellblazer by Mike Carey', writer: 'Mike Carey', year: '2002', era: 'post-crisis', format: 'tpb', issueCount: '35 issues', description: 'Constantine faces literal demons from his past. Carey writes the most emotionally complex John.', character: 'constantine' },
  ],
};

// Major DC events for event-based reading
export interface EventEntry {
  title: string;
  writer: string;
  year: string;
  era: DCEra;
  issueCount: string;
  description: string;
  essentialTieIns?: string[];
}

export const MAJOR_EVENTS: EventEntry[] = [
  { title: 'Crisis on Infinite Earths', writer: 'Marv Wolfman', year: '1985', era: 'pre-crisis', issueCount: '12 issues', description: 'The Anti-Monitor destroys the multiverse. Deaths of Supergirl and Barry Allen. Reset DC continuity into a single Earth. The original crossover event.' },
  { title: 'The Death of Superman', writer: 'Dan Jurgens', year: '1992', era: 'post-crisis', issueCount: '~30 issues', description: 'Doomsday kills Superman. Four replacements emerge. A cultural phenomenon that transcended comics.', essentialTieIns: ['Funeral for a Friend', 'Reign of the Supermen'] },
  { title: 'Knightfall', writer: 'Various', year: '1993', era: 'post-crisis', issueCount: '~100 issues', description: 'Bane breaks Batman. Azrael takes the cowl and goes too far. Bruce must reclaim his identity.' },
  { title: 'Kingdom Come', writer: 'Mark Waid', year: '1996', era: 'post-crisis', issueCount: '4 issues', description: 'Painted by Alex Ross. An aging Superman returns in a future overrun by violent anti-heroes. Definitive meditation on what superheroes mean.' },
  { title: 'Infinite Crisis', writer: 'Geoff Johns', year: '2005', era: 'post-crisis', issueCount: '7 issues', description: 'Survivors of the original Crisis return, believing they can create a better world. Restores the 52-Earth multiverse.', essentialTieIns: ['Identity Crisis', 'OMAC Project', 'Villains United'] },
  { title: 'Final Crisis', writer: 'Grant Morrison', year: '2008', era: 'post-crisis', issueCount: '7 issues', description: 'Darkseid wins. Reality collapses. Batman fires a gun. Superman sings. Dense, literary, and polarizing. Morrison\'s magnum opus.' },
  { title: 'Flashpoint', writer: 'Geoff Johns', year: '2011', era: 'post-crisis', issueCount: '5 issues', description: 'Barry Allen wakes in a world where Thomas Wayne is Batman and Atlanteans fight Amazons. Triggers the New 52 reboot.' },
  { title: 'Forever Evil', writer: 'Geoff Johns', year: '2013', era: 'new-52', issueCount: '7 issues', description: 'The Crime Syndicate conquers Earth. Only the villains can fight back. Lex Luthor becomes the unlikely hero.' },
  { title: 'Dark Nights: Metal', writer: 'Scott Snyder', year: '2017', era: 'rebirth', issueCount: '6 issues', description: 'The Dark Multiverse opens. Evil Batmen invade. Heavy metal aesthetics and cosmic horror. The Batman Who Laughs debuts.', essentialTieIns: ['Batman: Lost', 'Hawkman: Found'] },
  { title: 'Heroes in Crisis', writer: 'Tom King', year: '2018', era: 'rebirth', issueCount: '9 issues', description: 'A mass shooting at Sanctuary, a superhero therapy center. Wally West at the center. Controversial but emotionally raw.' },
  { title: 'Dark Nights: Death Metal', writer: 'Scott Snyder', year: '2020', era: 'rebirth', issueCount: '7 issues', description: 'The Batman Who Laughs rules a twisted Earth. Wonder Woman leads the resistance. Establishes the Omniverse — "everything happened."' },
  { title: 'Dark Crisis on Infinite Earths', writer: 'Joshua Williamson', year: '2022', era: 'infinite-frontier', issueCount: '7 issues', description: 'The Justice League dies. The next generation must step up. Restores the infinite multiverse.' },
  { title: 'Absolute Power', writer: 'Mark Waid', year: '2024', era: 'dawn-of-dc', issueCount: '4 issues', description: 'Amanda Waller strips every hero of their powers. The entire DCU fights back. Leads into DC All In.' },
];

// Recommended starting points for new readers
export interface StartingPoint {
  label: string;
  description: string;
  entries: ReadingGuideEntry[];
}

export const STARTING_POINTS: StartingPoint[] = [
  {
    label: 'Brand New to DC',
    description: 'Never read a comic? Start here.',
    entries: [
      { title: 'Batman: Year One', writer: 'Frank Miller', artist: 'David Mazzucchelli', year: '1987', era: 'post-crisis', format: 'tpb', description: 'The best Batman origin and a perfect first comic.' },
      { title: 'All-Star Superman', writer: 'Grant Morrison', artist: 'Frank Quitely', year: '2005', era: 'post-crisis', format: 'tpb', description: 'Everything Superman should be in 12 perfect issues.' },
      { title: 'Wonder Woman by Brian Azzarello', writer: 'Brian Azzarello', artist: 'Cliff Chiang', year: '2011', era: 'new-52', format: 'tpb', description: 'Greek mythology reimagined. Self-contained and stunning.' },
      { title: 'Saga of the Swamp Thing', writer: 'Alan Moore', year: '1984', era: 'pre-crisis', format: 'tpb', description: 'The comic that proved the medium is art.' },
    ],
  },
  {
    label: 'Jump Into Modern DC',
    description: 'Start fresh with Rebirth (2016) — the easiest on-ramp.',
    entries: [
      { title: 'DC Universe: Rebirth #1', writer: 'Geoff Johns', year: '2016', era: 'rebirth', format: 'single', description: 'The one-shot that launched Rebirth. Wally West returns. A love letter to DC history.' },
      { title: 'Batman by Tom King', writer: 'Tom King', year: '2016', era: 'rebirth', format: 'tpb', description: 'Start with "I Am Gotham." Literary, emotional Batman.' },
      { title: 'Superman: Rebirth', writer: 'Peter Tomasi', year: '2016', era: 'rebirth', format: 'tpb', description: 'Superman as a dad. Warm and adventurous.' },
      { title: 'Wonder Woman by Greg Rucka', writer: 'Greg Rucka', year: '2016', era: 'rebirth', format: 'tpb', description: '"Year One" and "The Lies" — a masterful dual-timeline origin.' },
    ],
  },
  {
    label: 'Dark & Mature',
    description: 'DC Black Label and Vertigo — for when you want something heavier.',
    entries: [
      { title: 'Batman: White Knight', writer: 'Sean Murphy', year: '2017', era: 'black-label', format: 'tpb', description: 'What if Joker was the hero? Beautiful art, morally grey.', imprint: 'Black Label' },
      { title: 'Hellblazer: Dangerous Habits', writer: 'Garth Ennis', year: '1991', era: 'post-crisis', format: 'tpb', description: 'Constantine cons the Devil. Dark, funny, brilliant.' },
      { title: 'Sandman', writer: 'Neil Gaiman', year: '1989', era: 'post-crisis', format: 'tpb', description: 'Morpheus, lord of dreams. Not superhero — literary fantasy. One of the greatest comics ever.', imprint: 'Vertigo' },
      { title: 'Watchmen', writer: 'Alan Moore', artist: 'Dave Gibbons', year: '1986', era: 'post-crisis', format: 'tpb', description: 'Deconstructs superheroes. Dense, layered, and a masterpiece of the medium.' },
    ],
  },
];
