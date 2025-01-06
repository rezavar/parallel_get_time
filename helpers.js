import moment from "jalali-moment";

export const occasionTypes = {
    Shamsi: 0,
    Ghamari: 1,
    Miladi: 2,
}

const arabicToPersianMap = {
    'ك': 'ک',
    'ي': 'ی',
    '٠': '۰',
    '١': '۱',
    '٢': '۲',
    '٣': '۳',
    '٤': '۴',
    '٥': '۵',
    '٦': '۶',
    '٧': '۷',
    '٨': '۸',
    '٩': '۹'
};

export function convertArabicToPersian(text) {
    return text.replace(/[كىي٠١٢٣٤٥٦٧٨٩]/g, char => arabicToPersianMap[char] || char);
}

const englishToPersianMap = {
    '0': '۰',
    '1': '۱',
    '2': '۲',
    '3': '۳',
    '4': '۴',
    '5': '۵',
    '6': '۶',
    '7': '۷',
    '8': '۸',
    '9': '۹'
};
export function convertEnglishNumbersToPersian(text) {
    return text.replace(/[0-9]/g, char => englishToPersianMap[char]);
}

export function convertPersianToEnglish(number) {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let result = number;
    for (let i = 0; i < persianNumbers.length; i++) {
        const regex = new RegExp(persianNumbers[i], 'g');
        result = result.replace(regex, englishNumbers[i]);
    }

    return result;
}




export function getYearObject(year){
    year = (year+'').trim().slice(0,4)
    let date = moment.from(`${year}/01/01`, 'fa', 'YYYY/MM/DD');
    let result  ={}

    while (1) {
        const jy = date.locale('fa').format('YYYY')
        if(jy !== year)
            break;
        const jm = date.locale('fa').format('MM')
        const PDate = date.locale('fa').format('YYYY/MM/DD')
        const MDate = date.locale('en').format('YYYY/MM/DD')

        if(!result[jm])
            result[jm]=[]

        result[jm].push({MDate,PDate})
        date.add(1, 'day');
    }
    return result;
}