import { Text, View } from "react-native"

const formatAyahNumber = (number: number): string => {
const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
return number
    .toString()
    .split('')
    .map(digit => arabicNumerals[parseInt(digit)])
    .join('');
}

export const Ayah = ({text, number}: any) => {
  // Return just the formatted string, not a Text component
  return `${text} ﴿${formatAyahNumber(number)}﴾`;
}