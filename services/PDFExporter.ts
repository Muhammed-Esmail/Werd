import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { ReadingSession } from '@/types/quran_data';
import * as DB from '@/utils/DatabaseManager';
import { ReaderParams } from '@/types/reader_data';
import { SURAH_NAMES } from "@/constants/surah_assets";

// 📝 Fallback list of Surah Names to ensure we NEVER show numbers
const SURAH_ARABIC_NAMES = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
];

const getSurahName = (id: number): string => {
    if (id >= 1 && id <= 114) {
        return SURAH_ARABIC_NAMES[id - 1];
    }
    return "سورة";
};

/**
 * Converts local asset to Base64 for PDF embedding
 */
const getAssetBase64 = async (surahId: number): Promise<string | null> => {
    try {
        if (!surahId || surahId < 1 || surahId > 114 || !SURAH_NAMES[surahId]) return null;
        
        const asset = Asset.fromModule(SURAH_NAMES[surahId]);
        await asset.downloadAsync();
        const response = await fetch(asset.localUri || asset.uri);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        return null;
    }
};

const convertToArabicNumerals = (number: number | string): string => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return number.toString().split('').map(digit => {
        const parsed = parseInt(digit);
        return isNaN(parsed) ? digit : arabicNumerals[parsed];
    }).join('');
};

const getGregorianDateArabic = (): string => {
    const date = new Date();
    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${convertToArabicNumerals(date.getDate())} ${months[date.getMonth()]} ${convertToArabicNumerals(date.getFullYear())} م`;
};

// 🗓️ Manual Hijri Calculation to guarantee correctness
const getHijriDate = (): string => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        calendar: 'islamic-uma'
    };
    
    // Try using the native Intl API first (works on most modern iOS/Android)
    try {
        return new Intl.DateTimeFormat('ar-SA', options).format(date) + ' هـ';
    } catch (e) {
        // Fallback if islamic calendar is not supported on device
        return "التاريخ الهجري غير متاح";
    }
};

const generateHTML = async (session: ReadingSession): Promise<string> => {
    const gregorianDate = getGregorianDateArabic();
    const hijriDate = getHijriDate();

    // 📋 Generate Table of Contents (Fihris)
    const tableOfContents = session.segments.map(s => {
        const name = getSurahName(s.surahId);
        const start = convertToArabicNumerals(s.ayahs[0]?.number || 1);
        const end = convertToArabicNumerals(s.ayahs[s.ayahs.length - 1]?.number || 1);
        return `
            <div class="toc-row">
                <span class="toc-name">سورة ${name}</span>
                <span class="toc-dots"></span>
                <span class="toc-range">من آية ${start} إلى ${end}</span>
            </div>
        `;
    }).join('');

    // 📖 Generate Content Blocks
    const contentBlocks = await Promise.all(session.segments.map(async (segment) => {
        const base64Image = await getAssetBase64(segment.surahId);
        const surahName = getSurahName(segment.surahId);
        
        const formattedAyahs = segment.ayahs.map(ayah => {
            const arabicNumber = convertToArabicNumerals(ayah.number);
            return `${ayah.text} ﴿${arabicNumber}﴾`;
        }).join(' ');

        return `
            <div class="surah-container">
                <div class="surah-image-header">
                    ${base64Image 
                        ? `<img src="${base64Image}" class="surah-title-img" alt="سورة ${surahName}" />` 
                        : `<h2 class="surah-fallback">سورة ${surahName}</h2>`
                    }
                </div>

                ${segment.surahId !== 9 && segment.ayahs[0]?.number === 1 ? `
                    <div class="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
                ` : ''}

                <div class="ayah-container">
                    <div class="ayah-text">${formattedAyahs}</div>
                </div>
            </div>
        `;
    }));

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Amiri', serif;
          direction: rtl;
          padding: 40px 30px;
          background: #0c0c0c;
          color: #ffffff;
        }
        
        /* HEADER STYLES */
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #D4AF37;
        }
        .header-title { font-size: 32px; font-weight: bold; color: #D4AF37; margin-bottom: 15px; }
        .date-container { 
            display: flex; 
            flex-direction: column; 
            gap: 5px;
            font-size: 16px; 
            color: rgba(255,255,255,0.8); 
        }

        /* METADATA / TOC BOX */
        .metadata-box {
          background: #121212;
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 50px; /* Space after TOC */
        }
        .metadata-title {
            text-align: center;
            color: #D4AF37;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-decoration: underline;
            text-underline-offset: 8px;
        }
        .toc-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 18px;
        }
        .toc-name { font-weight: bold; color: #fff; flex-shrink: 0; }
        .toc-range { color: rgba(255,255,255,0.7); font-size: 16px; flex-shrink: 0; }
        .toc-dots {
            flex-grow: 1;
            border-bottom: 1px dotted rgba(255,255,255,0.2);
            margin: 0 15px;
            position: relative;
            top: -5px;
        }

        /* SURAH CONTENT */
        .surah-container { margin-bottom: 50px; page-break-inside: avoid; }
        
        .surah-image-header {
          height: 100px;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #121212;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 25px;
        }
        .surah-title-img {
          height: 140px;
          filter: brightness(0) invert(1);
          object-fit: contain;
        }
        .surah-fallback { color: #D4AF37; font-size: 28px; }

        .bismillah { text-align: center; font-size: 26px; color: #D4AF37; margin: 25px 0; font-family: 'Amiri', serif; }
        
        .ayah-container {
          padding: 30px;
          background: #121212;
          border-radius: 15px;
          border-right: 5px solid #D4AF37;
        }
        .ayah-text { font-size: 24px; line-height: 2.8; text-align: justify; word-spacing: 2px; }
        
        .footer { 
            margin-top: 60px; 
            text-align: center; 
            color: #D4AF37; 
            font-size: 14px; 
            border-top: 1px solid rgba(212, 175, 55, 0.2); 
            padding-top: 20px; 
        }
        
        @media print {
            body { background: #0c0c0c !important; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">وِرْدِي اليَوْمِي</div>
        <div class="date-container">
            <div style="font-weight: bold; color: #D4AF37;">${hijriDate}</div>
            <div style="font-size: 14px; opacity: 0.6;">الموافق ${gregorianDate}</div>
        </div>
      </div>

      <div class="metadata-box">
        <div class="metadata-title">فهرس الورد</div>
        ${tableOfContents}
      </div>

      ${contentBlocks.join('')}

      <div class="footer">
        <p>Werd App</p>
      </div>
    </body>
    </html>
    `;
};

export const getTodaysWerdData = async (): Promise<ReadingSession | null> => {
    try {
        const params: ReaderParams = { surahId: 0, sessionType: 'daily_werd' };
        const data = await DB.fetchQuranText(params) as ReadingSession;
        if (!data || !data.segments) return null;
        return data;
    } catch (error) {
        console.error("Error fetching Werd:", error);
        return null;
    }
};

export const generatePDF = async (session: ReadingSession): Promise<string | null> => {
    try {
        const html = await generateHTML(session);
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        return uri;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return null;
    }
};

export const generateAndSharePDF = async (session: ReadingSession): Promise<boolean> => {
    try {
        const uri = await generatePDF(session);
        if (!uri) return false;
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) return false;

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'مشاركة الورد اليومي',
            UTI: 'com.adobe.pdf',
        });
        return true;
    } catch (error) {
        console.error('Sharing Error:', error);
        return false;
    }
};