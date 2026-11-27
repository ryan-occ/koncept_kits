// Ported from Vanguard-Concept vanguard/src/data/constants.ts (catalog data).
const yearsBetween = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const CAR_DB: Record<string, Record<string, number[]>> = {
  BMW: { "M2": [2023,2024,2025], "M3": [2021,2022,2023,2024,2025], "M4": [2021,2022,2023,2024,2025], "M5": [2024,2025], "M8": [2020,2021,2022,2023,2024], "8 Series": [2020,2021,2022,2023,2024], "X5 M": [2021,2022,2023,2024,2025], "X6 M": [2021,2022,2023,2024,2025], "2002 Turbo": [1973,1974,1975], "3 Series": [2019,2020,2021,2022,2023,2024,2025], "5 Series": [2024,2025], "X3": [2018,2019,2020,2021,2022,2023,2024,2025], "X5": [2019,2020,2021,2022,2023,2024,2025], "1 Series": [2020,2021,2022,2023,2024,2025] },
  "Mercedes-Benz": { "AMG GT": [2021,2022,2023,2024,2025], "AMG C63": [2021,2022,2023,2024,2025], "AMG E63": [2020,2021,2022,2023,2024], "S-Class": [2021,2022,2023,2024,2025], "G-Class": [2020,2021,2022,2023,2024,2025], "SL 63 AMG": [2022,2023,2024,2025], "C-Class": [2022,2023,2024,2025], "E-Class": [2024,2025], "E-Class All-Terrain": [2021,2022,2023,2024,2025], "GLC": [2023,2024,2025], "GLE": [2020,2021,2022,2023,2024,2025], "A-Class": [2019,2020,2021,2022,2023,2024,2025], "V-Class": [2020,2021,2022,2023,2024,2025] },
  Audi: { "RS3": [2022,2023,2024,2025], "RS5": [2020,2021,2022,2023,2024,2025], "RS6 Avant": [2020,2021,2022,2023,2024,2025], "RS7": [2020,2021,2022,2023,2024,2025], "R8": [2020,2021,2022,2023,2024], "e-tron GT RS": [2022,2023,2024,2025], "A3": [2021,2022,2023,2024,2025], "A4": [2020,2021,2022,2023,2024,2025], "A4 Avant": [2020,2021,2022,2023,2024,2025], "A6": [2019,2020,2021,2022,2023,2024,2025], "A6 Avant": [2019,2020,2021,2022,2023,2024,2025], "Q5": [2018,2019,2020,2021,2022,2023,2024,2025], "Q7": [2020,2021,2022,2023,2024,2025] },
  Porsche: { "911 Carrera S": [2020,2021,2022,2023,2024,2025], "911 GT3": [2021,2022,2023,2024,2025], "911 Turbo S": [2020,2021,2022,2023,2024,2025], "Panamera": [2021,2022,2023,2024,2025], "Taycan Turbo": [2021,2022,2023,2024,2025], "911 Carrera RS 2.7": [1973], "959": [1986,1987,1988,1989,1990,1991,1992,1993] },
  Ferrari: { "296 GTB": [2022,2023,2024,2025], "SF90 Stradale": [2021,2022,2023,2024,2025], "Roma": [2021,2022,2023,2024,2025], "F8 Tributo": [2020,2021,2022,2023], "Purosangue": [2023,2024,2025], "288 GTO": [1984,1985,1986,1987] },
  Lamborghini: { "Huracán EVO": [2020,2021,2022,2023], "Huracán Tecnica": [2022,2023,2024,2025], "Urus S": [2023,2024,2025], "Revuelto": [2024,2025], "Countach LP400": [1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990] },
  McLaren: { "720S": [2020,2021,2022,2023], "765LT": [2021,2022,2023], "Artura": [2022,2023,2024,2025], "F1": [1992,1993,1994,1995,1996,1997,1998] },
  "Rolls-Royce": { "Ghost": [2021,2022,2023,2024,2025], "Cullinan": [2021,2022,2023,2024,2025], "Spectre": [2024,2025] },
  Bentley: { "Continental GT": [2021,2022,2023,2024,2025], "Bentayga": [2021,2022,2023,2024,2025] },
  Toyota: { "GR Supra": [2020,2021,2022,2023,2024,2025], "GR86": [2022,2023,2024,2025], "GR Yaris": [2021,2022,2023,2024,2025], "Land Cruiser 300": [2022,2023,2024,2025], "Supra MK4 (A80)": [1993,1994,1995,1996,1997,1998,1999,2000,2001,2002], "Camry": [2018,2019,2020,2021,2022,2023,2024,2025], "Corolla": [2019,2020,2021,2022,2023,2024,2025], "Corolla Touring Sports": [2019,2020,2021,2022,2023,2024,2025], "RAV4": [2019,2020,2021,2022,2023,2024,2025], "Highlander": [2020,2021,2022,2023,2024,2025], "Hilux": [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025], "4Runner": [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025], "Prius": [2023,2024,2025], "Tacoma": [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025], "Tundra": [2022,2023,2024,2025], "Sienna": [2021,2022,2023,2024,2025] },
  Nissan: { "GT-R Nismo": [2020,2021,2022], "Z": [2023,2024,2025], "Patrol": [2022,2023,2024,2025], "Skyline GT-R R32": [1989,1990,1991,1992,1993,1994], "Skyline GT-R R34": [1999,2000,2001,2002], "Altima": [2019,2020,2021,2022,2023,2024,2025], "Sentra": [2020,2021,2022,2023,2024,2025], "Rogue": [2021,2022,2023,2024,2025], "Pathfinder": [2022,2023,2024,2025], "Frontier": [2022,2023,2024,2025], "Qashqai": [2021,2022,2023,2024,2025], "Juke": [2020,2021,2022,2023,2024,2025], "X-Trail": [2022,2023,2024,2025] },
  Ford: { "Mustang GT500": [2020,2021,2022,2023,2024], "Mustang Dark Horse": [2024,2025], "GT": [2020,2021,2022], "Model B (Deuce Coupe)": [1932], "Mustang (1st Gen)": [1964,1965,1966,1967,1968], "GT40": [1964,1965,1966,1967,1968,1969], "F-150": [2021,2022,2023,2024,2025], "Ranger": [2019,2020,2021,2022,2023,2024,2025], "Explorer": [2020,2021,2022,2023,2024,2025], "Escape": [2020,2021,2022,2023,2024,2025], "Bronco": [2021,2022,2023,2024,2025], "Maverick": [2022,2023,2024,2025], "Focus": [2015,2016,2017,2018,2019], "Fiesta": [2019,2020,2021,2022] },
  Chevrolet: { "Corvette Z06": [2023,2024,2025], "Corvette E-Ray": [2024,2025], "Camaro ZL1": [2020,2021,2022,2023,2024], "Bel Air": [1955,1956,1957], "Corvette Sting Ray": [1963,1964,1965,1966,1967], "Camaro SS": [1967,1968,1969], "Chevelle SS": [1968,1969,1970,1971,1972], "Silverado": [2019,2020,2021,2022,2023,2024,2025], "Tahoe": [2021,2022,2023,2024,2025], "Suburban": [2021,2022,2023,2024,2025], "Equinox": [2018,2019,2020,2021,2022,2023,2024,2025], "Malibu": [2016,2017,2018,2019,2020,2021,2022,2023,2024], "Trailblazer": [2021,2022,2023,2024,2025], "Colorado": [2023,2024,2025] },
  Tesla: { "Model S Plaid": [2021,2022,2023,2024,2025], "Cybertruck": [2024,2025], "Model 3": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "Model Y": [2020,2021,2022,2023,2024,2025] },
  "Aston Martin": { "Vantage": [2021,2022,2023,2024,2025], "DB12": [2024,2025], "DBX707": [2022,2023,2024,2025] },
  Dodge: { "Challenger SRT Demon": [2021,2022,2023], "Charger Scat Pack": [2021,2022,2023,2024], "Charger R/T": [1968,1969,1970], "Challenger R/T": [1970,1971,1972,1973,1974], "Challenger": yearsBetween(2008, 2023), "Charger": yearsBetween(2006, 2026), "Durango": yearsBetween(2011, 2026), "Hornet": [2023,2024,2025], "Viper": yearsBetween(2013, 2017) },
  Shelby: { "Cobra 289": [1962,1963,1964,1965], "GT500": [1967,1968,1969,1970] },
  Jaguar: { "E-Type": [1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974] },
  Pontiac: { "GTO": [1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974], "Firebird Trans Am": [1969,1970,1971,1972,1973] },
  Plymouth: { "'Cuda": [1970,1971], "HEMI 'Cuda": [1970,1971] },
  Datsun: { "240Z": [1969,1970,1971,1972,1973] },
  Bugatti: { "EB110": [1991,1992,1993,1994,1995] },
  Mazda: { "RX-7 FD": [1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002], "Mazda 3": [2019,2020,2021,2022,2023,2024,2025], "Mazda 6": [2018,2019,2020,2021,2022,2023], "CX-5": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "CX-30": [2020,2021,2022,2023,2024,2025], "CX-90": [2024,2025], "MX-5 Miata": [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025] },
  Acura: { "NSX (NA1)": [1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005] },
  Buick: { "GNX": [1987] },
  Honda: {
    "Accord": yearsBetween(2000, 2026),
    "Civic": yearsBetween(2000, 2026),
    "Civic Type R (EK9)": [1997,1998,1999,2000],
    "Civic Type R (EP3)": [2002,2003,2004,2005],
    "Civic Type R (FD2)": [2007,2008,2009,2010,2011],
    "Civic Type R (FK2)": [2015,2016],
    "Civic Type R (FK8)": [2017,2018,2019,2020,2021],
    "Civic Type R (FL5)": [2023,2024,2025,2026],
    "CR-V": yearsBetween(2000, 2026),
    "CR-Z": yearsBetween(2011, 2016),
    "Crosstour": yearsBetween(2010, 2015),
    "Element": yearsBetween(2003, 2011),
    "Fit": yearsBetween(2007, 2020),
    "HR-V": yearsBetween(2016, 2026),
    "Insight": [2000,2001,2002,2003,2004,2005,2006,2010,2011,2012,2013,2014,2019,2020,2021,2022],
    "Integra Type R (DC2)": [1995,1996,1997,1998,1999,2000,2001],
    "NSX (NA2)": [2000,2001,2002,2003,2004,2005],
    "Odyssey": yearsBetween(2000, 2026),
    "Passport": yearsBetween(2019, 2026),
    "Pilot": yearsBetween(2003, 2026),
    "Prelude (5th Gen)": [1997,1998,1999,2000,2001],
    "Prelude (6th Gen)": [2026],
    "Ridgeline": [...yearsBetween(2006, 2014), ...yearsBetween(2017, 2026)],
    "S2000": [1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009],
  },
  Volkswagen: { "Golf R (Mk8)": [2022,2023,2024,2025], "Golf GTI (Mk8)": [2022,2023,2024,2025], "Scirocco R": [2010,2011,2012,2013,2014,2015,2016,2017], "Arteon R": [2022,2023,2024], "Golf R32 (Mk5)": [2006,2007,2008], "Golf MK1 GTI": [1976,1977,1978,1979,1980,1981,1982,1983], "Tiguan": [2018,2019,2020,2021,2022,2023,2024,2025], "Passat": [2020,2021,2022,2023,2024], "Passat Variant": [2020,2021,2022,2023,2024], "Polo": [2018,2019,2020,2021,2022,2023,2024,2025], "T-Roc": [2018,2019,2020,2021,2022,2023,2024,2025], "Touareg": [2019,2020,2021,2022,2023,2024,2025], "Amarok": [2023,2024,2025], "Multivan": [2022,2023,2024,2025] },
  Subaru: { "WRX STI (VA)": [2018,2019,2020,2021], "WRX (VB)": [2022,2023,2024,2025], "BRZ": [2022,2023,2024,2025], "Impreza WRX STI (GD)": [2002,2003,2004,2005,2006,2007], "22B STI": [1998], "SVX": [1991,1992,1993,1994,1995,1996,1997] },
  Peugeot: { "208 GTI": [2013,2014,2015,2016,2017,2018,2019], "308 GTI": [2015,2016,2017,2018,2019,2020,2021], "RCZ R": [2013,2014,2015], "205 GTI": [1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994], "3008": [2017,2018,2019,2020,2021,2022,2023,2024], "5008": [2017,2018,2019,2020,2021,2022,2023,2024], "2008": [2020,2021,2022,2023,2024,2025] },
  Mitsubishi: { "Lancer Evolution X": [2008,2009,2010,2011,2012,2013,2014,2015,2016], "Lancer Evolution IX": [2005,2006,2007], "Lancer Evolution VI TME": [1999,2000,2001], "3000GT": [1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000], "Eclipse GSX": [1995,1996,1997,1998,1999], "Pajero Evolution": [1997,1998,1999], "Pajero SWB Gen 1": [1982,1983,1984,1985,1986,1987,1988,1989,1990,1991], "Pajero SWB Gen 2": [1991,1992,1993,1994,1995,1996,1997,1998,1999], "Pajero SWB Gen 3": [1999,2000,2001,2002,2003,2004,2005,2006], "Pajero SWB Gen 4": [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021], "Outlander": [2022,2023,2024,2025], "ASX": [2020,2021,2022,2023,2024,2025], "L200": [2019,2020,2021,2022,2023,2024,2025] },
  BYD: { "Seal": [2022,2023,2024,2025], "Han": [2020,2021,2022,2023,2024,2025], "Seal U": [2023,2024,2025], "Atto 3": [2022,2023,2024,2025], "Tang": [2018,2019,2020,2021,2022,2023,2024,2025], "Dolphin": [2021,2022,2023,2024,2025], "Song Plus": [2021,2022,2023,2024,2025] },
  NIO: { "ET5": [2022,2023,2024,2025], "ET7": [2021,2022,2023,2024,2025], "ES6": [2023,2024,2025], "ES7": [2022,2023,2024,2025], "EC6": [2023,2024,2025], "ET5T": [2023,2024,2025], "EC7": [2023,2024,2025] },
  Xpeng: { "P7": [2020,2021,2022,2023,2024,2025], "G9": [2022,2023,2024,2025], "G6": [2023,2024,2025], "X9": [2024,2025], "P5": [2021,2022,2023,2024] },
  "Li Auto": { "L9": [2022,2023,2024,2025], "L8": [2022,2023,2024,2025], "L7": [2023,2024,2025], "L6": [2024,2025], "Mega": [2024,2025] },
  Zeekr: { "Zeekr 001": [2021,2022,2023,2024,2025], "Zeekr 007": [2024,2025], "Zeekr X": [2023,2024,2025], "Zeekr 009": [2022,2023,2024,2025] },
  Geely: { "Emgrand": [2021,2022,2023,2024,2025], "Xingyue L": [2021,2022,2023,2024,2025], "Boyue": [2021,2022,2023,2024,2025], "Preface": [2021,2022,2023,2024,2025], "Galaxy L6": [2023,2024,2025], "Galaxy E5": [2024,2025] },
  "Lynk & Co": { "Lynk 01": [2020,2021,2022,2023,2024,2025], "Lynk 05": [2020,2021,2022,2023,2024,2025], "Lynk 06": [2020,2021,2022,2023,2024,2025], "Lynk 08": [2023,2024,2025], "Lynk 09": [2022,2023,2024,2025] },
  Chery: { "Tiggo 8 Pro": [2021,2022,2023,2024,2025], "Tiggo 7 Pro": [2021,2022,2023,2024,2025], "Tiggo 4 Pro": [2022,2023,2024,2025], "Arrizo 8": [2022,2023,2024,2025], "Arrizo 6 Pro": [2021,2022,2023,2024] },
  // Years from Jetour's production ranges (Wikipedia, cross-checked with Jetour UAE's current range).
  Jetour: { "X70": yearsBetween(2018, 2026), "X70 Plus": yearsBetween(2022, 2026), "X90": yearsBetween(2019, 2026), "X90 Plus": yearsBetween(2021, 2026), "Dashing": yearsBetween(2022, 2026), "T2": yearsBetween(2023, 2026), "T1": yearsBetween(2024, 2026), "X50": yearsBetween(2024, 2026), "G700": [2025, 2026], "F700": [2026] },
  EXEED: { "Sterra ES": [2023,2024,2025], "Sterra ET": [2023,2024,2025], "LX": [2022,2023,2024,2025], "VX": [2021,2022,2023,2024,2025] },
  Changan: { "CS75 Plus": [2020,2021,2022,2023,2024,2025], "CS55 Plus": [2020,2021,2022,2023,2024,2025], "Uni-V": [2022,2023,2024,2025], "Uni-K": [2021,2022,2023,2024,2025], "Lamore": [2023,2024,2025], "UNI-T": [2020,2021,2022,2023,2024] },
  "Deep Blue": { "SL03": [2022,2023,2024,2025], "S7": [2023,2024,2025], "G318": [2023,2024,2025] },
  MG: { "MG4": [2022,2023,2024,2025], "MG5": [2022,2023,2024,2025], "MG ZS": [2021,2022,2023,2024,2025], "MG HS": [2021,2022,2023,2024,2025], "Cyberster": [2023,2024,2025] },
  Roewe: { "D7": [2023,2024,2025], "RX5": [2021,2022,2023,2024,2025], "i5": [2021,2022,2023,2024,2025], "Marvel R": [2021,2022,2023,2024,2025] },
  Haval: { "H6": [2021,2022,2023,2024,2025], "Haval H9": [2022,2023,2024,2025], "Jolion": [2021,2022,2023,2024,2025], "Dargo": [2021,2022,2023,2024,2025] },
  Tank: { "Tank 300": [2021,2022,2023,2024,2025], "Tank 400": [2022,2023,2024,2025], "Tank 500": [2022,2023,2024,2025] },
  Wey: { "Coffee 01": [2021,2022,2023,2024,2025], "Coffee 02": [2022,2023,2024,2025], "Blue Mountain": [2023,2024,2025] },
  Hongqi: { "Hongqi H9": [2020,2021,2022,2023,2024,2025], "H5": [2020,2021,2022,2023,2024,2025], "E-HS9": [2020,2021,2022,2023,2024,2025], "EH7": [2023,2024,2025], "E-QM5": [2022,2023,2024,2025] },
  Voyah: { "Free": [2021,2022,2023,2024,2025], "Dream": [2022,2023,2024,2025], "Passion": [2023,2024,2025] },
  "IM Motors": { "IM L7": [2022,2023,2024,2025], "LS7": [2022,2023,2024,2025], "IM L6": [2023,2024,2025] },
  Leapmotor: { "C01": [2022,2023,2024,2025], "C10": [2024,2025], "C11": [2021,2022,2023,2024,2025], "T03": [2020,2021,2022,2023,2024] },
  NETA: { "NETA V": [2020,2021,2022,2023,2024,2025], "NETA U": [2020,2021,2022,2023,2024,2025], "NETA S": [2022,2023,2024,2025], "AYA": [2023,2024,2025] },
  AVATR: { "AVATR 11": [2022,2023,2024,2025], "AVATR 12": [2023,2024,2025] },
  Aion: { "Y Plus": [2022,2023,2024,2025], "S Plus": [2022,2023,2024,2025], "V Plus": [2022,2023,2024,2025], "LX Plus": [2022,2023,2024,2025], "Hyper GT": [2023,2024,2025] },
  Arcfox: { "Alpha S": [2021,2022,2023,2024,2025], "Alpha T": [2021,2022,2023,2024,2025], "Kaola": [2023,2024,2025] },
  Denza: { "D9": [2022,2023,2024,2025], "N7": [2023,2024,2025], "N8": [2023,2024,2025], "Z9": [2024,2025], "Z9 GT": [2024,2025] },
  Yangwang: { "U8": [2023,2024,2025], "U9": [2024,2025] },
  "Fang Cheng Bao": { "Bao 5": [2023,2024,2025], "Bao 8": [2024,2025], "Leopard 8": [2024,2025] },
  "GAC Trumpchi": { "GS8": [2021,2022,2023,2024,2025], "GS4": [2021,2022,2023,2024,2025], "Trumpchi M8": [2020,2021,2022,2023,2024,2025], "E9": [2023,2024,2025] },
  BAIC: { "BJ60": [2021,2022,2023,2024,2025], "BJ40": [2020,2021,2022,2023,2024,2025], "X7": [2021,2022,2023,2024,2025] },
  JAC: { "JS4": [2022,2023,2024,2025], "Yiwei A5": [2023,2024,2025], "Refine S7": [2022,2023,2024,2025] },
  Ora: { "Good Cat": [2021,2022,2023,2024,2025], "Ballet Cat": [2022,2023,2024,2025], "Punk Cat": [2023,2024,2025] },
  Wuling: { "Hongguang Mini EV": [2020,2021,2022,2023,2024,2025], "Air EV": [2022,2023,2024,2025], "Bingo": [2023,2024,2025] },
  Hyundai: { "Tucson": [2021,2022,2023,2024,2025], "Santa Fe": [2021,2022,2023,2024,2025], "Elantra": [2021,2022,2023,2024,2025], "Sonata": [2020,2021,2022,2023,2024,2025], "Kona": [2024,2025], "Palisade": [2020,2021,2022,2023,2024,2025], "i30": [2021,2022,2023,2024,2025], "Staria": [2022,2023,2024,2025] },
  Kia: { "Sportage": [2022,2023,2024,2025], "Sorento": [2021,2022,2023,2024,2025], "Telluride": [2020,2021,2022,2023,2024,2025], "Seltos": [2021,2022,2023,2024,2025], "K5": [2021,2022,2023,2024,2025], "Picanto": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "Stonic": [2022,2023,2024,2025], "Carnival": [2022,2023,2024,2025] },
  Suzuki: { "Swift": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "Vitara": [2019,2020,2021,2022,2023,2024,2025], "Jimny": [2019,2020,2021,2022,2023,2024,2025] },
  Jeep: { "Wrangler": [2018,2019,2020,2021,2022,2023,2024,2025], "Grand Cherokee": [2022,2023,2024,2025], "Compass": [2021,2022,2023,2024,2025], "Gladiator": [2020,2021,2022,2023,2024,2025] },
  Ram: { "1500": [2019,2020,2021,2022,2023,2024,2025], "2500": [2019,2020,2021,2022,2023,2024,2025] },
  "Land Rover": { "Defender": [2020,2021,2022,2023,2024,2025], "Range Rover Sport": [2023,2024,2025], "Discovery": [2021,2022,2023,2024,2025] },
  Volvo: { "XC60": [2018,2019,2020,2021,2022,2023,2024,2025], "XC90": [2022,2023,2024,2025], "V60": [2019,2020,2021,2022,2023,2024,2025], "V90": [2017,2018,2019,2020,2021,2022,2023,2024], "S60": [2019,2020,2021,2022,2023,2024,2025] },
  MINI: { "Cooper": [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025], "Cooper Coupé": [2011,2012,2013,2014,2015], "Countryman": [2017,2018,2019,2020,2021,2022,2023,2024,2025] },
  Dacia: { "Sandero": [2021,2022,2023,2024,2025], "Duster": [2018,2019,2020,2021,2022,2023,2024,2025] },
  Renault: { "Clio": [2020,2021,2022,2023,2024,2025], "Captur": [2020,2021,2022,2023,2024,2025], "Megane": [2016,2017,2018,2019,2020,2021,2022] },
  "Citroën": { "C3": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "C4": [2021,2022,2023,2024,2025], "C5 Aircross": [2019,2020,2021,2022,2023,2024,2025] },
  Fiat: { "500": [2020,2021,2022,2023,2024,2025], "Panda": [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025], "Tipo": [2016,2017,2018,2019,2020,2021,2022,2023,2024] },
  SEAT: { "Leon": [2020,2021,2022,2023,2024,2025], "Ateca": [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025], "Ibiza": [2018,2019,2020,2021,2022,2023,2024,2025] },
  Skoda: { "Octavia": [2021,2022,2023,2024,2025], "Octavia Combi": [2021,2022,2023,2024,2025], "Kodiaq": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "Superb": [2024,2025], "Superb Combi": [2024,2025], "Fabia": [2022,2023,2024,2025] },
  Chrysler: { "Pacifica": [2017,2018,2019,2020,2021,2022,2023,2024,2025], "Voyager": [2020,2021,2022,2023,2024,2025] },
};

/** Search-only make aliases. Build configs always store the canonical CAR_DB key. */
export const VEHICLE_MAKE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  BMW: ["Beemer", "Bimmer"],
  "Mercedes-Benz": ["Mercedes", "Benz", "Merc"],
  Chevrolet: ["Chevy", "Chev"],
  Volkswagen: ["VW", "Volks"],
};

/** Search-only model aliases, grouped by canonical make and model labels. */
export const VEHICLE_MODEL_ALIASES: Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
> = {
  Toyota: {
    "GR Supra": ["A90", "A90 Supra"],
    "GR86": ["Toyota 86", "GT86", "FT86"],
    "Supra MK4 (A80)": ["A80", "MK4 Supra", "MkIV Supra"],
    "Land Cruiser 300": ["LC300"],
  },
  Nissan: {
    "GT-R Nismo": ["GTR", "R35"],
    "Skyline GT-R R32": ["R32", "R32 GT-R", "BNR32", "Godzilla"],
    "Skyline GT-R R34": ["R34", "R34 GT-R", "BNR34"],
    Z: ["Fairlady Z"],
  },
  Honda: {
    "Civic Type R (EK9)": ["EK9", "CTR EK9"],
    "Civic Type R (EP3)": ["EP3", "CTR EP3"],
    "Civic Type R (FD2)": ["FD2", "CTR FD2"],
    "Civic Type R (FK2)": ["FK2", "CTR FK2"],
    "Civic Type R (FK8)": ["FK8", "CTR FK8"],
    "Civic Type R (FL5)": ["FL5", "CTR FL5"],
    "CR-V": ["CRV"],
    "HR-V": ["HRV"],
    "CR-Z": ["CRZ"],
    "NSX (NA2)": ["NA2", "NA2 NSX"],
  },
  Mazda: {
    "MX-5 Miata": ["Miata", "Eunos Roadster"],
    "RX-7 FD": ["FD3S", "FD RX-7"],
  },
  Subaru: {
    "WRX STI (VA)": ["VA STI", "VA WRX"],
    "WRX (VB)": ["VB WRX"],
    "Impreza WRX STI (GD)": ["GD STI", "GD WRX STI"],
  },
  Mitsubishi: {
    "Lancer Evolution X": ["Evo X", "Evo 10", "Lancer Evo X"],
    "Lancer Evolution IX": ["Evo IX", "Evo 9", "Lancer Evo IX"],
  },
  Ford: {
    "F-150": ["F150", "F 150"],
    "Mustang GT500": ["GT500", "Shelby GT500"],
    "Mustang (1st Gen)": ["First-gen Mustang"],
  },
  Chevrolet: {
    Silverado: ["Chevy Silverado"],
    "Camaro ZL1": ["ZL1 Camaro"],
    "Corvette Z06": ["C8 Z06"],
  },
  Volkswagen: {
    "Golf R (Mk8)": ["Golf R", "Mk8 Golf R"],
    "Golf GTI (Mk8)": ["Golf GTI", "Mk8 GTI"],
  },
  Jetour: {
    T2: ["Traveller", "Traveler"],
    T1: ["Freedom"],
    G700: ["Zongheng G700"],
    F700: ["Zongheng F700"],
  },
  Dodge: {
    "Challenger SRT Demon": ["Demon", "Demon Challenger"],
    "Charger Scat Pack": ["Scat Pack Charger"],
  },
};

export interface HondaFactoryVariant {
  id: string;
  label: string;
  model: string;
  years: readonly number[];
  bodyStyle: BodyStyle;
  promptCue: string;
}

/** Distinct factory variants are kept separate from model names to avoid duplicate vehicle entries. */
export const HONDA_FACTORY_VARIANTS: readonly HondaFactoryVariant[] = [
  {
    id: "civic-si",
    label: "Si",
    model: "Civic",
    years: [...yearsBetween(2000, 2015), ...yearsBetween(2017, 2026)],
    bodyStyle: "sedan",
    promptCue: "Civic Si performance trim with its factory sport fascia and subtle rear lip spoiler",
  },
  {
    id: "civic-type-r",
    label: "Type R",
    model: "Civic",
    years: [...yearsBetween(2017, 2021), ...yearsBetween(2023, 2026)],
    bodyStyle: "hatchback",
    promptCue: "Civic Type R high-performance hatchback with its aggressive factory fascia and large rear wing",
  },
  {
    id: "accord-sport",
    label: "Sport",
    model: "Accord",
    years: yearsBetween(2013, 2026),
    bodyStyle: "sedan",
    promptCue: "Accord Sport trim with its factory sport fascia and distinctive factory wheels",
  },
  {
    id: "accord-coupe",
    label: "Coupe",
    model: "Accord",
    years: yearsBetween(2000, 2017),
    bodyStyle: "coupe",
    promptCue: "two-door Accord Coupe body with its shorter rear side windows and distinct coupe roofline",
  },
  {
    id: "cr-v-trailsport",
    label: "TrailSport",
    model: "CR-V",
    years: yearsBetween(2024, 2026),
    bodyStyle: "suv",
    promptCue: "CR-V TrailSport trim with rugged factory styling and orange recovery-point accents",
  },
];

export function getHondaFactoryVariants(make: string, model: string, year: number): readonly HondaFactoryVariant[] {
  if (make !== "Honda") return [];
  return HONDA_FACTORY_VARIANTS.filter(variant => variant.model === model && variant.years.includes(year));
}

export function getHondaFactoryVariant(
  make: string,
  model: string,
  year: number,
  variantId: string | undefined,
): HondaFactoryVariant | undefined {
  if (!variantId) return undefined;
  return getHondaFactoryVariants(make, model, year).find(variant => variant.id === variantId);
}

export type VehicleCategory = 'sports-coupe' | 'hypercar' | 'suv' | 'muscle' | 'sedan' | 'grand-tourer' | 'wagon' | 'classic' | 'pickup' | 'hatchback' | 'crossover' | 'minivan';

// ─── Home market resolver ───────────────────────────────────────────────────
// Used by the Center Console Upgrade picker (and any future market-filtered
// catalog) to show only options that would plausibly be available to a
// customer in the vehicle's home market. Each MAKE maps to a single home
// market; this is intentionally coarse — most marques have an obvious home
// market and aftermarket houses tend to follow the marque's centre of
// gravity even when the cars themselves are sold globally. Unknown makes
// fall back to "Worldwide".
export type Market = 'CDM' | 'JDM' | 'EDM' | 'USDM' | 'KDM' | 'AUDM' | 'Worldwide';

const MAKE_MARKET_MAP: Record<string, Market> = {
  // EDM — European Domestic Market
  "BMW": "EDM", "Mercedes-Benz": "EDM", "Audi": "EDM", "Porsche": "EDM",
  "Volkswagen": "EDM", "MINI": "EDM", "Skoda": "EDM", "SEAT": "EDM",
  "Volvo": "EDM", "Bentley": "EDM", "Rolls-Royce": "EDM", "Aston Martin": "EDM",
  "Ferrari": "EDM", "Lamborghini": "EDM", "McLaren": "EDM", "Maserati": "EDM",
  "Renault": "EDM", "Peugeot": "EDM", "Citroën": "EDM", "Fiat": "EDM",
  "Dacia": "EDM", "Land Rover": "EDM", "Bugatti": "EDM", "Jaguar": "EDM",
  // JDM — Japanese Domestic Market
  "Toyota": "JDM", "Honda": "JDM", "Nissan": "JDM", "Mazda": "JDM",
  "Mitsubishi": "JDM", "Subaru": "JDM", "Suzuki": "JDM", "Lexus": "JDM",
  "Infiniti": "JDM", "Acura": "JDM", "Datsun": "JDM",
  // USDM — US Domestic Market
  "Ford": "USDM", "Chevrolet": "USDM", "Dodge": "USDM", "Jeep": "USDM",
  "Ram": "USDM", "Tesla": "USDM", "Buick": "USDM", "Pontiac": "USDM",
  "Plymouth": "USDM", "Cadillac": "USDM", "GMC": "USDM", "Chrysler": "USDM",
  "Lincoln": "USDM", "Shelby": "USDM",
  // CDM — China Domestic Market
  "BYD": "CDM", "Geely": "CDM", "NIO": "CDM", "Lynk & Co": "CDM",
  "Xpeng": "CDM", "Li Auto": "CDM", "Zeekr": "CDM", "Chery": "CDM", "Jetour": "CDM",
  "EXEED": "CDM", "Changan": "CDM", "Deep Blue": "CDM", "MG": "CDM",
  "Roewe": "CDM", "Haval": "CDM", "Tank": "CDM", "Wey": "CDM",
  "Hongqi": "CDM", "Voyah": "CDM", "IM Motors": "CDM", "Leapmotor": "CDM",
  "NETA": "CDM", "AVATR": "CDM", "Aion": "CDM", "Arcfox": "CDM",
  "Denza": "CDM", "Yangwang": "CDM", "Fang Cheng Bao": "CDM",
  "GAC Trumpchi": "CDM", "BAIC": "CDM", "JAC": "CDM", "Ora": "CDM", "Wuling": "CDM",
  // KDM — Korean Domestic Market
  "Hyundai": "KDM", "Kia": "KDM", "Genesis": "KDM",
  // AUDM — Australian Domestic Market (incl. Holden / HSV)
  "Holden": "AUDM", "HSV": "AUDM", "Walkinshaw": "AUDM",
};

export function getVehicleMarket(make: string): Market {
  return MAKE_MARKET_MAP[make] ?? "Worldwide";
}

// ─── CDM maker group definitions ─────────────────────────────────────────────
// Used to render optional group-header dividers in the vehicle make picker so
// that the 31 CDM brands are easier to navigate. Purely cosmetic — no change
// to the underlying data structure or filtering logic.
export const CDM_MAKE_GROUPS: ReadonlyArray<{ readonly label: string; readonly makes: readonly string[] }> = [
  { label: "BYD Group",     makes: ["BYD", "Denza", "Yangwang", "Fang Cheng Bao"] },
  { label: "Chery Group",   makes: ["Chery", "EXEED", "Jetour"] },
  { label: "GWM Group",     makes: ["Haval", "Tank", "Wey", "Ora"] },
  { label: "SAIC Group",    makes: ["MG", "Roewe", "IM Motors"] },
  { label: "Changan Group", makes: ["Changan", "Deep Blue", "AVATR"] },
  { label: "GAC Group",     makes: ["Aion", "GAC Trumpchi"] },
] as const;

/** Reverse lookup: make → CDM maker group label. Makes not in a named group are absent. */
export const CDM_MAKE_GROUP_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  CDM_MAKE_GROUPS.flatMap(({ label, makes }) => makes.map(m => [m, label]))
);

// ─── Steering Wheel upgrade catalog ──────────────────────────────────────────
// All options are Worldwide (no market filter) since aftermarket steering
// wheels are universally available regardless of the vehicle's home market.
//
// IMPORTANT: This catalog is mirrored on the server side in
// artifacts/api-server/src/lib/carimage-helpers.ts (STEERING_WHEEL_CATALOG).
// When adding / removing / renaming an id here, update both files — the
// client owns UX language (label / desc), the server owns the AI render
// directive folded into the interior identity block. Unknown ids on the
// server silently fall back to no directive (factory wheel).
export interface SteeringWheelOption {
  id: string;
  name: string;
  /** One-line UX description shown in the picker tooltip / caption. */
  desc: string;
  /** True for the AI signature option (rendered with a distinct visual treatment). */
  signature?: boolean;
  /** True for the safe default — used when a saved build has no value. */
  isDefault?: boolean;
}

export const STEERING_WHEEL_DEFAULT_ID = "oem-stock";

export const STEERING_WHEEL_OPTIONS: ReadonlyArray<SteeringWheelOption> = [
  { id: "oem-stock",                name: "OEM / Stock",                     desc: "Factory steering wheel — no aftermarket changes.",                                                                        isDefault: true },
  { id: "vanguard-custom",          name: "✦ Vanguard Custom Wheel",         desc: "AI-designed signature steering wheel — original Vanguard concept, no two alike.",                                        signature: true },
  { id: "flat-bottom-alcantara",    name: "Flat-Bottom Alcantara Sport",     desc: "Sport flat-bottom rim in Alcantara microsuede with contrast stitching and thumb-rests at 9 and 3 o'clock." },
  { id: "racing-suede-stripe",      name: "Racing Suede & Centre Stripe",    desc: "Full Dinamica racing-suede rim with a 12 o'clock centre stripe in the accent stitch colour." },
  { id: "classic-three-spoke-wood", name: "Classic Three-Spoke Wood",        desc: "Polished open-pore walnut rim with three chrome spokes — grand-tourer heritage styling." },
  { id: "carbon-rim-performance",   name: "Carbon-Rim Performance",          desc: "Dry-carbon-fibre rim with forged-aluminium spokes and flat-bottom cut — track-focused build." },
];

/**
 * Category-based default steering wheel ids. Track / hypercar categories get
 * a sport or racing wheel by default; luxury / grand-tourer cars get the wood
 * rim; all others start at OEM/Stock.
 */
export const DEFAULT_STEERING_WHEEL_BY_CATEGORY: Record<VehicleCategory, string> = {
  "sports-coupe":  "flat-bottom-alcantara",
  "hypercar":      "racing-suede-stripe",
  "grand-tourer":  "classic-three-spoke-wood",
  "muscle":        "oem-stock",
  "suv":           "oem-stock",
  "sedan":         "oem-stock",
  "wagon":         "oem-stock",
  "classic":       "oem-stock",
  "pickup":        "oem-stock",
  "hatchback":     "flat-bottom-alcantara",
  "crossover":     "oem-stock",
  "minivan":       "oem-stock",
};

export function getDefaultSteeringWheelForCategory(category: VehicleCategory): string {
  return DEFAULT_STEERING_WHEEL_BY_CATEGORY[category] ?? STEERING_WHEEL_DEFAULT_ID;
}

// ─── Center Console Upgrade catalog ─────────────────────────────────────────
// Aftermarket / tuner / OEM-optional centre console treatments grouped by the
// market they're realistically sourced from. Each option declares one or
// more markets; "Worldwide" means the option appears for every vehicle (used
// for the universal defaults — OEM/Stock and Vanguard Custom).
//
// IMPORTANT: This catalog is mirrored on the server side in
// artifacts/api-server/src/lib/carimage-helpers.ts (CENTER_CONSOLE_UPGRADE_CATALOG).
// When adding / removing / renaming an id here, update both files — the
// client owns UX language (label / desc), the server owns the AI render
// directive that gets folded into the interior identity block. Unknown ids
// on the server silently fall back to no directive.
export interface CenterConsoleUpgrade {
  id: string;
  name: string;
  /** One-line UX description shown in the picker tooltip / caption. */
  desc: string;
  /** Markets in which the option is offered. "Worldwide" => shown for any car. */
  markets: Market[];
  /** True for the AI signature option (rendered with a distinct visual treatment). */
  signature?: boolean;
  /** True for the safe default — used when a saved build has no value. */
  isDefault?: boolean;
}

export const CENTER_CONSOLE_UPGRADE_DEFAULT_ID = "oem-stock";

export const CENTER_CONSOLE_UPGRADES: ReadonlyArray<CenterConsoleUpgrade> = [
  { id: "oem-stock", name: "OEM / Stock", desc: "Factory centre console — no aftermarket changes.", markets: ["Worldwide"], isDefault: true },
  { id: "vanguard-custom", name: "✦ Vanguard Custom Console", desc: "AI-designed signature centre console — original Vanguard concept, no two alike.", markets: ["Worldwide"], signature: true },

  // CDM
  { id: "byd-dilink-rotating", name: "BYD DiLink Rotating Console", desc: "Crystal rotary shifter on a glossy black centre bridge with the signature rotating-tablet motif above.", markets: ["CDM"] },
  { id: "nio-nomi-companion", name: "NIO NOMI Companion Console", desc: "Slim metal centre tunnel with the NOMI AI companion sphere mounted at the top, mood-light halo across the console face.", markets: ["CDM"] },
  { id: "lynkco-floating-bridge", name: "Lynk & Co Floating Bridge", desc: "Floating brushed-alloy centre console with copper trim insert and a low-profile drive-mode selector.", markets: ["CDM"] },
  { id: "hongqi-jade-pavilion", name: "Hongqi Jade Pavilion Console", desc: "Lacquered red-and-gold centre bridge with jade-inlay trim and a traditional Chinese arch motif above the rotary selector — state-flagship house style.", markets: ["CDM"] },
  { id: "xpeng-turing-smart", name: "Xpeng Turing Smart Console", desc: "Minimalist all-glass centre bridge with an embedded interactive OLED strip, capacitive controls, and a floating aluminium gear puck — tech-focused CDM EV style.", markets: ["CDM"] },

  // JDM
  { id: "trd-quick-shift", name: "TRD Quick-Shift Console", desc: "Short-throw alloy gated shifter on a carbon-fibre centre tunnel with red anodised surround.", markets: ["JDM"] },
  { id: "nardi-walnut-classic", name: "Nardi Walnut & Alloy Console", desc: "Open-pore walnut centre bridge with a brushed-alloy gated shifter — vintage JDM tuner / Nismo refit vibe.", markets: ["JDM"] },
  { id: "wangan-carbon-qr", name: "Wangan Carbon Quick-Release Console", desc: "Full carbon-fibre centre tunnel with quick-release handbrake lever and exposed countersunk bolt heads.", markets: ["JDM"] },

  // EDM
  { id: "alcantara-driver-bridge", name: "Alcantara Driver Bridge", desc: "Wraparound Alcantara centre console with contrast stitching and brushed-metal drive controls — AMG / M-Sport tuner DNA.", markets: ["EDM"] },
  { id: "carbon-driver-zone", name: "Carbon Bridge Driver Zone", desc: "Sculpted dry-carbon centre bridge with metal gear-shift collar and aluminium drive-mode dial — Porsche / Lamborghini house style.", markets: ["EDM"] },
  { id: "burl-walnut-gt", name: "Burl Walnut Grand Tourer Console", desc: "Open-pore burl walnut centre bridge with chrome bezels and an ivory ambient strip — Bentley / Rolls-Royce house style.", markets: ["EDM"] },

  // USDM
  { id: "hellcat-pistol-grip", name: "Hellcat Pistol-Grip Console", desc: "Brushed-aluminium centre tunnel with a classic American pistol-grip gear lever and red ignition badge.", markets: ["USDM"] },
  { id: "shelby-track-console", name: "Shelby Track-Pack Console", desc: "Bare brushed-metal centre tunnel with Cobra-emblem shifter knob and exposed quick-release rivets.", markets: ["USDM"] },
  { id: "captains-bridge", name: "Captain's Bridge Console", desc: "Full-width quilted-leather centre bridge with bourbon-wood inlay and chrome bezels — full-size SUV / pickup luxury.", markets: ["USDM"] },

  // KDM
  { id: "n-eshift-paddle", name: "Hyundai N e-Shift Paddle Console", desc: "Short-throw paddle-style e-shifter on a brushed-metal centre tunnel with Performance-Blue contrast stitching.", markets: ["KDM"] },
  { id: "genesis-crystal-sphere", name: "Genesis Crystal Sphere Console", desc: "Diamond-cut crystal rotary shifter mounted on a copper-trim leather centre bridge — Genesis house style.", markets: ["KDM"] },

  // AUDM
  { id: "walkinshaw-performance", name: "Walkinshaw Performance Console", desc: "Alloy-trimmed black leather centre tunnel with red-stitched arm pad and a gated alloy shifter — AUDM factory tuner DNA.", markets: ["AUDM"] },
  { id: "hsv-maloo-utility", name: "HSV Maloo Utility Console", desc: "Heavy-duty bolster-mounted centre tunnel with HSV badge, side-grab handles, and a chrome shifter — AUDM ute house style.", markets: ["AUDM"] },
];

export function getAvailableCenterConsoleUpgrades(market: Market): CenterConsoleUpgrade[] {
  return CENTER_CONSOLE_UPGRADES.filter(u =>
    u.markets.includes("Worldwide") || u.markets.includes(market)
  );
}

/**
 * Resolve a saved center-console upgrade id against a target vehicle's home
 * market for restore flows (gallery select, per-car memory rehydrate, etc.).
 *
 * - Missing / undefined / non-string id → OEM/Stock default.
 * - Unknown id (catalog drift) → OEM/Stock default.
 * - Id whose markets don't include the target market and isn't Worldwide
 *   → OEM/Stock default (so e.g. a USDM-only Hellcat console can't be
 *   restored onto a JDM Skyline).
 * - Otherwise → the saved id is returned verbatim.
 *
 * Centralising this rule means the save / restore contract is one line in
 * every call-site and is unit-testable without React.
 */
export function resolveRestorableCenterConsoleUpgrade(
  savedId: string | null | undefined,
  market: Market
): string {
  if (typeof savedId !== "string" || savedId.length === 0) {
    return CENTER_CONSOLE_UPGRADE_DEFAULT_ID;
  }
  const available = getAvailableCenterConsoleUpgrades(market);
  return available.some(u => u.id === savedId)
    ? savedId
    : CENTER_CONSOLE_UPGRADE_DEFAULT_ID;
}

const MODEL_CATEGORY_MAP: Record<string, VehicleCategory> = {
  "M2": "sports-coupe",
  "M3": "sedan",
  "M4": "sports-coupe",
  "M5": "sedan",
  "M8": "grand-tourer",
  "8 Series": "grand-tourer",
  "X5 M": "suv",
  "X6 M": "suv",
  "AMG GT": "sports-coupe",
  "AMG C63": "sedan",
  "AMG E63": "sedan",
  "S-Class": "sedan",
  "G-Class": "suv",
  "SL 63 AMG": "grand-tourer",
  "RS3": "sedan",
  "RS5": "sports-coupe",
  "RS6 Avant": "wagon",
  "RS7": "sedan",
  "R8": "sports-coupe",
  "e-tron GT RS": "sedan",
  "911 Carrera S": "sports-coupe",
  "911 GT3": "sports-coupe",
  "911 Turbo S": "sports-coupe",
  "Panamera": "sedan",
  "Taycan Turbo": "sedan",
  "296 GTB": "sports-coupe",
  "SF90 Stradale": "hypercar",
  "Roma": "grand-tourer",
  "F8 Tributo": "sports-coupe",
  "Purosangue": "suv",
  "Huracán EVO": "sports-coupe",
  "Huracán Tecnica": "sports-coupe",
  "Urus S": "suv",
  "Revuelto": "hypercar",
  "720S": "hypercar",
  "765LT": "hypercar",
  "Artura": "sports-coupe",
  "Ghost": "sedan",
  "Cullinan": "suv",
  "Spectre": "grand-tourer",
  "Continental GT": "grand-tourer",
  "Bentayga": "suv",
  "GR Supra": "sports-coupe",
  "GR86": "sports-coupe",
  "GR Yaris": "sports-coupe",
  "Land Cruiser 300": "suv",
  "GT-R Nismo": "sports-coupe",
  "Z": "sports-coupe",
  "Patrol": "suv",
  "Mustang GT500": "muscle",
  "Mustang Dark Horse": "muscle",
  "GT": "hypercar",
  "Corvette Z06": "hypercar",
  "Corvette E-Ray": "sports-coupe",
  "Camaro ZL1": "muscle",
  "Model S Plaid": "sedan",
  "Cybertruck": "suv",
  "Vantage": "sports-coupe",
  "DB12": "grand-tourer",
  "DBX707": "suv",
  "Challenger SRT Demon": "muscle",
  "Charger Scat Pack": "muscle",
  "Challenger": "muscle",
  "Charger": "muscle",
  "Viper": "sports-coupe",
  "Durango": "suv",
  "Hornet": "crossover",
  // Classic cars
  "Model B (Deuce Coupe)": "classic",
  "Bel Air": "classic",
  "E-Type": "classic",
  "Cobra 289": "classic",
  "Corvette Sting Ray": "classic",
  "Mustang (1st Gen)": "classic",
  "GTO": "classic",
  "GT40": "classic",
  "GT500": "classic",
  "Camaro SS": "classic",
  "Charger R/T": "classic",
  "Firebird Trans Am": "classic",
  "'Cuda": "classic",
  "Chevelle SS": "classic",
  "Challenger R/T": "classic",
  "HEMI 'Cuda": "classic",
  "240Z": "classic",
  "911 Carrera RS 2.7": "classic",
  "Countach LP400": "classic",
  "2002 Turbo": "classic",
  "288 GTO": "classic",
  "959": "classic",
  "GNX": "classic",
  "Skyline GT-R R32": "classic",
  "NSX (NA1)": "classic",
  "EB110": "classic",
  "RX-7 FD": "classic",
  "F1": "classic",
  "Supra MK4 (A80)": "classic",
  "Skyline GT-R R34": "classic",
  // Honda — modern hot hatches and roadster default to sports-coupe
  // (no dedicated hatchback category in this catalog); classic JDM coupes → classic
  "Civic Type R (FL5)": "sports-coupe",
  "Civic Type R (FK8)": "sports-coupe",
  "Civic Type R (EP3)": "sports-coupe",
  "Civic Type R (FD2)": "sports-coupe",
  "Civic Type R (FK2)": "sports-coupe",
  "S2000": "sports-coupe",
  "NSX (NA2)": "sports-coupe",
  "CR-Z": "sports-coupe",
  "Insight": "sedan",
  "Element": "suv",
  "Crosstour": "wagon",
  "Passport": "suv",
  "Integra Type R (DC2)": "classic",
  "Civic Type R (EK9)": "classic",
  "Prelude (5th Gen)": "classic",
  "Prelude (6th Gen)": "sports-coupe",
  // Volkswagen
  "Golf R (Mk8)": "sports-coupe",
  "Golf GTI (Mk8)": "sports-coupe",
  "Scirocco R": "sports-coupe",
  "Arteon R": "sedan",
  "Golf R32 (Mk5)": "classic",
  "Golf MK1 GTI": "classic",
  // Subaru
  "WRX STI (VA)": "sedan",
  "WRX (VB)": "sedan",
  "BRZ": "sports-coupe",
  "Impreza WRX STI (GD)": "classic",
  "22B STI": "classic",
  "SVX": "classic",
  // Peugeot
  "208 GTI": "sports-coupe",
  "308 GTI": "sports-coupe",
  "RCZ R": "sports-coupe",
  "205 GTI": "classic",
  // Mitsubishi
  "Lancer Evolution X": "sedan",
  "Lancer Evolution IX": "classic",
  "Lancer Evolution VI TME": "classic",
  "3000GT": "classic",
  "Eclipse GSX": "classic",
  "Pajero Evolution": "suv",
  "Pajero SWB Gen 1": "suv",
  "Pajero SWB Gen 2": "suv",
  "Pajero SWB Gen 3": "suv",
  "Pajero SWB Gen 4": "suv",
  // BYD
  "Seal": "sedan",
  "Han": "sedan",
  "Seal U": "suv",
  "Atto 3": "suv",
  "Tang": "suv",
  "Dolphin": "hatchback",
  "Song Plus": "crossover",
  // NIO
  "ET5": "sedan",
  "ET7": "sedan",
  "ES6": "crossover",
  "ES7": "crossover",
  "EC6": "crossover",
  "ET5T": "crossover",
  "EC7": "crossover",
  // Xpeng
  "P7": "sedan",
  "G9": "crossover",
  "G6": "crossover",
  "X9": "minivan",
  "P5": "sedan",
  // Li Auto
  "L9": "crossover",
  "L8": "crossover",
  "L7": "crossover",
  "L6": "crossover",
  "Mega": "minivan",
  // Zeekr
  "Zeekr 001": "crossover",
  "Zeekr 007": "sedan",
  "Zeekr X": "crossover",
  "Zeekr 009": "minivan",
  // Geely
  "Emgrand": "sedan",
  "Xingyue L": "crossover",
  "Boyue": "crossover",
  "Preface": "sedan",
  "Galaxy L6": "crossover",
  "Galaxy E5": "sedan",
  // Lynk & Co
  "Lynk 01": "crossover",
  "Lynk 05": "sedan",
  "Lynk 06": "crossover",
  "Lynk 08": "crossover",
  "Lynk 09": "crossover",
  // Jetour
  "X70": "suv",
  "X70 Plus": "suv",
  "X90": "suv",
  "X90 Plus": "suv",
  "Dashing": "crossover",
  "T2": "suv",
  "T1": "suv",
  "X50": "crossover",
  "G700": "suv",
  "F700": "pickup",
  // Chery
  "Tiggo 8 Pro": "suv",
  "Tiggo 7 Pro": "crossover",
  "Tiggo 4 Pro": "crossover",
  "Arrizo 8": "sedan",
  "Arrizo 6 Pro": "sedan",
  // EXEED
  "Sterra ES": "crossover",
  "Sterra ET": "crossover",
  "LX": "crossover",
  "VX": "crossover",
  // Changan
  "CS75 Plus": "crossover",
  "CS55 Plus": "crossover",
  "Uni-V": "sports-coupe",
  "Uni-K": "crossover",
  "Lamore": "sedan",
  "UNI-T": "crossover",
  // Deep Blue
  "SL03": "sedan",
  "S7": "crossover",
  "G318": "suv",
  // MG
  "MG4": "hatchback",
  "MG5": "sedan",
  "MG ZS": "crossover",
  "MG HS": "crossover",
  "Cyberster": "sports-coupe",
  // Roewe
  "D7": "sedan",
  "RX5": "crossover",
  "i5": "sedan",
  "Marvel R": "crossover",
  // Haval
  "H6": "crossover",
  "Haval H9": "suv",
  "Jolion": "crossover",
  "Dargo": "suv",
  // Tank
  "Tank 300": "suv",
  "Tank 400": "suv",
  "Tank 500": "suv",
  // Wey
  "Coffee 01": "crossover",
  "Coffee 02": "crossover",
  "Blue Mountain": "crossover",
  // Hongqi
  "Hongqi H9": "sedan",
  "H5": "sedan",
  "E-HS9": "suv",
  "EH7": "sedan",
  "E-QM5": "sedan",
  // Voyah
  "Free": "crossover",
  "Dream": "minivan",
  "Passion": "sedan",
  // IM Motors
  "IM L7": "sedan",
  "LS7": "crossover",
  "IM L6": "sedan",
  // Leapmotor
  "C01": "sedan",
  "C10": "crossover",
  "C11": "crossover",
  "T03": "hatchback",
  // NETA
  "NETA V": "crossover",
  "NETA U": "crossover",
  "NETA S": "sports-coupe",
  "AYA": "hatchback",
  // AVATR
  "AVATR 11": "crossover",
  "AVATR 12": "sedan",
  // Aion
  "Y Plus": "crossover",
  "S Plus": "sedan",
  "V Plus": "crossover",
  "LX Plus": "suv",
  "Hyper GT": "sports-coupe",
  // Arcfox
  "Alpha S": "sedan",
  "Alpha T": "crossover",
  "Kaola": "crossover",
  // Denza
  "D9": "minivan",
  "N7": "crossover",
  "N8": "crossover",
  "Z9": "crossover",
  "Z9 GT": "sports-coupe",
  // Yangwang
  "U8": "suv",
  "U9": "hypercar",
  // Fang Cheng Bao
  "Bao 5": "suv",
  "Bao 8": "suv",
  "Leopard 8": "suv",
  // GAC Trumpchi
  "GS8": "crossover",
  "GS4": "crossover",
  "Trumpchi M8": "minivan",
  "E9": "crossover",
  // BAIC
  "BJ60": "suv",
  "BJ40": "suv",
  "X7": "crossover",
  // JAC
  "JS4": "crossover",
  "Yiwei A5": "sedan",
  "Refine S7": "crossover",
  // Ora
  "Good Cat": "hatchback",
  "Ballet Cat": "hatchback",
  "Punk Cat": "hatchback",
  // Wuling
  "Hongguang Mini EV": "hatchback",
  "Air EV": "hatchback",
  "Bingo": "hatchback",
  // Toyota — production models
  "Camry": "sedan",
  "Corolla": "sedan",
  "RAV4": "crossover",
  "Highlander": "crossover",
  "Hilux": "pickup",
  "4Runner": "suv",
  "Prius": "sedan",
  "Tacoma": "pickup",
  "Tundra": "pickup",
  // Honda — production models
  "Civic": "hatchback",
  "Accord": "sedan",
  "CR-V": "crossover",
  "Pilot": "crossover",
  "HR-V": "crossover",
  "Odyssey": "minivan",
  "Ridgeline": "pickup",
  "Fit": "hatchback",
  // Ford — production models
  "F-150": "pickup",
  "Ranger": "pickup",
  "Explorer": "crossover",
  "Escape": "crossover",
  "Bronco": "suv",
  "Maverick": "pickup",
  "Focus": "hatchback",
  "Fiesta": "hatchback",
  // Chevrolet — production models
  "Silverado": "pickup",
  "Tahoe": "suv",
  "Suburban": "suv",
  "Equinox": "crossover",
  "Malibu": "sedan",
  "Trailblazer": "crossover",
  "Colorado": "pickup",
  // Tesla — production models
  "Model 3": "sedan",
  "Model Y": "crossover",
  // Nissan — production models
  "Altima": "sedan",
  "Sentra": "sedan",
  "Rogue": "crossover",
  "Pathfinder": "crossover",
  "Frontier": "pickup",
  "Qashqai": "crossover",
  "Juke": "crossover",
  "X-Trail": "crossover",
  // Mazda — production models
  "Mazda 3": "hatchback",
  "Mazda 6": "sedan",
  "CX-5": "crossover",
  "CX-30": "crossover",
  "CX-90": "crossover",
  "MX-5 Miata": "sports-coupe",
  // Volkswagen — production models
  "Tiguan": "crossover",
  "Passat": "sedan",
  "Polo": "hatchback",
  "T-Roc": "crossover",
  "Touareg": "suv",
  "Amarok": "pickup",
  // Peugeot — production models
  "3008": "crossover",
  "5008": "crossover",
  "2008": "crossover",
  // Mitsubishi — production models
  "Outlander": "crossover",
  "ASX": "crossover",
  "L200": "pickup",
  // BMW — production models
  "3 Series": "sedan",
  "5 Series": "sedan",
  "X3": "crossover",
  "X5": "suv",
  "1 Series": "hatchback",
  // Mercedes-Benz — production models
  "C-Class": "sedan",
  "E-Class": "sedan",
  "GLC": "crossover",
  "GLE": "suv",
  "A-Class": "hatchback",
  // Audi — production models
  "A3": "hatchback",
  "A4": "sedan",
  "A6": "sedan",
  "Q5": "crossover",
  "Q7": "suv",
  // Hyundai
  "Tucson": "crossover",
  "Santa Fe": "crossover",
  "Elantra": "sedan",
  "Sonata": "sedan",
  "Kona": "crossover",
  "Palisade": "crossover",
  "i30": "hatchback",
  // Kia
  "Sportage": "crossover",
  "Sorento": "crossover",
  "Telluride": "crossover",
  "Seltos": "crossover",
  "K5": "sedan",
  "Picanto": "hatchback",
  "Stonic": "crossover",
  // Suzuki
  "Swift": "hatchback",
  "Vitara": "crossover",
  "Jimny": "suv",
  // Jeep
  "Wrangler": "suv",
  "Grand Cherokee": "suv",
  "Compass": "crossover",
  "Gladiator": "pickup",
  // Ram
  "1500": "pickup",
  "2500": "pickup",
  // Land Rover
  "Defender": "suv",
  "Range Rover Sport": "suv",
  "Discovery": "suv",
  // Volvo
  "XC60": "crossover",
  "XC90": "suv",
  "V60": "wagon",
  "S60": "sedan",
  // MINI
  "Cooper": "hatchback",
  "Cooper Coupé": "sports-coupe",
  "Countryman": "crossover",
  // Dacia
  "Sandero": "hatchback",
  "Duster": "crossover",
  // Renault
  "Clio": "hatchback",
  "Captur": "crossover",
  "Megane": "hatchback",
  // Citroën
  "C3": "hatchback",
  "C4": "hatchback",
  "C5 Aircross": "crossover",
  // Fiat
  "500": "hatchback",
  "Panda": "hatchback",
  "Tipo": "sedan",
  // SEAT
  "Leon": "hatchback",
  "Ateca": "crossover",
  "Ibiza": "hatchback",
  // Skoda
  "Octavia": "sedan",
  "Octavia Combi": "wagon",
  "Kodiaq": "crossover",
  "Superb": "sedan",
  "Superb Combi": "wagon",
  "Fabia": "hatchback",
  // Minivans (new additions)
  "Sienna": "minivan",
  "Multivan": "minivan",
  "V-Class": "minivan",
  "Staria": "minivan",
  "Carnival": "minivan",
  "Pacifica": "minivan",
  "Voyager": "minivan",
  // Production wagons (new additions)
  "Corolla Touring Sports": "wagon",
  "Passat Variant": "wagon",
  "A4 Avant": "wagon",
  "A6 Avant": "wagon",
  "E-Class All-Terrain": "wagon",
  "V90": "wagon",
};

export function getVehicleCategory(make: string, model: string): VehicleCategory {
  return MODEL_CATEGORY_MAP[model] ?? "sports-coupe";
}

export function isCuratedModel(model: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODEL_CATEGORY_MAP, model);
}

// Default canonical body style derived from the curated VehicleCategory. Only
// used to assign a single valid style to curated models that are not explicitly
// listed in MODEL_BODY_STYLE_OPTIONS or CURATED_MODEL_BODY_STYLE.
const CATEGORY_DEFAULT_BODY_STYLE: Record<VehicleCategory, BodyStyle> = {
  "sports-coupe": "coupe",
  "hypercar": "coupe",
  "suv": "suv",
  "muscle": "coupe",
  "sedan": "sedan",
  "grand-tourer": "coupe",
  "wagon": "wagon",
  "classic": "coupe",
  "pickup": "truck",
  "hatchback": "hatchback",
  "crossover": "suv",
  "minivan": "suv",
};

export type BodyStyle = "sedan" | "hatchback" | "coupe" | "convertible" | "wagon" | "suv" | "truck";

const VALID_BODY_STYLES = new Set<BodyStyle>(["sedan", "hatchback", "coupe", "convertible", "wagon", "suv", "truck"]);

export function isCanonicalBodyStyle(s: unknown): s is BodyStyle {
  return typeof s === "string" && VALID_BODY_STYLES.has(s as BodyStyle);
}

export const BODY_STYLE_LABELS: Record<BodyStyle, string> = {
  sedan: "Sedan",
  hatchback: "Hatchback",
  coupe: "Coupe",
  convertible: "Convertible",
  wagon: "Wagon",
  suv: "SUV",
  truck: "Truck",
};

const MODEL_BODY_STYLE_OPTIONS: Record<string, { options: BodyStyle[]; default: BodyStyle }> = {
  "Honda:Civic": { options: ["sedan", "hatchback"], default: "sedan" },
  // Four-door through 2023; the 2024+ generation adds a two-door.
  "Dodge:Charger": { options: ["sedan", "coupe"], default: "sedan" },
  "BMW:8 Series": { options: ["coupe", "convertible"], default: "coupe" },
  "BMW:M8": { options: ["coupe", "convertible"], default: "coupe" },
  "Ford:Mustang Dark Horse": { options: ["coupe", "convertible"], default: "coupe" },
  "Mercedes-Benz:SL 63 AMG": { options: ["convertible"], default: "convertible" },
  "Honda:S2000": { options: ["convertible"], default: "convertible" },
  "Honda:Civic Type R (EP3)": { options: ["hatchback"], default: "hatchback" },
  "Honda:Civic Type R (FD2)": { options: ["sedan"], default: "sedan" },
  "Honda:Civic Type R (FK2)": { options: ["hatchback"], default: "hatchback" },
  "Mazda:MX-5 Miata": { options: ["convertible"], default: "convertible" },
};

// Curated catalog factory body style — mirrors api-server KNOWN_MODEL_BODY_STYLES.
// Only single-style entries (multi-style models live in MODEL_BODY_STYLE_OPTIONS).
const CURATED_MODEL_BODY_STYLE: Record<string, BodyStyle> = {
  "BMW:M3": "sedan", "BMW:M5": "sedan", "Mercedes-Benz:AMG C63": "sedan",
  "Mercedes-Benz:AMG E63": "sedan", "Mercedes-Benz:S-Class": "sedan",
  "Porsche:Panamera": "sedan", "Porsche:Taycan Turbo": "sedan",
  "Rolls-Royce:Ghost": "sedan", "Rolls-Royce:Spectre": "sedan",
  "Audi:RS7": "sedan", "Dodge:Charger Scat Pack": "sedan",
  "Tesla:Model S Plaid": "sedan",
  "BMW:M2": "coupe", "BMW:M4": "coupe", "Mercedes-Benz:AMG GT": "coupe",
  "Porsche:911 Carrera S": "coupe", "Porsche:911 GT3": "coupe", "Porsche:911 Turbo S": "coupe",
  "Bentley:Continental GT": "coupe", "Ferrari:296 GTB": "coupe", "Ferrari:Roma": "coupe",
  "Ferrari:F8 Tributo": "coupe", "Ferrari:SF90 Stradale": "coupe",
  "Lamborghini:Huracán EVO": "coupe", "Lamborghini:Huracán Tecnica": "coupe", "Lamborghini:Revuelto": "coupe",
  "McLaren:720S": "coupe", "McLaren:765LT": "coupe", "McLaren:Artura": "coupe",
  "Audi:R8": "coupe", "Audi:RS5": "coupe", "Audi:e-tron GT RS": "sedan",
  "Aston Martin:Vantage": "coupe", "Aston Martin:DB12": "coupe",
  "Ford:GT": "coupe", "Chevrolet:Corvette Z06": "coupe", "Chevrolet:Corvette E-Ray": "coupe",
  "Chevrolet:Camaro ZL1": "coupe", "Nissan:GT-R Nismo": "coupe", "Nissan:Z": "coupe",
  "Toyota:GR Supra": "coupe", "Toyota:GR86": "coupe", "Dodge:Challenger SRT Demon": "coupe",
  "Ford:Model B (Deuce Coupe)": "coupe", "Chevrolet:Bel Air": "coupe", "Jaguar:E-Type": "coupe",
  "Shelby:Cobra 289": "coupe", "Chevrolet:Corvette Sting Ray": "coupe",
  "Ford:Mustang (1st Gen)": "coupe", "Pontiac:GTO": "coupe", "Ford:GT40": "coupe",
  "Shelby:GT500": "coupe", "Chevrolet:Camaro SS": "coupe", "Dodge:Charger R/T": "coupe",
  "Pontiac:Firebird Trans Am": "coupe", "Plymouth:'Cuda": "coupe", "Chevrolet:Chevelle SS": "coupe",
  "Dodge:Challenger R/T": "coupe", "Plymouth:HEMI 'Cuda": "coupe", "Datsun:240Z": "coupe",
  "Porsche:911 Carrera RS 2.7": "coupe", "Lamborghini:Countach LP400": "coupe",
  "BMW:2002 Turbo": "coupe", "Ferrari:288 GTO": "coupe", "Porsche:959": "coupe",
  "Buick:GNX": "coupe", "Nissan:Skyline GT-R R32": "coupe", "Acura:NSX (NA1)": "coupe",
  "Bugatti:EB110": "coupe", "Mazda:RX-7 FD": "coupe", "McLaren:F1": "coupe",
  "Toyota:Supra MK4 (A80)": "coupe", "Nissan:Skyline GT-R R34": "coupe",
  "Ford:Mustang GT500": "coupe",
  "Dodge:Challenger": "coupe", "Dodge:Viper": "coupe", "Dodge:Durango": "suv", "Dodge:Hornet": "suv",
  "Toyota:GR Yaris": "hatchback", "Audi:RS3": "hatchback",
  "Audi:RS6 Avant": "wagon",
  "BMW:X5 M": "suv", "BMW:X6 M": "suv", "Mercedes-Benz:G-Class": "suv",
  "Lamborghini:Urus S": "suv", "Ferrari:Purosangue": "suv", "Rolls-Royce:Cullinan": "suv",
  "Bentley:Bentayga": "suv", "Aston Martin:DBX707": "suv", "Toyota:Land Cruiser 300": "suv",
  "Nissan:Patrol": "suv", "Tesla:Cybertruck": "truck",
  "Honda:Civic Type R (FL5)": "hatchback", "Honda:Civic Type R (FK8)": "hatchback",
  "Honda:Civic Type R (EK9)": "hatchback", "Honda:Integra Type R (DC2)": "coupe",
  "Honda:Prelude (5th Gen)": "coupe",
  "Honda:Prelude (6th Gen)": "coupe",
  "Honda:Civic Type R (EP3)": "hatchback", "Honda:Civic Type R (FD2)": "sedan",
  "Honda:Civic Type R (FK2)": "hatchback", "Honda:NSX (NA2)": "coupe",
  "Honda:CR-Z": "coupe", "Honda:Insight": "sedan", "Honda:Element": "suv",
  "Honda:Crosstour": "wagon", "Honda:Passport": "suv",
  "Volkswagen:Golf R (Mk8)": "hatchback", "Volkswagen:Golf GTI (Mk8)": "hatchback",
  "Volkswagen:Golf R32 (Mk5)": "hatchback", "Volkswagen:Golf MK1 GTI": "hatchback",
  "Volkswagen:Scirocco R": "coupe", "Volkswagen:Arteon R": "sedan",
  "Subaru:WRX STI (VA)": "sedan", "Subaru:WRX (VB)": "sedan",
  "Subaru:Impreza WRX STI (GD)": "sedan", "Subaru:22B STI": "sedan",
  "Subaru:BRZ": "coupe", "Subaru:SVX": "coupe",
  "Peugeot:208 GTI": "hatchback", "Peugeot:308 GTI": "hatchback",
  "Peugeot:205 GTI": "hatchback", "Peugeot:RCZ R": "coupe",
  "Mitsubishi:Lancer Evolution X": "sedan", "Mitsubishi:Lancer Evolution IX": "sedan",
  "Mitsubishi:Lancer Evolution VI TME": "sedan", "Mitsubishi:3000GT": "coupe",
  "Mitsubishi:Eclipse GSX": "coupe", "Mitsubishi:Pajero Evolution": "suv",
  "Mitsubishi:Pajero SWB Gen 1": "suv", "Mitsubishi:Pajero SWB Gen 2": "suv",
  "Mitsubishi:Pajero SWB Gen 3": "suv", "Mitsubishi:Pajero SWB Gen 4": "suv",
  "BYD:Seal": "sedan", "BYD:Han": "sedan", "BYD:Seal U": "suv",
  "BYD:Atto 3": "suv", "BYD:Tang": "suv", "BYD:Dolphin": "hatchback",
  "BYD:Song Plus": "suv",
  // NIO
  "NIO:ET5": "sedan", "NIO:ET7": "sedan", "NIO:ES6": "suv",
  "NIO:ES7": "suv", "NIO:EC6": "suv", "NIO:ET5T": "suv", "NIO:EC7": "suv",
  // Xpeng
  "Xpeng:P7": "sedan", "Xpeng:G9": "suv", "Xpeng:G6": "suv",
  "Xpeng:X9": "suv", "Xpeng:P5": "sedan",
  // Li Auto
  "Li Auto:L9": "suv", "Li Auto:L8": "suv", "Li Auto:L7": "suv",
  "Li Auto:L6": "suv", "Li Auto:Mega": "suv",
  // Zeekr
  "Zeekr:Zeekr 001": "suv", "Zeekr:Zeekr 007": "sedan",
  "Zeekr:Zeekr X": "suv", "Zeekr:Zeekr 009": "suv",
  // Geely
  "Geely:Emgrand": "sedan", "Geely:Xingyue L": "suv", "Geely:Boyue": "suv",
  "Geely:Preface": "sedan", "Geely:Galaxy L6": "suv", "Geely:Galaxy E5": "sedan",
  // Lynk & Co
  "Lynk & Co:Lynk 01": "suv", "Lynk & Co:Lynk 05": "sedan",
  "Lynk & Co:Lynk 06": "suv", "Lynk & Co:Lynk 08": "suv", "Lynk & Co:Lynk 09": "suv",
  // Chery
  "Chery:Tiggo 8 Pro": "suv", "Chery:Tiggo 7 Pro": "suv", "Chery:Tiggo 4 Pro": "suv",
  "Chery:Arrizo 8": "sedan", "Chery:Arrizo 6 Pro": "sedan",
  // Jetour
  "Jetour:X70": "suv", "Jetour:X70 Plus": "suv", "Jetour:X90": "suv", "Jetour:X90 Plus": "suv",
  "Jetour:Dashing": "suv", "Jetour:T2": "suv", "Jetour:T1": "suv", "Jetour:X50": "suv",
  "Jetour:G700": "suv", "Jetour:F700": "truck",
  // EXEED
  "EXEED:Sterra ES": "suv", "EXEED:Sterra ET": "suv",
  "EXEED:LX": "suv", "EXEED:VX": "suv",
  // Changan
  "Changan:CS75 Plus": "suv", "Changan:CS55 Plus": "suv",
  "Changan:Uni-V": "coupe", "Changan:Uni-K": "suv",
  "Changan:Lamore": "sedan", "Changan:UNI-T": "suv",
  // Deep Blue
  "Deep Blue:SL03": "sedan", "Deep Blue:S7": "suv", "Deep Blue:G318": "suv",
  // MG
  "MG:MG4": "hatchback", "MG:MG5": "sedan", "MG:MG ZS": "suv",
  "MG:MG HS": "suv", "MG:Cyberster": "convertible",
  // Roewe
  "Roewe:D7": "sedan", "Roewe:RX5": "suv", "Roewe:i5": "sedan", "Roewe:Marvel R": "suv",
  // Haval
  "Haval:H6": "suv", "Haval:Haval H9": "suv", "Haval:Jolion": "suv", "Haval:Dargo": "suv",
  // Tank
  "Tank:Tank 300": "suv", "Tank:Tank 400": "suv", "Tank:Tank 500": "suv",
  // Wey
  "Wey:Coffee 01": "suv", "Wey:Coffee 02": "suv", "Wey:Blue Mountain": "suv",
  // Hongqi
  "Hongqi:Hongqi H9": "sedan", "Hongqi:H5": "sedan", "Hongqi:E-HS9": "suv",
  "Hongqi:EH7": "sedan", "Hongqi:E-QM5": "sedan",
  // Voyah
  "Voyah:Free": "suv", "Voyah:Dream": "suv", "Voyah:Passion": "sedan",
  // IM Motors
  "IM Motors:IM L7": "sedan", "IM Motors:LS7": "suv", "IM Motors:IM L6": "sedan",
  // Leapmotor
  "Leapmotor:C01": "sedan", "Leapmotor:C10": "suv",
  "Leapmotor:C11": "suv", "Leapmotor:T03": "hatchback",
  // NETA
  "NETA:NETA V": "suv", "NETA:NETA U": "suv",
  "NETA:NETA S": "sedan", "NETA:AYA": "hatchback",
  // AVATR
  "AVATR:AVATR 11": "suv", "AVATR:AVATR 12": "sedan",
  // Aion
  "Aion:Y Plus": "suv", "Aion:S Plus": "sedan", "Aion:V Plus": "suv",
  "Aion:LX Plus": "suv", "Aion:Hyper GT": "sedan",
  // Arcfox
  "Arcfox:Alpha S": "sedan", "Arcfox:Alpha T": "suv", "Arcfox:Kaola": "suv",
  // Denza
  "Denza:D9": "suv", "Denza:N7": "suv", "Denza:N8": "suv",
  "Denza:Z9": "sedan", "Denza:Z9 GT": "coupe",
  // Yangwang
  "Yangwang:U8": "suv", "Yangwang:U9": "coupe",
  // Fang Cheng Bao
  "Fang Cheng Bao:Bao 5": "suv", "Fang Cheng Bao:Bao 8": "suv", "Fang Cheng Bao:Leopard 8": "suv",
  // GAC Trumpchi
  "GAC Trumpchi:GS8": "suv", "GAC Trumpchi:GS4": "suv",
  "GAC Trumpchi:Trumpchi M8": "suv", "GAC Trumpchi:E9": "suv",
  // BAIC
  "BAIC:BJ60": "suv", "BAIC:BJ40": "suv", "BAIC:X7": "suv",
  // JAC
  "JAC:JS4": "suv", "JAC:Yiwei A5": "sedan", "JAC:Refine S7": "suv",
  // Ora
  "Ora:Good Cat": "hatchback", "Ora:Ballet Cat": "hatchback", "Ora:Punk Cat": "hatchback",
  // Wuling
  "Wuling:Hongguang Mini EV": "hatchback", "Wuling:Air EV": "hatchback", "Wuling:Bingo": "hatchback",
  "MINI:Cooper Coupé": "coupe",
};

// AI-found cars (not in curated catalog) get a small picker so users can refine.
// Curated cars use either MODEL_BODY_STYLE_OPTIONS or CURATED_MODEL_BODY_STYLE.
const AI_CATEGORY_BODY_STYLE_FALLBACK: Record<VehicleCategory, { options: BodyStyle[]; default: BodyStyle }> = {
  "sports-coupe":   { options: ["coupe", "convertible"], default: "coupe" },
  "hypercar":       { options: ["coupe", "convertible"], default: "coupe" },
  "suv":            { options: ["suv"], default: "suv" },
  "muscle":         { options: ["coupe", "convertible"], default: "coupe" },
  "sedan":          { options: ["sedan", "coupe", "wagon"], default: "sedan" },
  "grand-tourer":   { options: ["coupe", "convertible"], default: "coupe" },
  "wagon":          { options: ["wagon", "sedan"], default: "wagon" },
  "classic":        { options: ["coupe", "convertible", "sedan"], default: "coupe" },
  "pickup":         { options: ["truck"], default: "truck" },
  "hatchback":      { options: ["hatchback", "sedan"], default: "hatchback" },
  "crossover":      { options: ["suv"], default: "suv" },
  "minivan":        { options: ["suv"], default: "suv" },
};

export function getBodyStyleChoices(
  make: string,
  model: string,
  aiCategory?: string,
): { options: BodyStyle[]; default: BodyStyle } {
  const key = `${make}:${model}`;
  const explicit = MODEL_BODY_STYLE_OPTIONS[key];
  if (explicit) return explicit;
  const override = CURATED_MODEL_BODY_STYLE[key];
  if (override) return { options: [override], default: override };
  // Any curated catalog model with no explicit override is single-style:
  // derive from its VehicleCategory so picker auto-hides and an invalid
  // requested style cannot leak through.
  if (isCuratedModel(model)) {
    const def = CATEGORY_DEFAULT_BODY_STYLE[getVehicleCategory(make, model)];
    return { options: [def], default: def };
  }
  // AI-found models: prefer the AI-classified category over the model-map
  // fallback (which defaults unknown models to sports-coupe).
  const cat = (aiCategory && (aiCategory as VehicleCategory) in AI_CATEGORY_BODY_STYLE_FALLBACK)
    ? (aiCategory as VehicleCategory)
    : getVehicleCategory(make, model);
  return AI_CATEGORY_BODY_STYLE_FALLBACK[cat] ?? { options: ["coupe"], default: "coupe" };
}

export interface KitStyle {
  id: string;
  label: string;
  desc: string;
  signature?: boolean;
}

export const VANGUARD_CUSTOM_KIT: KitStyle = {
  id: "vanguard-custom",
  label: "✦ Vanguard Custom Kit",
  desc: "AI-designed signature concept kit — an original Vanguard creation engineered specifically for this car. No two alike.",
  signature: true,
};

const BASE_CATEGORY_KIT_STYLES: Record<VehicleCategory, KitStyle[]> = {
  "sports-coupe": [
    { id: "gt3-track", label: "GT3 Track Edition", desc: "Full competition aero suite with swan-neck wing and carbon floor diffuser" },
    { id: "gt4-street", label: "GT4 Street Sport", desc: "Road-legal aero inspired by GT4 Cup Car homologation parts" },
    { id: "time-attack", label: "Time Attack Cup", desc: "Maximum downforce setup with canard fins and rear diffuser extension" },
    { id: "endurance-gt", label: "Endurance GT", desc: "Long-haul race-inspired aero with reduced drag for high-speed stability" },
    { id: "touring-club", label: "Touring Club", desc: "Aggressive street presence with subtle aero gains and widened stance" },
  ],
  "hypercar": [
    { id: "trofeo-comp", label: "Trofeo Competizione", desc: "Full one-make race series aero package with active front flaps" },
    { id: "lemans-proto", label: "Le Mans Prototype", desc: "LMP-inspired underfloor venturi tunnels and motorsport-grade aero surfaces" },
    { id: "aero-pure", label: "Aerodynamica Pure", desc: "Mathematically optimised CFD-tested bodywork for peak downforce efficiency" },
    { id: "circuit-king", label: "Circuit King", desc: "Track-day focused kit maximising front axle load and cornering stability" },
    { id: "squadra-corse", label: "Squadra Corse", desc: "Factory racing division inspired, built to FIA technical regulations" },
  ],
  "suv": [
    { id: "urban-aggressor", label: "Urban Aggressor", desc: "Bold urban-assault stance with flared arches and skid plate integration" },
    { id: "perf-sport", label: "Performance Sport", desc: "Sport-tuned SUV aero reducing lift at motorway speeds with roof spoiler" },
    { id: "safari-overland", label: "Safari Overland", desc: "Heavy-duty arch flares and rooftop aero rail for overland adventure builds" },
    { id: "dark-commander", label: "Dark Commander", desc: "Sinister matte-black accent aero with underbody protection plates" },
    { id: "luxury-athletic", label: "Luxury Athletic", desc: "Tasteful performance accents maintaining premium SUV prestige" },
  ],
  "muscle": [
    { id: "street-demon", label: "Street Demon", desc: "Aggressive drag-strip inspired hood scoops and chin splitter" },
    { id: "drag-racer", label: "Drag Racer Pro", desc: "Quarter-mile focused cowl induction hood and rear traction spoiler" },
    { id: "pro-touring", label: "Pro Touring", desc: "Road-course muscle car aero with wide-body fenders and rear diffuser" },
    { id: "widebody-hellfire", label: "Widebody Hellfire", desc: "+80mm flared arches front and rear for massive rubber and dominating presence" },
    { id: "modern-restomod", label: "Modern Restomod", desc: "Classic muscle styling modernised with subtle aerodynamic enhancements" },
  ],
  "sedan": [
    { id: "exec-sport", label: "Executive Sport", desc: "Subtle executive performance aero with rear lip and front blade" },
    { id: "amg-touring", label: "AMG Touring M", desc: "Four-door performance car aero borrowing from touring car racing" },
    { id: "stealth-phantom", label: "Stealth Phantom", desc: "Low-profile aero barely visible but generating meaningful downforce" },
    { id: "rs-performance", label: "RS Performance", desc: "Motorsport-derived sedan aero with flat underbody and rear diffuser fins" },
    { id: "elite-saloon", label: "Elite Saloon", desc: "Premium saloon presence kit with carbon trim accents and subtle boot spoiler" },
  ],
  "grand-tourer": [
    { id: "bespoke-continental", label: "Bespoke Continental", desc: "Hand-crafted GT aero combining touring comfort with subtle performance gains" },
    { id: "noir-edition", label: "Noir Edition", desc: "Full black-out treatment with carbon aero elements and smoked lenses" },
    { id: "grand-sport", label: "Grand Sport", desc: "Race-inspired GT touring kit derived from endurance racing heritage" },
    { id: "lemans-revival", label: "Le Mans Revival", desc: "Homage to classic Le Mans GT racers with heritage-inspired aero shapes" },
    { id: "prestige-aero", label: "Prestige Aero", desc: "Elegant aerodynamic enhancement befitting the finest grand touring heritage" },
  ],
  "wagon": [
    { id: "rs-avant-race", label: "RS Avant Race", desc: "Full touring car inspired wide-body treatment for the ultimate sport wagon" },
    { id: "touring-storm", label: "Touring Storm", desc: "Aggressive stance kit with roof spoiler and rear diffuser for wagons" },
    { id: "stage-rally", label: "Stage Rally", desc: "Rally-inspired underbody protection, mud flaps and roof aero bar" },
    { id: "shooting-brake-gt", label: "Shooting Brake GT", desc: "GT racing inspired wide-body shooting brake with coupe-like aero aggression" },
    { id: "speedwagon", label: "Speedwagon", desc: "Street-tuned wagon aero for daily performance with weekend-warrior credibility" },
  ],
  "classic": [
    { id: "restomod", label: "Restomod", desc: "Modern drivetrain under period-correct restored shell with subtle contemporary aero accents" },
    { id: "pro-touring-classic", label: "Pro Touring", desc: "Handling-focused road-course classic with wide stance, modern brakes and pumped fenders" },
    { id: "hot-rod", label: "Hot Rod", desc: "Chopped and lowered street-rod vibe with exposed chrome, big-and-little rubber and flame detailing" },
    { id: "drag-pack", label: "Drag Pack", desc: "Quarter-mile build with cowl-induction hood, traction bars and rear wheelie stance" },
    { id: "period-correct", label: "Period Correct", desc: "Factory-spec restoration look — no aero, era-accurate chrome, OEM rims and stance" },
  ],
  "pickup": [
    { id: "sport-truck", label: "Sport Truck", desc: "Lowered stance with front splitter, side steps, and bed-mounted spoiler rail for the street-focused truck" },
    { id: "off-road-overland", label: "Off-Road Overland", desc: "Heavy-duty flared arches, rock-slider sills, and elevated bumper guard with winch provision" },
    { id: "lowered-street-hauler", label: "Lowered Street Hauler", desc: "Slammed attitude with wide arch flares, low-profile sill kit, and sport bed-rail finisher" },
    { id: "pre-runner", label: "Pre-Runner", desc: "Desert-race inspired front bash plate, extended arches, and functional bed-mounted aero brace" },
    { id: "work-spec", label: "Work-Spec", desc: "Tough utilitarian aero treatment with integrated running boards, nudge bar, and utility bed rail" },
  ],
  "hatchback": [
    { id: "hot-hatch-cup", label: "Hot Hatch Cup", desc: "Race-series inspired aero with front splitter canards, roofline lip spoiler, and deep rear apron" },
    { id: "track-day-brick", label: "Track Day Brick", desc: "Maximum downforce for a compact hatch — large front intake splitter and prominent roofline wing" },
    { id: "tuner-street", label: "Tuner Street", desc: "JDM-influenced street tuner aero with wide-body fenders, skirts, and roofline lip" },
    { id: "rally-stage", label: "Rally Stage", desc: "Rally-inspired arch flares, mud flaps, and bold roof-mounted aero fin" },
    { id: "boy-racer", label: "Boy-Racer", desc: "Bold aftermarket hatchback styling with chunky front lip, large side skirts, and rear roof spoiler" },
  ],
  "crossover": [
    { id: "urban-sport", label: "Urban Sport", desc: "City-focused crossover aero with front skid plate, side step cladding, and roof spoiler" },
    { id: "adventure-pack", label: "Adventure Pack", desc: "Off-road ready arch guards, raised bumper skid rails, and side-mounted aero steps" },
    { id: "soft-roader-aero", label: "Soft-Roader Aero", desc: "Aerodynamic enhancement for the road crossover with subtle diffuser and roofline spoiler" },
    { id: "lifestyle-edition", label: "Lifestyle Edition", desc: "Stylish crossover aero package with contrast cladding, full-width rear spoiler, and chrome accents" },
    { id: "daily-refined", label: "Daily Refined", desc: "Tasteful performance crossover treatment with front lip, side sills, and integrated roof fin" },
  ],
  "minivan": [
    { id: "family-sport", label: "Family Sport", desc: "Sporty minivan aero with front chin spoiler, side sill extensions, and tailgate lip spoiler" },
    { id: "lowered-surf-wagon", label: "Lowered Surf Wagon", desc: "Slammed MPV build with lowered stance, side skirts, and integrated roofline spoiler" },
    { id: "touring-aero", label: "Touring Aero", desc: "Highway-optimised minivan aerodynamics with flush side cladding and tailgate Gurney flap" },
    { id: "stealth-black", label: "Stealth Black", desc: "Full matte-black aero treatment with dark cladding, window delete trim, and black tailgate fin" },
    { id: "soccer-mom-sleeper", label: "Soccer-Mom Sleeper", desc: "Sleeper van aero hiding aggressive internals — subtle lip, side skirts, and low-profile tailgate spoiler" },
  ],
};

export const CATEGORY_KIT_STYLES: Record<VehicleCategory, KitStyle[]> = Object.fromEntries(
  (Object.entries(BASE_CATEGORY_KIT_STYLES) as [VehicleCategory, KitStyle[]][]).map(
    ([cat, kits]) => [cat, [VANGUARD_CUSTOM_KIT, ...kits]]
  )
) as Record<VehicleCategory, KitStyle[]>;

export interface Paint {
  name: string;
  hex: string;
  type: string;
  hex2?: string;
  shiftLabel?: string;
}
export const PAINTS: Paint[] = [
  { name: "Midnight Black", hex: "#0a0a0a", type: "Gloss" },
  { name: "Alpine White", hex: "#f4f2ee", type: "Gloss" },
  { name: "Estoril Blue", hex: "#1a3a72", type: "Metallic" },
  { name: "Imola Red", hex: "#c01018", type: "Gloss" },
  { name: "Rosso Corsa", hex: "#cc0a00", type: "Gloss" },
  { name: "Grigio Telesto", hex: "#9aa0a6", type: "Metallic" },
  { name: "Avus Silver", hex: "#c0c4c8", type: "Metallic" },
  { name: "Dakar Yellow", hex: "#e8b800", type: "Gloss" },
  { name: "Mamba Green", hex: "#1a4a2e", type: "Metallic" },
  { name: "Frozen Orange", hex: "#d4500a", type: "Matte" },
  { name: "Matte Black", hex: "#191919", type: "Matte" },
  { name: "Viola Pasifae", hex: "#4a1a6a", type: "Metallic" },
  { name: "Oro Elios", hex: "#c89010", type: "Metallic" },
  { name: "Verde Mantis", hex: "#5a8a1a", type: "Gloss" },
  { name: "Frozen Gray", hex: "#5a6068", type: "Matte" },
  { name: "Champagne Gold", hex: "#d4b060", type: "Metallic" },
  { name: "Carbon Gray", hex: "#383838", type: "Gloss" },
  { name: "Pearl White", hex: "#f0ece0", type: "Pearl" },
  { name: "Santorini Blue", hex: "#003d7a", type: "Gloss" },
  { name: "Laguna Seca", hex: "#1e5ca8", type: "Metallic" },
  { name: "Frozen Cerulean", hex: "#3a7bd5", type: "Matte" },
  { name: "British Racing", hex: "#00371a", type: "Metallic" },
  { name: "Mantis Lime", hex: "#72b832", type: "Gloss" },
  { name: "Sage Mist", hex: "#8aab80", type: "Pearl" },
  { name: "Cognac Bronze", hex: "#8b5e3c", type: "Metallic" },
  { name: "Desert Dune", hex: "#c2a57a", type: "Gloss" },
  { name: "Dark Tobacco", hex: "#4a2c17", type: "Satin" },
  { name: "Lavanda Dusk", hex: "#8a7abf", type: "Pearl" },
  { name: "Ultra Violet", hex: "#5b2d8e", type: "Gloss" },
  { name: "Molten Copper", hex: "#b56a30", type: "Metallic" },
  { name: "Gunmetal Storm", hex: "#4a4e57", type: "Metallic" },
  { name: "Ice Silver", hex: "#dce3ec", type: "Pearl" },
  { name: "Chalk Rose", hex: "#e8cfc8", type: "Matte" },
  { name: "Satin Graphite", hex: "#525c6a", type: "Satin" },
  { name: "Candy Targa", hex: "#d00020", type: "Gloss" },
  { name: "Solar Flare", hex: "#f5a623", type: "Metallic" },
  { name: "Nardo Gray", hex: "#6e7479", type: "Gloss" },
  { name: "Daytona Gray", hex: "#83878c", type: "Pearl" },
  { name: "Miami Blue", hex: "#00a8c8", type: "Gloss" },
  { name: "Riviera Blue", hex: "#0090d4", type: "Gloss" },
  { name: "Grabber Blue", hex: "#1077d8", type: "Gloss" },
  { name: "Bayside Blue", hex: "#1f4fc0", type: "Metallic" },
  { name: "Marina Blue", hex: "#2a63d4", type: "Metallic" },
  { name: "Nogaro Blue", hex: "#4666b0", type: "Pearl" },
  { name: "Tanzanite Blue", hex: "#16233f", type: "Metallic" },
  { name: "Frozen Navy", hex: "#1c2a44", type: "Matte" },
  { name: "Soul Red Crystal", hex: "#a01522", type: "Metallic" },
  { name: "Candy Brandywine", hex: "#7a1128", type: "Gloss" },
  { name: "Satin Dark Cherry", hex: "#5c1a24", type: "Satin" },
  { name: "Speed Yellow", hex: "#ffd300", type: "Gloss" },
  { name: "Papaya Orange", hex: "#ff8000", type: "Gloss" },
  { name: "Lava Orange", hex: "#f05a28", type: "Gloss" },
  { name: "Kyalami Orange", hex: "#ef7c00", type: "Metallic" },
  { name: "Python Green", hex: "#3fae2a", type: "Gloss" },
  { name: "Acid Green", hex: "#bcd400", type: "Metallic" },
  { name: "Java Green", hex: "#00b884", type: "Metallic" },
  { name: "Isle of Man Green", hex: "#0f5c3f", type: "Metallic" },
  { name: "Satin Deep Teal", hex: "#144f52", type: "Satin" },
  { name: "Matte Olive Drab", hex: "#4b5320", type: "Matte" },
  { name: "Frozen Sand", hex: "#b8a888", type: "Matte" },
  { name: "Championship White", hex: "#f8f6ef", type: "Gloss" },
  { name: "Midnight Purple", hex: "#2e1a47", type: "Metallic" },
  { name: "Hellraisin Purple", hex: "#55306a", type: "Metallic" },
  { name: "Plum Crazy", hex: "#8a4bc9", type: "Pearl" },
  { name: "Rubystone Pink", hex: "#d04f7e", type: "Gloss" },
  { name: "Chameleon Purple→Green", hex: "#6a0dad", type: "Color-Shift", hex2: "#00b050", shiftLabel: "Chameleon" },
  { name: "ChromaFlair Blue→Gold", hex: "#1a3faa", type: "Color-Shift", hex2: "#c49a00", shiftLabel: "ChromaFlair" },
  { name: "Flip Magenta→Teal", hex: "#c0006a", type: "Color-Shift", hex2: "#007a78", shiftLabel: "Flip" },
  { name: "Chameleon Green→Bronze", hex: "#1f7a1f", type: "Color-Shift", hex2: "#8b5e3c", shiftLabel: "Chameleon" },
  { name: "ChromaFlair Red→Violet", hex: "#cc0000", type: "Color-Shift", hex2: "#6600cc", shiftLabel: "ChromaFlair" },
  { name: "Flip Navy→Lime", hex: "#0d1b5e", type: "Color-Shift", hex2: "#b8e000", shiftLabel: "Flip" },
  { name: "Chameleon Copper→Sapphire", hex: "#b56020", type: "Color-Shift", hex2: "#1240ab", shiftLabel: "Chameleon" },
  { name: "Chameleon Midnight Purple→Blue", hex: "#3b1e6e", type: "Color-Shift", hex2: "#1e4fc4", shiftLabel: "Chameleon" },
  { name: "Flip Teal→Violet", hex: "#0e7d7d", type: "Color-Shift", hex2: "#7030b0", shiftLabel: "Flip" },
  { name: "ChromaFlair Silver→Rose", hex: "#b8bcc4", type: "Color-Shift", hex2: "#c05070", shiftLabel: "ChromaFlair" },
];

export interface RimStyle { id: string; name: string; sizes: string[] }
export const RIM_STYLES: RimStyle[] = [
  { id: "5spoke", name: "5-Spoke Sport", sizes: ["18\"", "19\"", "20\"", "21\""] },
  { id: "10spoke", name: "Multi-Spoke RS", sizes: ["18\"", "19\"", "20\"", "21\"", "22\""] },
  { id: "turbine", name: "Turbine Blade", sizes: ["19\"", "20\"", "21\""] },
  { id: "mesh", name: "Cross-Mesh", sizes: ["18\"", "19\"", "20\"", "21\""] },
  { id: "yspoke", name: "Y-Spoke GT", sizes: ["20\"", "21\"", "22\""] },
  { id: "flat", name: "Flat Disc", sizes: ["18\"", "19\"", "20\""] },
  { id: "deepdish", name: "Deep-Dish Lip", sizes: ["18\"", "19\"", "20\""] },
  { id: "splitspoke", name: "Split 6-Spoke", sizes: ["19\"", "20\"", "21\"", "22\""] },
  { id: "concave", name: "Concave Forged", sizes: ["19\"", "20\"", "21\"", "22\""] },
  { id: "wirespoke", name: "Wire-Spoke Classic", sizes: ["17\"", "18\"", "19\""] },
  { id: "honeycomb", name: "Honeycomb Aero", sizes: ["19\"", "20\"", "21\""] },
  { id: "twinblock", name: "Twin-5 Block", sizes: ["18\"", "19\"", "20\"", "21\""] },
  { id: "bbslm", name: "BBS-Style Mesh LM", sizes: ["18\"", "19\"", "20\""] },
  { id: "fanblade", name: "Fan-Blade Aero", sizes: ["19\"", "20\"", "21\""] },
  { id: "offroad", name: "Off-Road Beadlock", sizes: ["17\"", "18\"", "20\""] },
];

export interface RimColor { name: string; hex: string }
export const RIM_COLORS: RimColor[] = [
  { name: "Gloss Black", hex: "#0f0f0f" },
  { name: "Matte Black", hex: "#1a1a1a" },
  { name: "Anthracite", hex: "#3a3a3a" },
  { name: "Gunmetal Grey", hex: "#4a5058" },
  { name: "Polished Silver", hex: "#c0c4c8" },
  { name: "Hyper Silver", hex: "#a8b0b8" },
  { name: "Gold", hex: "#c8900a" },
  { name: "Champagne Gold", hex: "#d8b870" },
  { name: "Brushed Bronze", hex: "#8a6040" },
  { name: "Rose Bronze", hex: "#a86848" },
  { name: "Satin Chrome", hex: "#b0b8c0" },
  { name: "Polished Chrome", hex: "#e0e8f0" },
  { name: "Candy Red", hex: "#b81020" },
  { name: "Deep Blue", hex: "#1e3a78" },
  { name: "Forest Green", hex: "#1f4a2c" },
  { name: "Pearl White", hex: "#f0f0e8" },
  { name: "Satin Black", hex: "#141414" },
  { name: "Black Chrome", hex: "#24262c" },
  { name: "Graphite", hex: "#2e3238" },
  { name: "Titanium Grey", hex: "#6a6e74" },
  { name: "Smoked Chrome", hex: "#6e747e" },
  { name: "Brushed Titanium", hex: "#90949a" },
  { name: "Matte Silver", hex: "#b4b8bc" },
  { name: "Brushed Aluminium", hex: "#ccd0d4" },
  { name: "Machined Silver", hex: "#dcdee2" },
  { name: "Gloss White", hex: "#f6f7f2" },
  { name: "Satin White", hex: "#e6e6e0" },
  { name: "Matte Bronze", hex: "#96703c" },
  { name: "Brushed Gold", hex: "#b89440" },
  { name: "Matte Gold", hex: "#a8861c" },
  { name: "Rose Gold", hex: "#c88878" },
  { name: "Satin Copper", hex: "#b8651e" },
  { name: "Candy Orange", hex: "#d85a10" },
  { name: "Matte Red", hex: "#8a1418" },
  { name: "Candy Blue", hex: "#2050c8" },
  { name: "Matte Blue", hex: "#2a3a58" },
  { name: "Candy Purple", hex: "#6a28a8" },
  { name: "Emerald Green", hex: "#157a3c" },
  { name: "Neo Chrome", hex: "#5a4a8a" },
  { name: "Frozen Teal", hex: "#1a6a70" },
];

export interface Headlight { id: string; name: string; col: string; desc: string }
export const HEADLIGHTS: Headlight[] = [
  { id: "halogen", name: "Halogen", col: "#fff8d0", desc: "Standard halogen projection lens" },
  { id: "hid", name: "HID Xenon", col: "#d0e8ff", desc: "High-intensity discharge blue-white" },
  { id: "led", name: "Full LED", col: "#f8f8ff", desc: "Multi-matrix LED with adaptive beams" },
  { id: "laser", name: "Laser Light", col: "#e8f4ff", desc: "Laser high-beam, 600m illumination" },
];

export interface AmbientColor { name: string; hex: string }
export const AMBIENT_COLORS: AmbientColor[] = [
  { name: "Ice White", hex: "#e8f0ff" },
  { name: "Arctic Blue", hex: "#00c8ff" },
  { name: "Electric Teal", hex: "#00e8c8" },
  { name: "Amber Gold", hex: "#f5900a" },
  { name: "Rose Pink", hex: "#ff60a0" },
  { name: "Royal Purple", hex: "#8840ff" },
  { name: "Sunrise Red", hex: "#ff3828" },
  { name: "Neo Green", hex: "#40ff80" },
];

export interface Dashboard { id: string; name: string; desc: string }
export const DASHBOARDS: Dashboard[] = [
  { id: "sport", name: "Sport Carbon", desc: "Carbon fiber with Alcantara, shift-light arc" },
  { id: "luxury", name: "Grand Touring", desc: "Piano black, brushed aluminium, ambient rail" },
  { id: "digital", name: "Digital Cockpit", desc: "Full curved OLED with haptic controls + HUD" },
  { id: "racing", name: "Race Spec", desc: "Bare carbon, roll cage prep, 6-pt harness mounts" },
];

export interface Seat { id: string; name: string; desc: string }
export const SEATS: Seat[] = [
  { id: "nappa", name: "Nappa Leather", desc: "Quilted full-grain, ventilated 18-way power" },
  { id: "alcantara", name: "Alcantara", desc: "Microsuede, CF headrests, contrast stitching" },
  { id: "bucket", name: "Carbon Buckets", desc: "Ultralight shell, 4-pt harness prep" },
  { id: "recaro", name: "Sport Recaro", desc: "Adjustable sport buckets, FIA approved" },
];

export interface SeatColor { name: string; hex: string }
export const SEAT_COLORS: SeatColor[] = [
  { name: "Jet Black", hex: "#111" },
  { name: "Cognac", hex: "#8a4a18" },
  { name: "Ivory", hex: "#e8dcc8" },
  { name: "Burgundy", hex: "#5a0820" },
  { name: "Navy", hex: "#0a1a3a" },
  { name: "Racing Red", hex: "#8a0808" },
];

export interface KitPart {
  id: string;
  name: string;
  shortName: string;
  desc: string;
  view: string;
  features: string;
}
export const KIT_PARTS: KitPart[] = [
  { id: "frontBumper", name: "Front Bumper & Splitter", shortName: "Front Bumper", desc: "Wide-body front fascia with integrated carbon splitter and cooling ducts.", view: "straight-on front elevation angle", features: "aggressive wide air intakes, lower carbon lip splitter blade protruding forward, fog light housings, canard mounting flanges" },
  { id: "rearBumper", name: "Rear Bumper & Diffuser", shortName: "Rear Diffuser", desc: "Aggressive rear fascia with multi-channel ground effect diffuser and quad exhaust cutouts.", view: "rear 3/4 angle from slightly below", features: "four round exhaust cutouts, multi-fin underbody diffuser with 10 vertical fins, center tow hook cover" },
  { id: "sideSkirts", name: "Side Skirts", shortName: "Side Skirts", desc: "Full rocker panel extensions with underbody aero channels, +45mm extension.", view: "side profile", features: "long horizontal aerodynamic panel, three underbody channel cutouts along lower edge, mounting holes along top flange" },
  { id: "hoodVented", name: "Vented Hood", shortName: "Vented Hood", desc: "Heat-extraction vented hood with center-exit vent slots.", view: "front-top 3/4 angle", features: "two large elongated heat exit vents, center power dome ridge, carbon fiber surface" },
  { id: "trunkSpoiler", name: "Rear Spoiler / Wing", shortName: "Rear Spoiler", desc: "Body-fit rear aero element — duck-tail, boot-lip, roofline lip, or GT wing depending on body style and kit theme.", view: "rear 3/4 angle", features: "rear aero surface tailored to body style: coupe duck-tail integrated into deck lid trailing edge, sedan boot-lip bonded flush to trunk lid, hatchback/wagon slim roofline lip, or GT swan-neck wing with stanchions for track/race/wide-body builds" },
  { id: "front-fender", name: "Front Fenders", shortName: "Front Fenders", desc: "Vehicle-specific front fender panels or arch extensions, developed as a separate left/right body-kit part.", view: "front corner 3/4 angle", features: "distinct front wheel-arch contour, body-matched panel transitions, visible kit treatment without assuming a measured flare width" },
  { id: "rear-fender", name: "Rear Fenders", shortName: "Rear Fenders", desc: "Vehicle-specific rear fender panels or arch extensions, developed independently from the front fenders.", view: "rear corner 3/4 angle", features: "distinct rear wheel-arch contour, body-matched quarter-panel transitions, visible kit treatment without assuming a measured flare width" },
  { id: "canards", name: "Front Canards", shortName: "Canards", desc: "Aerodynamic dive planes for front axle downforce generation.", view: "front close-up angle", features: "pair of angled carbon fiber dive plane fins attached to front bumper corners, 35 degree attack angle" },
  { id: "roofSpoiler", name: "Roof Spoiler", shortName: "Roof Spoiler", desc: "Flush-mount rear roofline spoiler for Cd reduction.", view: "rear 3/4 angle", features: "slim aero blade mounted flush along the top rear edge of the roofline, clean minimalist profile" },
];

export interface CategoryModalPart {
  id: string;
  label: string;
  tag: string;
  dims: string;
  desc: string;
}

export const CATEGORY_MODAL_PARTS: Record<VehicleCategory, CategoryModalPart[]> = {
  "sports-coupe": [
    { id: "front", label: "Front Bumper + Splitter", tag: "FRONT", dims: "1950 × 425 × 720 mm • 6.4 kg", desc: "Wide-mouth racing front fascia with integrated carbon fibre splitter blade and aero brake cooling ducts." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate left and right front fender panels or arch extensions, shaped around the coupe's front wheel openings and bumper-to-door transitions." },
    { id: "sides", label: "Side Skirt Set (L+R)", tag: "SIDES", dims: "1850 × 380 × 75 mm • 3.8 kg each", desc: "Full rocker extensions with underbody diffuser channels guiding airflow to the rear diffuser." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear quarter fender panels or arch extensions following the coupe's rear wheel arch and quarter-panel profile." },
    { id: "rear", label: "Rear Bumper + Diffuser", tag: "REAR", dims: "1920 × 520 × 680 mm • 7.2 kg", desc: "Aggressive rear fascia with 10-fin ground effect diffuser and quad exhaust outlets." },
    { id: "wing", label: "Rear Aero Element", tag: "WING", dims: "1450 × 320 mm span • 4.9 kg", desc: "Duck-tail spoiler or GT swan-neck wing — type selected by kit theme and body suitability." },
    { id: "hood", label: "Vented Carbon Hood", tag: "HOOD", dims: "1480 × 420 mm • 2.9 kg (save 5.2 kg)", desc: "Heat-extraction vented hood with dual centre-exit vent slots and power dome ridge." },
  ],
  "hypercar": [
    { id: "front", label: "Active Front Splitter + Canards", tag: "FRONT", dims: "2020 × 480 × 740 mm • 5.8 kg", desc: "Le Mans-grade carbon splitter with active front flap servo and triple canard dive planes." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Dedicated front fender panels for the hypercar's low nose and front wheel arches, with clearance and panel interfaces to be vehicle-verified." },
    { id: "sides", label: "Sill Channels + Venturi Tunnels", tag: "SIDES", dims: "1920 × 420 × 90 mm • 4.2 kg each", desc: "Extended sill pods channelling underbody airflow into venturi tunnels for maximum ground effect." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender panels that transition into the hypercar's rear bodywork and cooling architecture; fitment remains vehicle-specific." },
    { id: "rear", label: "Rear Diffuser + Drag Reduction", tag: "REAR", dims: "1980 × 560 × 700 mm • 6.8 kg", desc: "LMP-derived diffuser with Gurney flap and active DRS-compatible trailing edge." },
    { id: "wing", label: "Biplane Rear Wing Assembly", tag: "WING", dims: "1520 × 350 mm span • 5.6 kg", desc: "Biplane endurance-spec wing producing over 400 kg downforce at 200 km/h with active aero." },
    { id: "hood", label: "Full-Body Aero Tonneau", tag: "HOOD", dims: "1540 × 440 mm • 2.2 kg (save 6.8 kg)", desc: "Full bonnet replacement in dry pre-preg carbon with integrated NACA ducts for mid-engine cooling." },
  ],
  "suv": [
    { id: "front", label: "Front Bumper + Skid Plate", tag: "FRONT", dims: "2080 × 460 × 820 mm • 9.2 kg", desc: "Commanding front fascia with integrated steel/carbon skid plate and tow-hook provisions." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or arch extensions tailored to the SUV's upright wheel openings and front-bumper interfaces." },
    { id: "sides", label: "Arch Flare Set (L+R)", tag: "SIDES", dims: "2100 × 200 × 120 mm • 5.4 kg each", desc: "+80mm OEM-style wide arch flares accommodating up to 285-section tyres with full wheel-well coverage." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear arch/fender treatment following the SUV's rear quarter and wheel-well coverage; dimensions depend on the selected vehicle." },
    { id: "rear", label: "Rear Bumper + Underbody Guard", tag: "REAR", dims: "2040 × 580 × 740 mm • 10.4 kg", desc: "Full rear fascia with integrated underbody protection guard and twin exhaust cut-outs." },
    { id: "wing", label: "Roof Aero Rail + Spoiler", tag: "ROOF", dims: "1600 × 160 mm span • 3.8 kg", desc: "Integrated roof aero rail with Gurney spoiler reducing lift at motorway speeds by 18%." },
    { id: "hood", label: "Raised Hood with Ram Air", tag: "HOOD", dims: "1620 × 480 mm • 4.2 kg", desc: "Raised hood profile with central ram-air induction scoop for engine breathing at elevated ride heights." },
  ],
  "muscle": [
    { id: "front", label: "Chin Splitter + Cowl Hood Induction", tag: "FRONT", dims: "1980 × 440 × 760 mm • 7.8 kg", desc: "Aggressive chin splitter and cowl-induction front bumper with quarter-panel vents." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Distinct front fender panels or bolt-on arch extensions suited to the muscle car's long-nose proportions and front wheel openings." },
    { id: "sides", label: "Rocker Panels + Quarter Scoops", tag: "SIDES", dims: "1900 × 400 × 80 mm • 4.6 kg each", desc: "Full rocker panels with integrated rear quarter-panel extraction scoops for brake cooling." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender panels or quarter-arch extensions shaped for the muscle car's rear wheel openings and quarter panels." },
    { id: "rear", label: "Rear Valance + Diffuser", tag: "REAR", dims: "1940 × 500 × 700 mm • 7.6 kg", desc: "Deep rear valance with five-fin ground effect diffuser and dual large-bore exhaust cut-outs." },
    { id: "wing", label: "Deck Lid Spoiler / Duck Tail", tag: "WING", dims: "1480 × 260 mm span • 3.6 kg", desc: "Classic muscle car duck-tail spoiler with modern carbon fibre construction and adjustable angle." },
    { id: "hood", label: "Cowl-Induction Vented Hood", tag: "HOOD", dims: "1500 × 440 mm • 3.8 kg (save 4.8 kg)", desc: "Raised cowl-induction hood with dual forward-facing ram-air scoops and centre power dome." },
  ],
  "sedan": [
    { id: "front", label: "Front Lip + Aero Blade", tag: "FRONT", dims: "1920 × 400 × 700 mm • 5.6 kg", desc: "Subtle but effective front aero blade with integrated LED daytime running accent." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or arch extensions preserving the sedan's front door shut lines and wheel-arch shape." },
    { id: "sides", label: "Side Skirt Extensions (L+R)", tag: "SIDES", dims: "1800 × 360 × 68 mm • 3.2 kg each", desc: "Low-profile rocker skirts with underbody flow channels improving aerodynamic efficiency." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender treatment integrated visually with the sedan's rear doors and quarter-panel wheel arches." },
    { id: "rear", label: "Rear Apron + Diffuser", tag: "REAR", dims: "1900 × 490 × 660 mm • 6.4 kg", desc: "Executive-grade rear apron with discreet five-fin diffuser and quad tailpipe outlets." },
    { id: "wing", label: "Boot Lid Spoiler", tag: "WING", dims: "1380 × 180 mm span • 2.4 kg", desc: "Flush-mounted boot lid spoiler with integrated third brake light, reducing rear lift by 12%." },
    { id: "hood", label: "Performance Carbon Hood", tag: "HOOD", dims: "1460 × 400 mm • 3.1 kg (save 4.2 kg)", desc: "Weight-reduction carbon hood with subtle power dome and hidden hinge mechanism." },
  ],
  "grand-tourer": [
    { id: "front", label: "GT Front Fascia + Splitter", tag: "FRONT", dims: "2000 × 440 × 730 mm • 6.8 kg", desc: "Wide grand touring front fascia inspired by endurance racing GT class bodywork." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels shaped to the GT's long front quarter, wheel openings, and refined fascia transitions." },
    { id: "sides", label: "Sill Extensions (L+R)", tag: "SIDES", dims: "1860 × 395 × 78 mm • 3.9 kg each", desc: "Elegant sill extensions with integrated carbon accent strip and subtle underbody diffuser channels." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear quarter fenders following the GT's broad rear haunches and flowing trunk-side profile." },
    { id: "rear", label: "Rear Bumper + Diffuser", tag: "REAR", dims: "1960 × 530 × 690 mm • 7.0 kg", desc: "Classic GT rear treatment with Le Mans-inspired diffuser and round exhaust surrounds." },
    { id: "wing", label: "GT Trunk Spoiler", tag: "WING", dims: "1420 × 280 mm span • 4.2 kg", desc: "Elegant flush boot-lid lip spoiler with slim carbon main plane — low-profile and bonded to trunk trailing edge." },
    { id: "hood", label: "Vented GT Hood", tag: "HOOD", dims: "1490 × 435 mm • 2.8 kg (save 5.0 kg)", desc: "Grand touring vented bonnet with rear-exit heat slots and classic GT power bulge." },
  ],
  "wagon": [
    { id: "front", label: "Front Bumper + Splitter", tag: "FRONT", dims: "1960 × 430 × 720 mm • 6.6 kg", desc: "Touring-car inspired front fascia with aggressive splitter and full-width brake cooling ducts." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or arch extensions tuned to the wagon's front wheel openings and long-roof body proportions." },
    { id: "sides", label: "Side Skirt Set (L+R)", tag: "SIDES", dims: "1870 × 390 × 76 mm • 4.0 kg each", desc: "Wide-body sill extensions giving the wagon an aggressive lowered visual appearance." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender treatment that follows the wagon's rear wheel arches without conflating it with the roof spoiler or side skirts." },
    { id: "rear", label: "Rear Bumper + Diffuser", tag: "REAR", dims: "1930 × 510 × 680 mm • 7.4 kg", desc: "Sport wagon rear fascia with five-channel undertray diffuser and quad exhaust provisions." },
    { id: "wing", label: "Roof Spoiler + Gurney Fin", tag: "WING", dims: "1500 × 200 mm span • 2.8 kg", desc: "Integrated roofline spoiler with Gurney fin trailing edge, optimised for wagon roofline aerodynamics." },
    { id: "hood", label: "Vented Carbon Hood", tag: "HOOD", dims: "1470 × 420 mm • 2.9 kg (save 5.2 kg)", desc: "Lightweight carbon hood with twin heat-extraction vents over the engine bay." },
  ],
  "classic": [
    { id: "front", label: "Chrome Front Bumper + Chin Spoiler", tag: "FRONT", dims: "1860 × 380 × 680 mm • 8.4 kg", desc: "Period-correct chrome front bumper with integrated low-profile chin spoiler and vintage fog light provisions." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or period-inspired arch extensions following the classic vehicle's original wheel openings and body lines." },
    { id: "sides", label: "Rocker Panels + Fender Flares (L+R)", tag: "SIDES", dims: "1820 × 360 × 80 mm • 5.2 kg each", desc: "Extended rocker panels with matching wide-body fender flares for authentic muscle and classic stance." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender panels or quarter-arch extensions matched to the classic vehicle's rear quarter shape and era-specific styling." },
    { id: "rear", label: "Rear Valance + Chrome Tips", tag: "REAR", dims: "1840 × 460 × 620 mm • 7.6 kg", desc: "Deep rear valance with integrated chrome exhaust tips and period-correct lower bodywork treatment." },
    { id: "wing", label: "Deck-Lid Duck-Tail Spoiler", tag: "WING", dims: "1380 × 240 mm span • 3.2 kg", desc: "Classic duck-tail spoiler integrated into the rear deck lid trailing edge — era-appropriate and factory-inspired." },
    { id: "hood", label: "Cowl-Induction Hood", tag: "HOOD", dims: "1480 × 420 mm • 4.1 kg", desc: "Raised cowl-induction hood with dual forward-facing ram-air scoops and prominent centre power dome." },
  ],
  "pickup": [
    { id: "front", label: "Front Bumper + Bull Bar", tag: "FRONT", dims: "2050 × 480 × 840 mm • 12.4 kg", desc: "Heavy-duty front fascia with integrated steel/carbon bull bar, winch provision, and auxiliary light cutouts." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or arch extensions accommodating the pickup's front wheel openings and cab-side panel interfaces." },
    { id: "sides", label: "Arch Flares + Running Boards (L+R)", tag: "SIDES", dims: "2200 × 240 × 140 mm • 7.8 kg each", desc: "+60 mm wide-arch flares with matching integrated side-step running boards for cab access and stance." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender/bed-side arch panels shaped around the pickup's rear wheels and bed-side structure." },
    { id: "rear", label: "Rear Bumper + Tow Step", tag: "REAR", dims: "2060 × 560 × 780 mm • 11.8 kg", desc: "Hardened rear fascia with integrated tow-bar step plate, recovery hook provisions, and quad exhaust cut-outs." },
    { id: "wing", label: "Bed-Rail Spoiler", tag: "BED", dims: "1800 × 120 mm span • 4.2 kg", desc: "Aerodynamic bed-rail spoiler bonded to the top of the tailgate — reduces bed turbulence and rear lift without any glass penetration." },
    { id: "hood", label: "Ram-Air Raised Hood", tag: "HOOD", dims: "1680 × 500 mm • 5.2 kg", desc: "Raised hood profile with twin forward-facing ram-air induction scoops matched to the engine bay inlet." },
  ],
  "hatchback": [
    { id: "front", label: "Front Bumper + Splitter", tag: "FRONT", dims: "1820 × 390 × 680 mm • 5.2 kg", desc: "Aggressive compact-car front fascia with integrated splitter blade and aero brake cooling ducts." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or arch extensions fitted to the hatchback's compact front wheel openings and short front overhang." },
    { id: "sides", label: "Side Skirt Set (L+R)", tag: "SIDES", dims: "1720 × 340 × 68 mm • 3.0 kg each", desc: "Full rocker extensions with underbody diffuser channels tuned for the shorter hatchback wheelbase." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender treatment following the hatchback's rear wheel arches and short quarter panels, separate from the hatch spoiler." },
    { id: "rear", label: "Rear Apron + Diffuser", tag: "REAR", dims: "1800 × 460 × 640 mm • 5.8 kg", desc: "Rear fascia with five-fin diffuser, dual exhaust outlets, and integrated lower bumper support." },
    { id: "wing", label: "Roofline Lip Spoiler", tag: "ROOF", dims: "1340 × 80 mm span • 1.8 kg", desc: "Compact roofline lip spoiler bonded flush to the trailing edge of the rear hatch roofline — never piercing the glass below." },
    { id: "hood", label: "Vented Sport Hood", tag: "HOOD", dims: "1360 × 360 mm • 2.4 kg (save 3.8 kg)", desc: "Lightweight carbon hood with twin heat-extraction vents and subtle power dome for engine bay breathing." },
  ],
  "crossover": [
    { id: "front", label: "Front Bumper + Skid Plate", tag: "FRONT", dims: "1980 × 450 × 800 mm • 8.6 kg", desc: "Crossover front fascia with integrated lower skid plate, tow provision, and sport fog light surrounds." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels or arch extensions integrated visually with the crossover's front cladding and raised wheel openings." },
    { id: "sides", label: "Cladding + Side Steps (L+R)", tag: "SIDES", dims: "2000 × 200 × 110 mm • 5.8 kg each", desc: "OEM-style arch cladding extensions with integrated side-step trim covering wheel well openings." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender panels or arch extensions matched to the crossover's rear cladding, quarter profile, and wheel-well coverage." },
    { id: "rear", label: "Rear Bumper + Diffuser", tag: "REAR", dims: "1980 × 520 × 720 mm • 9.0 kg", desc: "Crossover rear fascia with underbody skid plate, dual exhaust surrounds, and discreet diffuser section." },
    { id: "wing", label: "Roof Spoiler", tag: "ROOF", dims: "1520 × 120 mm span • 2.8 kg", desc: "Integrated roofline spoiler at the top of the rear hatch reducing rear lift at motorway speeds." },
    { id: "hood", label: "Sport Hood", tag: "HOOD", dims: "1540 × 460 mm • 3.8 kg", desc: "Subtle raised sport hood with central power dome and discrete heat extraction vents." },
  ],
  "minivan": [
    { id: "front", label: "Front Bumper + Chin Spoiler", tag: "FRONT", dims: "1980 × 420 × 760 mm • 7.4 kg", desc: "Full-width minivan front fascia with integrated chin spoiler, lower daytime running trim, and fog provision." },
    { id: "front-fender", label: "Front Fenders (L+R)", tag: "F-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Separate front fender panels shaped around the minivan's front wheel openings, cabin-forward proportions, and bumper interfaces." },
    { id: "sides", label: "Side Sill Extensions (L+R)", tag: "SIDES", dims: "2200 × 300 × 72 mm • 4.4 kg each", desc: "Low-profile sill extensions spanning the full rocker panel beneath the sliding door channel." },
    { id: "rear-fender", label: "Rear Fenders (L+R)", tag: "R-FENDER", dims: "Provisional — vehicle-specific dimensions and weight pending", desc: "Independent rear fender/arch panels designed around the minivan's rear wheel openings and sliding-door-to-quarter transitions." },
    { id: "rear", label: "Rear Apron + Diffuser", tag: "REAR", dims: "1960 × 480 × 680 mm • 7.0 kg", desc: "Minivan rear apron with discreet three-fin diffuser and dual exhaust exit styling." },
    { id: "wing", label: "Tailgate Lip Spoiler", tag: "TAIL", dims: "1560 × 70 mm span • 1.6 kg", desc: "Slim tailgate-top lip spoiler bonded to the trailing edge of the tailgate — low-profile, no stanchions." },
    { id: "hood", label: "Sport Hood Trim", tag: "HOOD", dims: "1580 × 440 mm • 3.2 kg", desc: "Subtle sport bonnet with mild power dome and front-edge badging surround in contrasting finish." },
  ],
};

const LEGACY_CATEGORY_SPEC_PART_IDS = ["front", "sides", "rear", "wing", "hood"] as const;

/**
 * Match spec rows to their stable part IDs. Older spec responses contain only the
 * original five rows; map those rows to their historical IDs and leave the two
 * newly-added fender cards on their honest provisional fallback content.
 */
export function mapCategorySpecParts<T extends object>(
  parts: readonly T[],
  categoryParts: readonly Pick<CategoryModalPart, "id">[],
): Record<string, T | undefined> {
  const mapped: Record<string, T | undefined> = {};
  const knownIds = new Set(categoryParts.map(part => part.id));
  const identified = parts.some(part => {
    const id = (part as { productionPartId?: string }).productionPartId;
    return !!id && knownIds.has(id);
  });
  if (identified) {
    for (const part of parts) {
      const id = (part as { productionPartId?: string }).productionPartId;
      if (id && knownIds.has(id)) mapped[id] = part;
    }
    return mapped;
  }

  // Only the five-part pre-fender response had a documented positional order.
  // Seven-row responses must carry stable productionPartId values; never infer
  // identities from their position because the backend may return them shuffled.
  const ids = parts.length === LEGACY_CATEGORY_SPEC_PART_IDS.length && knownIds.has("front-fender") && knownIds.has("rear-fender")
    ? LEGACY_CATEGORY_SPEC_PART_IDS
    : [];
  ids.forEach((id, index) => {
    if (knownIds.has(id)) mapped[id] = parts[index];
  });
  return mapped;
}

export function getPersistedDrawingContractSlots<T extends { partId: string; view: string }>(
  requestedSlots: readonly T[],
  persistedSlotKeys?: readonly string[] | null,
): T[] {
  if (!persistedSlotKeys?.length) return [...requestedSlots];
  const recordedKeys = new Set(persistedSlotKeys);
  return requestedSlots.filter(slot => recordedKeys.has(`${slot.partId}__${slot.view}`));
}

export function areIllustrationSlotsReady(
  slots: readonly { imageBase64: string | null; loading: boolean }[],
): boolean {
  return slots.length > 0 && slots.every(slot => !!slot.imageBase64 && !slot.loading);
}

export function hasUsablePartSpecDimensions(
  dimensions: unknown,
  weight: unknown,
): dimensions is { length: number; width: number; height: number } {
  if (!dimensions || typeof dimensions !== "object") return false;
  const candidate = dimensions as { length?: unknown; width?: unknown; height?: unknown };
  return Number.isFinite(candidate.length) && Number(candidate.length) > 0 &&
    Number.isFinite(candidate.width) && Number(candidate.width) > 0 &&
    Number.isFinite(candidate.height) && Number(candidate.height) > 0 &&
    Number.isFinite(weight) && Number(weight) >= 0;
}

export interface CfMaterial {
  id: string; name: string; w: string; finish: string; look: string;
  /** Woven cloth, or chopped fibre with no weave at all (forged). */
  pattern: "woven" | "random";
  /** What the material must look like in a photoreal render, specific enough that each one is recognisable. */
  render: string;
}
export const CF_MATERIALS: CfMaterial[] = [
  {
    id: "3kPlain", name: "3K Plain Weave", w: "1.62 kg/m²", finish: "Gloss/Matte/Satin", look: "classic carbon fiber 2x2 cross-hatch woven pattern, glossy finish", pattern: "woven",
    render: "a tight, even CHECKERBOARD of small square cells: each narrow tow (about 2 mm wide) passes over one and under one at 0°/90°, in perfectly straight rows aligned with the part's edges; neighbouring squares alternate light and dark as the angle to the light changes; deep glossy clear coat",
  },
  {
    id: "2x2Twill", name: "2×2 Twill Weave", w: "1.78 kg/m²", finish: "Gloss/Satin", look: "diagonal 45-degree twill carbon fiber weave, high-sheen finish", pattern: "woven",
    render: "a 2×2 TWILL: each narrow tow passes over two and under two, forming continuous DIAGONAL stepped stripes running at 45° across the surface, not a checkerboard; the diagonal bands shimmer and appear to slide as the viewing angle changes; deep glossy clear coat",
  },
  {
    id: "12kHeavy", name: "12K Heavy Weave", w: "2.44 kg/m²", finish: "Gloss", look: "large bold-tow carbon fiber weave pattern, thick fiber bundles visible", pattern: "woven",
    render: "a HEAVY 12K weave: wide, flat fibre bundles about three to four times wider than standard 3K, so the woven blocks are large and bold and clearly readable from several metres away; glossy clear coat",
  },
  {
    id: "forged", name: "Forged Carbon", w: "1.52 kg/m²", finish: "Gloss (random)", look: "random chopped strand forged carbon composite with organic flowing fiber texture", pattern: "random",
    render: "FORGED carbon (chopped fibre, compression moulded) — it has NO weave, NO grid and NO repeating pattern at all: the surface is a random MARBLED mosaic of irregular, flattened fibre flakes and swirls in deep black, charcoal and silvery grey, pieces of varied size and orientation overlapping like dark marble or granite camouflage; under the gloss clear coat individual flakes catch the light on their own, so some patches flash silver while neighbouring ones stay black; each part has its own unique random pattern. It must never look like woven cloth, a checkerboard or diagonal twill",
  },
  {
    id: "dryCarbon", name: "Dry Pre-preg Carbon", w: "1.18 kg/m²", finish: "Gloss/Matte", look: "ultra-fine precise uniform carbon fiber weave, competition race-grade surface", pattern: "woven",
    render: "DRY PRE-PREG carbon (autoclave cured, race grade): a very fine, tight twill with perfectly straight, uniform tows and no wavy or distorted lines even over curves; SATIN finish with soft, diffuse highlights instead of a wet mirror shine",
  },
  {
    id: "kevlarHybrid", name: "Carbon-Kevlar Hybrid", w: "1.98 kg/m²", finish: "Gloss", look: "interwoven black carbon fiber and yellow Kevlar aramid fibers, hybrid woven pattern", pattern: "woven",
    render: "a CARBON-KEVLAR hybrid weave: black carbon tows interwoven with GOLDEN-YELLOW aramid (Kevlar) tows, giving clearly visible black-and-gold stripes or checks; the yellow tows have a soft satin sheen while the black tows are glossy; glossy clear coat",
  },
];

// View keys are part of the API contract with /api/bodykit/generate-part-drawing.
// Prompt directives live exclusively in the API server's camera-director module.
// Display labels here are UX strings and should match the camera-director labels.
export type PartDrawingView = "front-elevation" | "side-profile" | "top-plan" | "isometric-detail";

const PART_DRAWING_VIEW_DISPLAY: Record<PartDrawingView, { label: string; short: string }> = {
  "front-elevation": { label: "Front Elevation", short: "FRONT" },
  "side-profile": { label: "Side Profile", short: "SIDE" },
  "top-plan": { label: "Top / Bottom Plan", short: "TOP" },
  "isometric-detail": { label: "Isometric Detail", short: "ISO" },
};

export const PART_DRAWING_VIEW_KEYS: readonly PartDrawingView[] = [
  "front-elevation",
  "side-profile",
  "top-plan",
  "isometric-detail",
] as const;

export const PART_DRAWING_VIEWS: { key: PartDrawingView; label: string; short: string }[] =
  PART_DRAWING_VIEW_KEYS.map(key => ({
    key,
    label: PART_DRAWING_VIEW_DISPLAY[key].label,
    short: PART_DRAWING_VIEW_DISPLAY[key].short,
  }));

// ─── Rear spoiler / aero type system ────────────────────────────────────────

export type RearAeroType = "gt-wing" | "duck-tail" | "boot-lip" | "roofline-lip" | "deck-lid-lip" | "bed-rail-spoiler" | "none";

// ─── Rear wing mounting style ────────────────────────────────────────────────

export type RearWingMounting = "swan-neck" | "pedestal" | "trunk-mount";

export const WING_MOUNTING_LABELS: Record<RearWingMounting, string> = {
  "swan-neck":   "Swan-Neck (top-mount)",
  "pedestal":    "Pedestal (bottom-mount)",
  "trunk-mount": "Trunk-Mount (bracket)",
};

export const WING_MOUNTING_DESCRIPTIONS: Record<RearWingMounting, string> = {
  "swan-neck":   "CNC aluminium stanchions curve up from the trunk lid, positioning the wing high above the body for maximum downforce",
  "pedestal":    "Straight vertical pedestal uprights rise from the boot floor reinforcement, giving a bolder upright stance",
  "trunk-mount": "Low-profile carbon brackets bolt directly to the trunk lid surface, reducing wing height and visual weight",
};

const VALID_MOUNTINGS_BY_AERO_TYPE: Partial<Record<RearAeroType, RearWingMounting[]>> = {
  "gt-wing": ["swan-neck", "pedestal", "trunk-mount"],
};

export function getValidMountings(aeroType: RearAeroType): RearWingMounting[] {
  return VALID_MOUNTINGS_BY_AERO_TYPE[aeroType] ?? [];
}

export function getDefaultMounting(_aeroType: RearAeroType): RearWingMounting {
  return "swan-neck";
}

/** Kit style IDs that force the spoiler picker to gt-wing and lock it. */
const TRACK_WING_KIT_IDS_FRONTEND = new Set([
  "gt3-track", "gt4-street", "time-attack", "lemans-proto", "trofeo-comp",
  "circuit-king", "drag-racer", "rs-avant-race", "squadra-corse", "aero-pure",
  "endurance-gt", "shooting-brake-gt",
]);

/**
 * Generic fallback list used only on the very first render before the
 * `GET /api/bodykit/spoiler-options` response arrives. The authoritative
 * per-body-style / per-category compatibility map lives on the server in
 * `artifacts/api-server/src/lib/carimage-helpers.ts`.
 */
const FALLBACK_SPOILER_TYPES: ReadonlyArray<RearAeroType> = ["boot-lip", "duck-tail", "gt-wing"];

export const SPOILER_LABELS: Record<RearAeroType, string> = {
  "gt-wing":       "GT Wing",
  "duck-tail":     "Duck-Tail",
  "boot-lip":      "Boot Lip",
  "roofline-lip":  "Roofline Lip",
  "deck-lid-lip":  "Deck Lid Lip",
  "bed-rail-spoiler": "Bed-Rail Spoiler",
  "none":          "None",
};

export const SPOILER_DESCRIPTIONS: Record<RearAeroType, string> = {
  "gt-wing":       "Elevated race-grade wing with swan-neck stanchions for maximum downforce",
  "duck-tail":     "Classic duck-tail moulded into the deck lid for subtle rear downforce",
  "boot-lip":      "Flush surface-bonded lip on the boot lid trailing edge, minimal profile",
  "roofline-lip":  "Slim lip bonded along the top rear edge of the roof or hatch",
  "deck-lid-lip":  "Low-profile deck lid lip preserving the convertible roofline silhouette",
  "bed-rail-spoiler": "Bed-rail lip reducing bed-turbulence drag on the truck body",
  "none":          "Clean tail — no spoiler or wing",
};

/**
 * Thin client-side fallback used only for the very first render, before the
 * server's `GET /api/bodykit/spoiler-options` response arrives. The real
 * per-body-style / per-category compatibility map is owned by the server.
 */
export function getCompatibleSpoilerTypes(_bodyStyle: BodyStyle, _vehicleCategory: VehicleCategory): ReadonlyArray<RearAeroType> {
  return FALLBACK_SPOILER_TYPES;
}

/** Default spoiler type used while the server response is still loading. */
export function getDefaultSpoilerType(_bodyStyle: BodyStyle, _vehicleCategory: VehicleCategory): RearAeroType {
  return FALLBACK_SPOILER_TYPES[0] ?? "boot-lip";
}

/** Returns true if a track kit or hypercar category forces the spoiler to gt-wing. Wide body does NOT lock the spoiler. */
export function isSpoilerLockedToGtWing(kitStyleId: string, vehicleCategory: VehicleCategory): boolean {
  return TRACK_WING_KIT_IDS_FRONTEND.has(kitStyleId) || vehicleCategory === "hypercar";
}

/** Returns the human-readable lock reason when `isSpoilerLockedToGtWing` is true. */
export function getSpoilerLockReason(kitStyleId: string, vehicleCategory: VehicleCategory): string {
  if (vehicleCategory === "hypercar") return "Hypercars always use a full GT wing";
  if (TRACK_WING_KIT_IDS_FRONTEND.has(kitStyleId)) return "This kit style requires a GT wing";
  return "";
}
