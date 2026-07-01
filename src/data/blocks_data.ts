// Development Blocks organized by State → District
// Source: Official NIC district websites (*.nic.in), Census 2011, GOI LGD Directory
// Coverage: Uttar Pradesh (73/75 districts), expanding to other states

export interface BlockEntry {
  name: string
}

export type BlocksByDistrict = Record<string, string[]>
export type BlocksByState = Record<string, BlocksByDistrict>

export const BLOCKS_DATA: BlocksByState = {
  "Uttar Pradesh": {
    // ── Agra Division ──────────────────────────────────────────────────────────
    "Agra": ["Acchnera", "Akola", "Bah", "Baroli Ahir", "Bichpuri", "Etmadpur", "Fatehabad", "Fatehpur Sikri", "Jagner", "Jaitpur Kalan", "Khandauli", "Kheragarh", "Pinahat", "Sainyan", "Shamsabad"],
    "Firozabad": ["Firozabad", "Shikohabad", "Tundla", "Jasrana", "Eka", "Narkhi", "Madanpur", "Araon", "Hathwant"],
    "Mathura": ["Nandgaon", "Chhata", "Chaumuha", "Goverdhan", "Mathura", "Farah", "Raya", "Baldeo", "Naujheel", "Mant"],
    "Mainpuri": ["Mainpuri", "Bhongaon", "Kishni", "Karhal", "Kuraoli", "Ghiror", "Sultanganj", "Bewar", "Jagir"],
    "Etah": ["Sheetalpur", "Sakit", "Nidhauli Kalan", "Marahara", "Jalesar", "Awagarh", "Jaithara", "Aliganj"],
    "Hathras": ["Hathras", "Mursan", "Sasni", "Sikandra Rao", "Hasayan", "Sadabad", "Sahpau"],
    "Kasganj": ["Sahawar", "Kasganj", "Amanpur", "Soron", "Sidhpura", "Ganj Dundwara", "Patiyali"],
    "Aligarh": ["Tappal", "Chandaus", "Khair", "Jawan", "Lodha", "Dhanipur", "Gonda", "Iglas", "Atrauli", "Bijauli", "Gangiri", "Akarabad"],
    // ── Meerut Division ───────────────────────────────────────────────────────
    "Meerut": ["Jaani", "Kharkhoda", "Meerut", "Rajpura", "Rohta", "Hastinapur", "Machara", "Mawana", "Parikshitgarh", "Daurala", "Sardhana", "Saroorpur"],
    "Hapur": ["Garhmukteshwar", "Dhaulana", "Simbhavali", "Hapur"],
    "Bagpat": ["Baghpat", "Khekra", "Baraut", "Chhaprauli", "Binauli", "Pilana"],
    "Bulandshahar": ["Bulandshahr", "Agauta", "Gulaothi", "Lakhaoti", "Sikandrabad", "Khurja", "Arnia", "Anoopshahr", "Jhangirabad", "Shikarpur", "Pahasu", "Siyana", "Unchagaon", "Bb Nagar", "Dibai", "Danpur"],
    "Ghaziabad": ["Rajapur", "Bhojpur", "Muradnagar", "Loni"],
    "Gautam Buddha Nagar": ["Bisrakh", "Dadri", "Dankaur", "Jewar"],
    // ── Moradabad Division ────────────────────────────────────────────────────
    "Moradabad": ["Moradabad", "Mundapandey", "Bhagatpur Tanda", "Bilari", "Kundarki", "Chajlet", "Thakurdwara", "Dilari"],
    "Rampur": ["Bilaspur", "Chamrawa", "Milak", "Saidnagar", "Shahabad", "Swar"],
    "Amroha": ["Amroha", "Joya", "Hasanpur", "Dhanaura", "Gajraula", "Gangeshwari"],
    "Sambhal": ["Bahjoi", "Sambhal", "Asmoli", "Rajpura", "Gunnaur", "Baniyakheda", "Junawai", "Panwasa"],
    "Bijnor": ["Mohammadpur Deomal", "Haldaur", "Kiratpur", "Najibabad", "Kotwali", "Nehtaur", "Noorpur", "Dhampur", "Afzalgarh", "Sehora", "Jalilpur"],
    // ── Bareilly Division ─────────────────────────────────────────────────────
    "Bareilly": ["Alampur Zafarabad", "Bahedi", "Bhadpura", "Bhojipura", "Bhuta", "Bithri Chainpur", "Fareedpur", "Fatehganj West", "Kyara", "Majhgawa", "Meerganj", "Nawabganj", "Ramnagar", "Richha", "Shergarh"],
    "Pilibhit": ["Amaria", "Marauri", "Lalaurikhera", "Barkhera", "Bilsanda", "Bisalpur", "Puranpur"],
    "Shahjahanpur": ["Banda", "Khutar", "Powayan", "Sindhauli", "Katra Khudaganj", "Jaitipur", "Tilhar", "Nigohi", "Kanth", "Dadraul", "Bhawalkhera", "Madnapur", "Kalan", "Mirzapur", "Jalalabad"],
    "Budaun": ["Ambiapur", "Asafpur", "Bisauli", "Dahgavan", "Dataganj", "Islamnagar", "Jagat", "Mion", "Qadar Chowk", "Sahaswan", "Salarpur", "Samrer", "Ujhani", "Usawan", "Wazirganj"],
    // ── Saharanpur Division ───────────────────────────────────────────────────
    "Saharanpur": ["Muzaffarabad", "Sadauli Kadeem", "Ballia Kheri", "Punwarka", "Nakur", "Gangoh", "Sarsawa", "Rampur Maniharan", "Nanauta", "Deoband", "Nagal"],
    "Muzaffarnagar": ["Sadar Kukda", "Budhana", "Baghra", "Shahpur", "Purquazi", "Charthawal", "Morna", "Jansath", "Khatauli"],
    "Shamli": ["Shamli", "Kairana", "Thana Bhawan", "Bhola", "Lisad", "Unchana"],
    // ── Lucknow Division ──────────────────────────────────────────────────────
    "Lucknow": ["Mall", "Malihabad", "Chinhat", "Bakhshi Ka Talab", "Kakori", "Gosain Ganj", "Sarojini Nagar", "Mohanlal Ganj"],
    "Unnao": ["Asoha", "Auras", "Bangarmau", "Bichhiya", "Bighapur", "Fatehpur Chaurasi", "Ganj Moradabad", "Hasanganj", "Hilauli", "Mianganj", "Nawabganj", "Purwa", "Safipur", "Sikandarpur Karan", "Sikandarpur Sarausi", "Sumerpur"],
    "Rae Bareli": ["Amawan", "Bachhrawan", "Sataon", "Dalmau", "Harchandpur", "Kheeron", "Lalganj", "Maharajganj", "Jagatpur", "Rahi", "Rohaniya", "Sareni", "Shivgarh", "Deen Shah Gaura", "Unchahar", "Deeh", "Chatoh", "Salon"],
    "Hardoi": ["Ahirori", "Hariyava", "Sursa", "Shahabad", "Bharkhani", "Bharavan", "Harpalpur", "Bilgram", "Madhoganj", "Mallavan", "Tadiyavan", "Todarpur", "Kothavma", "Sandila", "Behndar", "Pihani", "Sandi", "Kachona", "Bavan"],
    "Sitapur": ["Ailiya", "Behta", "Biswan", "Gondlamau", "Hargaon", "Kasmanda", "Khairabad", "Laharpur", "Machhrehta", "Mahmudabad", "Maholi", "Misrikh", "Pahala", "Parsendi", "Pisawan", "Rampur Mathura", "Reusa", "Sakran", "Sidhauli"],
    "Lakhimpur Kheri": ["Lakhimpur", "Behjam", "Mitauli", "Pasgawan", "Gola", "Bankeyganj", "Bijuwa", "Paliya", "Issanagar", "Dhaurahara", "Nakaha", "Phoolbehar", "Ramiyabehar", "Nighasan", "Mohammdi"],
    // ── Kanpur Division ───────────────────────────────────────────────────────
    "Kanpur Nagar": ["Kakwan", "Bilhaur", "Shivrajpur", "Chaubeypur", "Kalyanpur", "Vidhnu", "Sarsaul", "Bhitargaon", "Patara", "Ghatampur"],
    "Kanpur Dehat": ["Akbarpur", "Maitha", "Sarvankheda", "Derapur", "Jhinjhak", "Rasulabad", "Amraudha", "Malasa", "Sandalpur", "Rajpur"],
    "Etawah": ["Barhpura", "Basrehar", "Jaswantnagar", "Mahewa", "Saifai", "Chakarnagar", "Takha", "Bharthana"],
    "Auraiya": ["Ajitmal", "Bhagyanagar", "Sahar", "Bidhuna", "Achalda", "Erwakatra", "Auraiya"],
    "Farrukhabad": ["Kaimganj", "Nawabganj", "Shamsabad", "Rajepur", "Barhpur", "Mohammadabad", "Kamalganj"],
    "Kannauj": ["Chhibramau", "Gugrapur", "Haseran", "Jalalabad", "Kannauj", "Rasoolabad", "Saurikh", "Talgram"],
    // ── Jhansi Division ───────────────────────────────────────────────────────
    "Jhansi": ["Babina", "Badagaon", "Bamaur", "Bangra", "Chirgaon", "Gursarai", "Mauranipur", "Moth"],
    "Jalaun": ["Rampura", "Kuthaund", "Madhogarh", "Nadigaon", "Jalaun", "Maheva", "Kadaura", "Dakor", "Konch"],
    "Hamirpur": ["Gohand", "Kurara", "Maudaha", "Muskara", "Rath", "Sarila", "Sumerpur"],
    "Mahoba": ["Kabrai", "Charkhari", "Jaitpur", "Panwari"],
    "Lalitpur": ["Talbehat", "Jakhaura", "Bar", "Birdha", "Mehroni", "Madawra"],
    // ── Chitrakoot Division ───────────────────────────────────────────────────
    "Banda": ["Badokhar Khurd", "Mahua", "Naraini", "Baberu", "Bisanda", "Kamasin", "Jaspura", "Tindwari"],
    "Chitrakoot": ["Karwi", "Manikpur", "Mau", "Pahari", "Ramnagar"],
    // ── Prayagraj Division ────────────────────────────────────────────────────
    "Prayagraj": ["Kaurihar", "Holagarh", "Mauaima", "Soraon", "Shringverpur Dham", "Bhagwatpur", "Bahariya", "Phulpur", "Bahadurpur", "Sahson", "Pratappur", "Saidabad", "Dhanupur", "Handia", "Jasra", "Shankargarh", "Chaka", "Karchhana", "Kaundhiyara", "Uruwa", "Meja", "Manda", "Koraon"],
    "Kaushambi": ["Chail", "Kada", "Kaushambi", "Manjhanpur", "Mooratganj", "Newada", "Sarsawan", "Sirathu"],
    "Pratapgarh": ["Babaganj", "Bihar", "Kalakankar", "Rampur Sangramgarh", "Sangipur", "Laxmanpur", "Mandhata", "Sandwachandrika", "Aspurdeosara", "Baba Belkhar Nath Dham", "Mangrora", "Shivgarh", "Gaura", "Sadar", "Patti", "Kunda", "Lalganj"],
    "Fatehpur": ["Asothar", "Bahua", "Bhitaura", "Haswa", "Teliyani", "Amauli", "Deomai", "Khajuha", "Malwan", "Airaya", "Dhata", "Hathgam", "Vijayipur"],
    // ── Ayodhya Division ──────────────────────────────────────────────────────
    "Ayodhya": ["Masodha", "Sohawal", "Bikapur", "Milkipur", "Mayabazar", "Purabazar", "Haringtonganj", "Amaniganj", "Tarun", "Mawai", "Rudauli"],
    "Ambedkar Nagar": ["Akbarpur", "Baskhari", "Bhiti", "Bhiyaon", "Jahangiranj", "Jalalpur", "Katehari", "Ramnagar", "Tanda"],
    "Amethi": ["Amethi", "Gauriganj", "Musafirkhana", "Tiloi", "Jagdishpur", "Bazar Shukul", "Bhetua", "Bhadar", "Sangrampur", "Shahgarh", "Jamo", "Singhpur", "Bahadurpur"],
    "Sultanpur": ["Dubeypur", "Kurebhar", "Kurwar", "Bhadaiyan", "Lambhua", "Pratappur Kamaicha", "Jaisinghpur", "Motigarpur", "Karaundi Kalan", "Kadipur", "Dostpur", "Akhandnagar", "Dhanpatganj", "Baldirai"],
    "Barabanki": ["Banki", "Masauli", "Dewa", "Harakh", "Fatehpur", "Haidergarh", "Dariyabad", "Suratganj", "Siddhaur", "Pure Dalai", "Nindura", "Trivediganj", "Ramnagar", "Sirauli Ghauspur", "Banikodar"],
    // ── Devipatan Division ────────────────────────────────────────────────────
    "Gonda": ["Babhanjot", "Belsar", "Chhapia", "Colonelganj", "Haldharmau", "Itia Thok", "Jhanjhari", "Katra Bazar", "Mankapur", "Mujehana", "Nawabganj", "Pandri Kripal", "Paraspur", "Rupaidih", "Tarabganj", "Wazirganj"],
    "Balrampur": ["Harriya Satgharwa", "Balrampur", "Tulsipur", "Gainsari", "Pachperwa", "Sridattganj", "Utraula", "Gaindas Bujurg", "Rehra Bazar"],
    "Bahraich": ["Hujurpur", "Mahasi", "Pakharpur", "Chittaura", "Mihinpurwa", "Shivpur", "Risia", "Visheshwarganj", "Nawabganj", "Tejwapur", "Kaisarganj", "Balha", "Payagpur", "Jarwal"],
    "Shravasti": ["Hariharpur Rani", "Sirsiya", "Jamunaha", "Ikauna", "Gilaula"],
    // ── Basti Division ────────────────────────────────────────────────────────
    "Basti": ["Basti", "Bahadurpur", "Bankati", "Gaur", "Harraiya", "Kaptanganj", "Kudaraha", "Paras Rampur", "Ramnagar", "Rudhauli", "Saltaua Gopalpur", "Sau Ghat", "Vikramjot", "Dubauliya"],
    "Sant Kabir Nagar": ["Pauli", "Mehdawal", "Baghauli", "Semariyaw", "Santha", "Nathnagar", "Khalilabad", "Belhar", "Hainsar Bazar"],
    "Siddharth Nagar": ["Naugarh", "Barhni", "Shohratgarh", "Birdpur", "Jogia", "Uska Bazar", "Bansi", "Methwal", "Khesraha", "Bhanwapur", "Itwa", "Khuniyaon", "Dumariyaganj", "Lotan"],
    // ── Gorakhpur Division ────────────────────────────────────────────────────
    "Gorakhpur": ["Campierganj", "Jungle Kaudia", "Khajni", "Belghat", "Sardarnagar", "Brahmpur", "Charganwa", "Bhathat", "Khorabar", "Pipraich", "Sahjanwa", "Pali", "Piprauli", "Bansgaon", "Kauriram", "Gagaha", "Gola", "Barhalganj", "Uruwa"],
    "Kushinagar": ["Tamkuhi", "Dudahi", "Seorahi", "Kasia", "Fazilnagar", "Hata", "Motichak", "Sukrauli", "Vishnupura", "Padrauna", "Khadda", "Nebua Naurangiya", "Captainganj", "Ramkola"],
    "Maharajganj": ["Brijmanganj", "Dhani", "Partawal", "Paniyara", "Lakshmipur", "Ghughali", "Mithaura", "Nautanwa", "Pharenda", "Nichlaul", "Sadar", "Siswa"],
    "Deoria": ["Baitalpur", "Bankata", "Barhaj", "Bhaluani", "Bhagalpur", "Bhatni", "Bhatparrani", "Deoria Sadar", "Desahi Deoria", "Gauri Bazar", "Lar", "Pathardeva", "Rampur Karkhana", "Rudrapur", "Salempur", "Tarkulwa"],
    // ── Varanasi Division ─────────────────────────────────────────────────────
    "Varanasi": ["Arajiline", "Baragaon", "Chiraigaon", "Cholapur", "Harhua", "Kashividyapeeth", "Pindra", "Sewapuri"],
    "Chandauli": ["Barahani", "Chandauli", "Niyamatabad", "Chahaniya", "Sakaldiha", "Dhanapur", "Chakia", "Shahabganj", "Naugarh"],
    "Bhadohi": ["Abholi", "Deegh", "Suriyawan", "Gyanpur", "Aurai", "Bhadohi"],
    "Jaunpur": ["Badlapur", "Baksha", "Barsathi", "Dharmapur", "Dobhi", "Jalalpur", "Karanja Kala", "Kerakat", "Khuthan", "Machhlishahr", "Maharajganj", "Mariyahun", "Muftiganj", "Mugra Badshahpur", "Ramnagar", "Rampur", "Shahganj", "Sikrara", "Sirkoni", "Suithkala", "Sujanganj"],
    // ── Mirzapur Division ─────────────────────────────────────────────────────
    "Mirzapur": ["Chhanbey", "Kon", "Majhawa", "City", "Pahari", "Patehara", "Hallia", "Lalganj", "Jamalpur", "Narayanpur", "Rajgarh", "Shikhar"],
    "Sonbhadra": ["Robertsganj", "Ghorawal", "Chatra", "Nagwa", "Chopan", "Babhani", "Myorpur", "Duddhi", "Karma", "Kone"],
    // ── Azamgarh Division ─────────────────────────────────────────────────────
    "Azamgarh": ["Ahiraula", "Atrauliya", "Azamatgarh", "Bilariyaganj", "Hariya", "Jahanaganj", "Koilsa", "Lalganj", "Maharajganj", "Martinganj", "Mehnagar", "Mirzapur", "Mohammadpur", "Palhna", "Palhani", "Pawai", "Phoolpur", "Rani Ki Sarai", "Sathiyaon", "Tehbarpur", "Tarwa", "Thekma"],
    "Mau": ["Badrawan", "Dohrighat", "Fatehpur Mandaon", "Ghosi", "Kopaganj", "Mohammadabad Gohana", "Pardaha", "Ranipur", "Ratanpura"],
    "Ballia": ["Bansdih", "Belhari", "Beruarwari", "Chilkahar", "Dubhad", "Garwar", "Hanumanganj", "Maniyar", "Murli Chhapra", "Nagra", "Navanagar", "Pandah", "Rasra", "Revati", "Siar", "Sohaon", "Bairia"],
    // ── Ghazipur ──────────────────────────────────────────────────────────────
    "Ghazipur": ["Ghazipur", "Virno", "Karanda", "Mardah", "Zamania", "Bhadaura", "Reotipur", "Saidpur", "Deokali", "Sadat", "Jakhania", "Manihari", "Mohammadabad", "Bhanwarkol", "Kasimabad", "Barachawar"],
  },
}

// VS name → district mapping for UP (used to filter blocks by selected VS)
// Key: VS name (lowercase), Value: district name
export const VS_TO_DISTRICT_UP: Record<string, string> = {
  // Saharanpur
  "behat": "Saharanpur", "nakur": "Saharanpur", "saharanpur nagar": "Saharanpur",
  "saharanpur": "Saharanpur", "deoband": "Saharanpur", "rampur maniharan": "Saharanpur",
  "gangoh": "Saharanpur",
  // Shamli / Muzaffarnagar
  "shamli": "Shamli", "kairana": "Shamli", "thana bhawan": "Shamli",
  "budhana": "Muzaffarnagar", "charthawal": "Muzaffarnagar", "purqazi": "Muzaffarnagar",
  "muzaffarnagar": "Muzaffarnagar", "khatauli": "Muzaffarnagar",
  // Bijnor
  "najibabad": "Bijnor", "nagina": "Bijnor", "barhapur": "Bijnor",
  "bijnor": "Bijnor", "chandpur": "Bijnor", "noorpur": "Bijnor",
  // Moradabad
  "kundarki": "Moradabad", "moradabad rural": "Moradabad", "moradabad nagar": "Moradabad",
  "thakurdwara": "Moradabad", "sambhal": "Sambhal", "asmoli": "Sambhal", "gunnaur": "Sambhal",
  // Amroha
  "amroha": "Amroha", "dhanaura": "Amroha", "hasanpur": "Amroha",
  // Rampur
  "rampur": "Rampur", "milak": "Rampur", "bilaspur": "Rampur",
  // Meerut
  "hapur": "Hapur", "garhmukteshwar": "Hapur",
  "kithore": "Ghaziabad", "loni": "Ghaziabad", "muradnagar": "Ghaziabad",
  "sahibabad": "Ghaziabad",
  "noida": "Gautam Buddha Nagar", "dadri": "Gautam Buddha Nagar", "jewar": "Gautam Buddha Nagar",
  "meerut cantonment": "Meerut", "meerut": "Meerut", "meerut south": "Meerut",
  "chhaprauli": "Bagpat", "baraut": "Bagpat", "baghpat": "Bagpat",
  "bulandshahr": "Bulandshahar", "sikandrabad": "Bulandshahar", "shikarpur": "Bulandshahar",
  "khurja": "Bulandshahar", "anoopshahr": "Bulandshahar",
  // Aligarh
  "iglas": "Aligarh", "aligarh": "Aligarh", "atrauli": "Aligarh",
  "khair": "Aligarh", "lodha": "Aligarh",
  "hathras": "Hathras", "sadabad": "Hathras", "sasni": "Hathras",
  "etah": "Etah", "kasganj": "Kasganj", "soron": "Kasganj", "amanpur": "Kasganj",
  // Mathura / Agra
  "mathura": "Mathura", "goverdhan": "Mathura", "chhata": "Mathura",
  "mant": "Mathura", "baldeo": "Mathura",
  "agra cantonment": "Agra", "agra south": "Agra", "agra north": "Agra",
  "etmadpur": "Agra", "kheragarh": "Agra", "fatehpur sikri": "Agra",
  "bah": "Agra", "pinahat": "Agra",
  "firozabad": "Firozabad", "shikohabad": "Firozabad", "tundla": "Firozabad",
  "jasrana": "Firozabad",
  "mainpuri": "Mainpuri", "bhongaon": "Mainpuri", "kishni": "Mainpuri",
  // Bareilly
  "bareilly": "Bareilly", "bareilly cantonment": "Bareilly", "nawabganj": "Bareilly",
  "faridpur": "Bareilly", "meerganj": "Bareilly",
  "baheri": "Bareilly", "bithri chainpur": "Bareilly",
  "aonla": "Bareilly", "richha": "Bareilly",
  "bisalpur": "Pilibhit", "pilibhit": "Pilibhit", "barkhera": "Pilibhit",
  "powayan": "Shahjahanpur", "shahjahanpur": "Shahjahanpur", "tilhar": "Shahjahanpur",
  "jalalabad": "Shahjahanpur", "nigohi": "Shahjahanpur",
  "budaun": "Budaun", "bisauli": "Budaun", "sahaswan": "Budaun",
  "dataganj": "Budaun",
  // Lucknow
  "lucknow east": "Lucknow", "lucknow west": "Lucknow", "lucknow north": "Lucknow",
  "lucknow south": "Lucknow", "lucknow central": "Lucknow", "lucknow cantonment": "Lucknow",
  "sarojini nagar": "Lucknow", "mohanlal ganj": "Lucknow", "bakshi ka talab": "Lucknow",
  "malihabad": "Lucknow", "mall": "Lucknow",
  // Hardoi
  "sandila": "Hardoi", "hardoi": "Hardoi", "shahabad": "Hardoi",
  "bilgram": "Hardoi", "sandi": "Hardoi",
  // Sitapur
  "sitapur": "Sitapur", "laharpur": "Sitapur", "biswan": "Sitapur",
  "mahmudabad": "Sitapur", "sidhauli": "Sitapur", "misrikh": "Sitapur",
  // Lakhimpur Kheri
  "gola gokrannath": "Lakhimpur Kheri", "kheeri": "Lakhimpur Kheri",
  "dhaurahara": "Lakhimpur Kheri", "palia": "Lakhimpur Kheri",
  "nighasan": "Lakhimpur Kheri", "mohammdi": "Lakhimpur Kheri",
  // Rae Bareli / Amethi
  "rae bareli": "Rae Bareli", "rahi": "Rae Bareli", "unchahar": "Rae Bareli",
  "bachhrawan": "Rae Bareli", "harchandpur": "Rae Bareli",
  "salon": "Rae Bareli", "lalganj": "Rae Bareli",
  "gauriganj": "Amethi", "amethi": "Amethi", "jagdishpur": "Amethi",
  "musafirkhana": "Amethi", "tiloi": "Amethi",
  // Unnao
  "unnao": "Unnao", "purwa": "Unnao", "bangarmau": "Unnao",
  "safipur": "Unnao", "bhagwantnagar": "Unnao",
  // Kanpur
  "kanpur cantonment": "Kanpur Nagar", "arya nagar": "Kanpur Nagar",
  "govind nagar": "Kanpur Nagar", "sishamau": "Kanpur Nagar",
  "kidwai nagar": "Kanpur Nagar", "bilhaur": "Kanpur Nagar",
  "ghatampur": "Kanpur Nagar", "kalyanpur": "Kanpur Nagar",
  "rasulabad": "Kanpur Dehat", "akbarpur ronahi": "Kanpur Dehat",
  "etawah": "Etawah", "bharthana": "Etawah", "jaswantnagar": "Etawah",
  "auraiya": "Auraiya", "bidhuna": "Auraiya",
  "kannauj": "Kannauj", "chhibramau": "Kannauj",
  "farrukhabad": "Farrukhabad", "kaimganj": "Farrukhabad",
  // Jhansi / Bundelkhand
  "jhansi nagar": "Jhansi", "mauranipur": "Jhansi", "chirgaon": "Jhansi",
  "babina": "Jhansi", "moth": "Jhansi",
  "jalaun": "Jalaun", "kalpi": "Jalaun", "konch": "Jalaun",
  "hamirpur": "Hamirpur", "rath": "Hamirpur", "maudaha": "Hamirpur",
  "mahoba": "Mahoba", "charkhari": "Mahoba",
  "lalitpur": "Lalitpur", "mehroni": "Lalitpur",
  // Banda / Chitrakoot
  "banda": "Banda", "naraini": "Banda", "baberu": "Banda",
  "tindwari": "Banda", "mahua": "Banda",
  "chitrakoot": "Chitrakoot", "manikpur": "Chitrakoot",
  // Prayagraj
  "allahabad north": "Prayagraj", "allahabad south": "Prayagraj",
  "allahabad west": "Prayagraj", "phulpur": "Prayagraj",
  "soraon": "Prayagraj", "meja": "Prayagraj", "koraon": "Prayagraj",
  "karchhana": "Prayagraj", "pratappur": "Prayagraj",
  "shankargarh": "Prayagraj",
  "sirathu": "Kaushambi", "manjhanpur": "Kaushambi", "chail": "Kaushambi",
  "lalganj (pratapgarh)": "Pratapgarh", "kunda": "Pratapgarh", "patti": "Pratapgarh",
  "pratapgarh": "Pratapgarh", "mandhata": "Pratapgarh",
  "fatehpur": "Fatehpur", "bindki": "Fatehpur", "khaga": "Fatehpur",
  // Ayodhya / Faizabad
  "ayodhya": "Ayodhya", "bikapur": "Ayodhya", "milkipur": "Ayodhya",
  "rudauli": "Ayodhya", "sohawal": "Ayodhya",
  "tanda": "Ambedkar Nagar", "akbarpur": "Ambedkar Nagar",
  "jalalpur": "Ambedkar Nagar", "katehari": "Ambedkar Nagar",
  "sultanpur": "Sultanpur", "lambhua": "Sultanpur", "kadipur": "Sultanpur",
  "barabanki": "Barabanki", "haidergarh": "Barabanki", "dalmau": "Barabanki",
  "fatehpur (barabanki)": "Barabanki", "dariyabad": "Barabanki",
  // Devipatan
  "gonda": "Gonda", "tarabganj": "Gonda", "colonelganj": "Gonda",
  "mankapur": "Gonda", "paraspur": "Gonda",
  "balrampur": "Balrampur", "tulsipur": "Balrampur", "utraula": "Balrampur",
  "gainsari": "Balrampur",
  "bahraich": "Bahraich", "mahasi": "Bahraich", "kaisarganj": "Bahraich",
  "nanpara": "Bahraich", "payagpur": "Bahraich",
  "shravasti": "Shravasti", "ikauna": "Shravasti", "bhinga": "Shravasti",
  // Basti
  "basti sadar": "Basti", "harraiya": "Basti", "kaptanganj": "Basti",
  "rudhauli": "Basti",
  "khalilabad": "Sant Kabir Nagar", "mehdawal": "Sant Kabir Nagar",
  "bansi": "Siddharth Nagar", "shohratgarh": "Siddharth Nagar",
  "itwa": "Siddharth Nagar", "dumariyaganj": "Siddharth Nagar",
  "naugarh": "Siddharth Nagar",
  // Gorakhpur
  "gorakhpur urban": "Gorakhpur", "gorakhpur rural": "Gorakhpur",
  "sahjanwa": "Gorakhpur", "khajanchi": "Gorakhpur", "campierganj": "Gorakhpur",
  "bansgaon": "Gorakhpur", "chillupar": "Gorakhpur",
  "padrauna": "Kushinagar", "khadda": "Kushinagar",
  "captainganj": "Kushinagar", "ramkola": "Kushinagar", "hata": "Kushinagar",
  "maharajganj": "Maharajganj", "nautanwa": "Maharajganj", "pharenda": "Maharajganj",
  "sadar (maharajganj)": "Maharajganj", "paniyara": "Maharajganj",
  "deoria sadar": "Deoria", "pathardeva": "Deoria", "rampur karkhana": "Deoria",
  "salempur": "Deoria", "bhatpar rani": "Deoria",
  // Varanasi
  "varanasi north": "Varanasi", "varanasi south": "Varanasi",
  "varanasi cantonment": "Varanasi", "sewapuri": "Varanasi",
  "pindra": "Varanasi", "ajagara": "Varanasi",
  "chandauli": "Chandauli", "sakaldiha": "Chandauli", "chakia": "Chandauli",
  "bhadohi": "Bhadohi", "gyanpur": "Bhadohi", "aurai": "Bhadohi",
  "jaunpur": "Jaunpur", "machhlishahr": "Jaunpur", "kerakat": "Jaunpur",
  "shahganj": "Jaunpur", "badlapur": "Jaunpur",
  // Mirzapur / Sonbhadra
  "mirzapur": "Mirzapur", "majhawan": "Mirzapur", "chunar": "Mirzapur",
  "robertsganj": "Sonbhadra", "chopan": "Sonbhadra", "duddhi": "Sonbhadra",
  // Azamgarh
  "azamgarh": "Azamgarh", "mehnagar": "Azamgarh", "sagri": "Azamgarh",
  "mubarakpur": "Azamgarh", "phoolpur (azamgarh)": "Azamgarh",
  "ghosi": "Mau", "mohammadabad gohana": "Mau",
  "ballia": "Ballia", "rasra": "Ballia", "bansdih": "Ballia",
  "bairia": "Ballia", "belhara": "Ballia",
  // Ghazipur
  "ghazipur": "Ghazipur", "jangipur": "Ghazipur", "zamania": "Ghazipur",
  "saidpur": "Ghazipur", "mohammadabad": "Ghazipur",
}

export function getBlocksByDistrict(state: string, district: string): string[] {
  return BLOCKS_DATA[state]?.[district] || []
}

export function getDistrictForVS(vsName: string): string | null {
  return VS_TO_DISTRICT_UP[vsName.toLowerCase()] || null
}

export const STATES_WITH_BLOCK_DATA = new Set(["Uttar Pradesh"])
