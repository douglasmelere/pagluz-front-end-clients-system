export const formatCpfCnpj = (value: string): string => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})?/, (_, a, b, c, d) => [a, b, c, d ? `-${d}` : ''].filter(Boolean).join('.')).replace(/\.(\d{3})\./, '.$1.');
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})?/, (_, a, b, c, d, e) => `${a}.${b}.${c}/${d}${e ? `-${e}` : ''}`);
};

export const formatCep = (value: string): string => {
  const digits = (value || '').replace(/\D/g, '');
  return digits.replace(/(\d{5})(\d{0,3})?/, (_, a, b) => (b ? `${a}-${b}` : a));
};

export const numberToWords = (num: number): string => {
  if (!num && num !== 0) return '';
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const dezenasEspeciais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  
  if (num < 0) return 'menos ' + numberToWords(-num);
  if (num === 0) return 'zero';
  
  let result = '';
  
  // Milhares
  if (num >= 1000) {
    const milhares = Math.floor(num / 1000);
    if (milhares === 1) {
      result += 'mil ';
    } else {
      result += numberToWords(milhares) + ' mil ';
    }
    num = num % 1000;
  }
  
  // Centenas
  if (num >= 100) {
    const centena = Math.floor(num / 100);
    if (centena === 1 && num % 100 === 0) {
      result += 'cem ';
    } else {
      result += centenas[centena] + ' ';
    }
    num = num % 100;
  }
  
  // Dezenas e unidades
  if (num >= 20) {
    const dezena = Math.floor(num / 10);
    const unidade = num % 10;
    result += dezenas[dezena];
    if (unidade > 0) {
      result += ' e ' + unidades[unidade];
    }
  } else if (num >= 10) {
    result += dezenasEspeciais[num - 10];
  } else if (num > 0) {
    result += unidades[num];
  }
  
  return result.trim();
};


