import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';


// 🔗 Database integration
import * as DatabaseManager from '@/utils/DatabaseManager';
import type { UserSettings } from '@/utils/DatabaseManager';

/**
 * 📄 PDFExporter Service
 *
 * Generates and shares PDF of Quran reading portions
 * Supports Arabic text with RTL rendering
 */


interface AyahData {
    number: number;
    text: string;
}

interface SurahInfo {
    id: number;
    nameArabic: string;
    nameEnglish: string;
    type?: 'Meccan' | 'Medinan';
}

interface WerdData {
    surahInfo: SurahInfo;
    ayahs: AyahData[];
    dateGenerated: string;
    pageRange?: string;
}


/**
 * Convert English numbers to Arabic numerals
 */
const convertToArabicNumerals = (number: number): string => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return number
        .toString()
        .split('')
        .map(digit => arabicNumerals[parseInt(digit)])
        .join('');
};

/**
 * Format current date in Arabic
 */
const getFormattedDate = (): string => {
    const date = new Date();
    const months = [
        'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};

/**
 * Generate HTML content for PDF with app theme
 * Dark background, gold accents - matches app styling
 */
const generateHTML = (data: WerdData): string => {
    const { surahInfo, ayahs, dateGenerated, pageRange } = data;

    const formattedAyahs = ayahs.map(ayah => {
        const arabicNumber = convertToArabicNumerals(ayah.number);
        return `${ayah.text} ﴿${arabicNumber}﴾`;
    }).join(' ');

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
       
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Amiri', serif;
          direction: rtl;
          text-align: right;
          padding: 40px 30px;
          background: #0c0c0c;
          color: #ffffff;
          line-height: 2.5;
        }

       
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 25px;
          border-bottom: 2px solid #D4AF37;
        }

        .header-title {
          font-size: 28px;
          font-weight: bold;
          color: #D4AF37;
          margin-bottom: 12px;
          letter-spacing: 2px;
        }

        .header-date {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.42);


        .surah-header {
          text-align: center;
          margin: 35px 0;
          padding: 25px;
          background: #121212;
          border-radius: 15px;
          border: 1px solid #1F1F1F;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
        }

        .surah-name-arabic {
          font-size: 32px;
          font-weight: bold;
          color: #D4AF37;
          margin-bottom: 10px;
        }

        .surah-name-english {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
        }

        .surah-type {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.42);
        }

       
        .bismillah {
          text-align: center;
          font-size: 24px;
          color: #D4AF37;
          margin: 30px 0;
          font-weight: bold;
          padding: 15px;
          background: rgba(212, 175, 55, 0.08);
          border-radius: 10px;
        }

       
        .ayah-container {
          margin: 35px 0;
          padding: 30px;
          background: #121212;
          border-radius: 15px;
          border: 1px solid #1F1F1F;
          border-right: 4px solid #D4AF37;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .ayah-text {
          font-size: 22px;
          line-height: 2.8;
          text-align: justify;
          color: #ffffff;
          word-spacing: 8px;
          letter-spacing: 0.5px;
        }

        .footer {
          margin-top: 50px;
          padding-top: 25px;
          border-top: 2px solid #D4AF37;
          text-align: center;
        }

        .page-range {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
        }

        .app-branding {
          margin-top: 15px;
          padding: 15px;
          background: #121212;
          border-radius: 10px;
          border: 1px solid #1F1F1F;
        }

        .app-name {
          color: #D4AF37;
          font-weight: bold;
          font-size: 16px;
        }

        .app-tagline {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.42);
          margin-top: 5px;
        }

        
        .divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            #D4AF37,
            transparent
          );
          margin: 20px 0;
        }

        
        @media print {
          body {
            padding: 20px;
          }
          
          .ayah-container {
            page-break-inside: avoid;
          }

          .surah-header {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      
      
      <div class="header">
        <div class="header-title">وِرْدِي اليَوْمِي</div>
        <div class="divider"></div>
        <div class="header-date">${dateGenerated}</div>
      </div>

      
      <div class="surah-header">
        <div class="surah-name-arabic">${surahInfo.nameArabic}</div>
        <div class="surah-name-english">${surahInfo.nameEnglish}</div>
        ${surahInfo.type ? `<div class="surah-type">${surahInfo.type}</div>` : ''}
      </div>

     
      ${surahInfo.id !== 9 ? `
        <div class="bismillah">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </div>
      ` : ''}

      
      <div class="ayah-container">
        <div class="ayah-text">
          ${formattedAyahs}
        </div>
      </div>

     
      <div class="divider"></div>

      
      <div class="footer">
        ${pageRange ? `<div class="page-range">الصفحات ${pageRange}</div>` : ''}
        
        <div class="app-branding">
          <div class="app-name">Werd App</div>
          <div class="app-tagline">تطبيق الورد اليومي</div>
        </div>
      </div>

    </body>
    </html>
  `;
};

/**
 * Generate PDF from Werd data
 *
 * @param werdData - The Werd portion to convert to PDF
 * @returns URI of generated PDF file
 */
export const generatePDF = async (werdData: WerdData): Promise<string | null> => {
    try {
        console.log(' Generating PDF...');
        console.log(`   Surah: ${werdData.surahInfo.nameEnglish}`);
        console.log(`   Ayahs: ${werdData.ayahs.length}`);

        const html = generateHTML(werdData);

        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
        });

        console.log(' PDF generated successfully!');
        console.log(`   File: ${uri}`);

        return uri;

    } catch (error) {
        console.error(' Failed to generate PDF:', error);
        return null;
    }
};

/**
 * Generate and share PDF
 * Opens native share dialog
 */
export const generateAndSharePDF = async (werdData: WerdData): Promise<boolean> => {
    try {
        const uri = await generatePDF(werdData);

        if (!uri) {
            console.log(' PDF generation failed, cannot share');
            return false;
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            console.log('Sharing not available on this device');
            return false;
        }

        console.log('📤 Opening share dialog...');
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Your Werd',
            UTI: 'com.adobe.pdf',
        });

        console.log(' Share dialog opened successfully');
        return true;

    } catch (error) {
        console.error(' Failed to share PDF:', error);
        return false;
    }
};

/**
 * Generate PDF for preview (without sharing)
 * Useful for testing
 */
export const generatePDFPreview = async (werdData: WerdData): Promise<string | null> => {
    return await generatePDF(werdData);
};


/**
 * Fetch today's Werd data from database
 * Uses the Segmentation Engine (Developer 2)
 */
export const getTodaysWerdData = async (): Promise<WerdData | null> => {
    try {
        console.log(' Fetching today\'s Werd from database...');

        const settings = await DatabaseManager.getSettings() as UserSettings[];

        if (!settings || settings.length === 0) {
            console.log(' No user settings found in database');
            return null;
        }

        const currentWerdId = settings[0].currentWerd;
        console.log(`   Current Werd ID: ${currentWerdId}`);

        const params = {
            surahId: 0,
            sessionType: 'daily_werd' as const
        };

        const readingSession = await DatabaseManager.fetchQuranText(params);

        if (!readingSession.segments || readingSession.segments.length === 0) {
            console.log(' No segments found for today\'s Werd');
            return null;
        }

        console.log(` Found ${readingSession.segments.length} Surah segment(s)`);
        console.log(`   Total ayahs: ${readingSession.segments.reduce((sum, seg) => sum + seg.ayahs.length, 0)}`);

        if (readingSession.segments.length === 1) {
            const segment = readingSession.segments[0];

            const werdData: WerdData = {
                surahInfo: {
                    id: segment.surahId,
                    nameArabic: segment.surahNameArabic || '',
                    nameEnglish: segment.surahNameEnglish || '',
                    type: segment.surahType,
                },
                ayahs: segment.ayahs,
                dateGenerated: getFormattedDate(),
                pageRange: undefined, // TODO: Get from verse page numbers
            };

            console.log(` Single Surah: ${werdData.surahInfo.nameEnglish}`);
            return werdData;

        } else {
            console.log('Multi-Surah Werd detected. Using first Surah for now.');

            const firstSegment = readingSession.segments[0];

            const werdData: WerdData = {
                surahInfo: {
                    id: firstSegment.surahId,
                    nameArabic: firstSegment.surahNameArabic || '',
                    nameEnglish: firstSegment.surahNameEnglish || '',
                    type: firstSegment.surahType,
                },
                ayahs: firstSegment.ayahs,
                dateGenerated: getFormattedDate(),
                pageRange: undefined,
            };

            console.log(` Using first Surah: ${werdData.surahInfo.nameEnglish}`);
            return werdData;
        }

    } catch (error) {
        console.error(' Failed to fetch today\'s Werd data:', error);
        console.error('   Error details:', error);
        return null;
    }
};

/**
 * Generate and share PDF for today's Werd (using real database)
 */
export const generateAndShareTodaysWerd = async (): Promise<boolean> => {
    try {
        console.log(' Generating PDF for today\'s Werd...');

        const werdData = await getTodaysWerdData();

        if (!werdData) {
            console.log(' Could not fetch Werd data from database');
            console.log(' Falling back to mock data for testing');

            return await generateAndSharePDF(getMockWerdData());
        }

        console.log(' Using real database data for PDF');

        return await generateAndSharePDF(werdData);

    } catch (error) {
        console.error(' Failed to generate PDF for today\'s Werd:', error);

        // Fallback to mock
        console.log(' Falling back to mock data due to error');
        return await generateAndSharePDF(getMockWerdData());
    }
};


/**
 * Generate mock Werd data for testing
 * TODO: Replace with real data from Segmentation Engine (Developer 2)
 */
export const getMockWerdData = (): WerdData => {
    return {
        surahInfo: {
            id: 2,
            nameArabic: 'البقرة',
            nameEnglish: 'Al-Baqarah',
            type: 'Medinan',
        },
        ayahs: [
            {
                number: 1,
                text: 'الٓمٓ',
            },
            {
                number: 2,
                text: 'ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ',
            },
            {
                number: 3,
                text: 'ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ',
            },
            {
                number: 4,
                text: 'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ',
            },
            {
                number: 5,
                text: 'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ',
            },
        ],
        dateGenerated: getFormattedDate(),
        pageRange: '2-3',
    };
};